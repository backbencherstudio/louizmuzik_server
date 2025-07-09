/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { packService } from "./pack.service";
import busboy from "busboy";
import AWS from "aws-sdk";
import { Pack } from "./pack.module";


const bucketName = process.env.BUCKET_NAME!;

const s3 = new AWS.S3({
    region: process.env.REGION!,
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.ACCESS_SECRET_key!,
    httpOptions: {
        timeout: 60 * 60 * 1000, // 1 hour timeout for large file uploads
    },
    maxRetries: 3,
});


const getAllPackFromDB = catchAsync(async (req, res) => {
    const result = await packService.getAllPackFromDB();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get Pack successfully',
        data: result,
    });
});

const createPackIntoDB = catchAsync(async (req, res) => {
    const bb = busboy({ headers: req.headers });
    const fields: any = {};
    let uploadPromises: Promise<AWS.S3.ManagedUpload.SendData>[] = [];
    let thumbnailImageUrl: string | null = null;
    let audioPathUrl: string | null = null;
    let zipPathUrl: string | null = null;

    bb.on("file", (fieldname: any, file: any, filename: any, encoding: any, mimetype: any) => {
        let realFilename = filename;
        if (filename && typeof filename === "object" && "filename" in filename) {
            realFilename = (filename as any).filename;
        }
        let cleanFilename = realFilename
            .replace(/\s+/g, "_") 
            .replace(/[^a-zA-Z0-9._-]/g, "") 
            .toLowerCase();
        const key = `${Date.now()}-${cleanFilename}`;
        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: file,
            ContentType: mimetype,
        };
        const uploadPromise = s3.upload(uploadParams).promise();
        uploadPromise.then(data => {
            if (fieldname === 'thumbnail_image') {
                thumbnailImageUrl = data.Location;
            } else if (fieldname === 'audio_path') {
                audioPathUrl = data.Location;
            } else if (fieldname === 'zip_path') {
                zipPathUrl = data.Location;
            }
        });
        uploadPromises.push(uploadPromise);
    });
    bb.on("field", (fieldname, val) => {
        fields[fieldname] = val;
    });
    bb.on("error", (err) => {
        console.error("Busboy error:", err);
        res.status(500).send({ message: "File upload failed" });
    });
    bb.on("finish", async () => {
        try {
            await Promise.all(uploadPromises);
            if (!thumbnailImageUrl || !audioPathUrl) {
                return res.status(400).send({ message: "Both thumbnail image and audio file must be uploaded" });
            }
            const payload = {
                ...fields,
                thumbnail_image: thumbnailImageUrl,
                audio_path: audioPathUrl,
                zip_path: zipPathUrl || null,
            };
            const result = await packService.createPackIntoDB(payload);
            sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: 'Pack created successfully',
                data: result,
            });
        } catch (error) {
            console.error("S3 upload error:", error);
            res.status(500).send({ message: "Upload failed", error });
        }
    });
    req.pipe(bb);
});

const updatePackIntoDB = catchAsync(async (req, res) => {
    const { packId } = req.params;
    const bb = busboy({ headers: req.headers });
    const fields: any = {};
    let uploadPromises: Promise<AWS.S3.ManagedUpload.SendData>[] = [];
    let thumbnailImageUrl: string | null = null;
    let audioPathUrl: string | null = null;
    let zipPathUrl: string | null = null;
    const pack = await Pack.findById(packId);
    if (!pack) {
        return res.status(404).send({ message: "Pack not found" });
    }
    const oldThumbnailImageUrl = pack.thumbnail_image;
    const oldAudioPathUrl = pack.audio_path;
    const oldZipPathUrl = pack.zip_path;
    const getS3KeyFromUrl = (url: string | null): string | null => {
        if (!url) return null;
        const urlObj = new URL(url);
        const key = urlObj.pathname.substring(1);
        return key || null;
    };
    const oldThumbnailImageKey = getS3KeyFromUrl(oldThumbnailImageUrl);
    const oldAudioPathKey = getS3KeyFromUrl(oldAudioPathUrl);
    const oldZipPathKey = getS3KeyFromUrl(oldZipPathUrl as string);

    bb.on("file", (fieldname: any, file: any, filename: any, encoding: any, mimetype: any) => {
        let realFilename = filename;
        if (filename && typeof filename === "object" && "filename" in filename) {
            realFilename = (filename as any).filename;
        }
        let cleanFilename = realFilename
            .replace(/\s+/g, "_") 
            .replace(/[^a-zA-Z0-9._-]/g, "")
            .toLowerCase(); 

        const key = `${Date.now()}-${cleanFilename}`;
        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: file,
            ContentType: mimetype,
        };

        const uploadPromise = s3.upload(uploadParams).promise();
        uploadPromise.then(data => {
            if (fieldname === 'thumbnail_image') {
                thumbnailImageUrl = data.Location;
            } else if (fieldname === 'audio_path') {
                audioPathUrl = data.Location;
            } else if (fieldname === 'zip_path') {
                zipPathUrl = data.Location;
            }
        });
        uploadPromises.push(uploadPromise);
    });
    bb.on("field", (fieldname, val) => {
        fields[fieldname] = val;
    });
    bb.on("error", (err) => {
        console.error("Busboy error:", err);
        res.status(500).send({ message: "File upload failed" });
    });
    bb.on("finish", async () => {
        try {
            await Promise.all(uploadPromises);
            if (oldThumbnailImageKey && thumbnailImageUrl) {
                await s3.deleteObject({ Bucket: bucketName, Key: oldThumbnailImageKey }).promise();
                console.log("Deleting old thumbnail image from S3:", oldThumbnailImageKey);
            }
            if (oldAudioPathKey && audioPathUrl) {
                await s3.deleteObject({ Bucket: bucketName, Key: oldAudioPathKey }).promise();
                console.log("Deleting old audio file from S3:", oldAudioPathKey);
            }
            if (oldZipPathKey && zipPathUrl) {
                await s3.deleteObject({ Bucket: bucketName, Key: oldZipPathKey }).promise();
                console.log("Deleting old zip file from S3:", oldZipPathKey);
            }
            const payload = {
                ...fields,
                thumbnail_image: thumbnailImageUrl || pack.thumbnail_image, 
                audio_path: audioPathUrl || pack.audio_path, 
                zip_path: zipPathUrl || pack.zip_path,
            };
            const result = await packService.updatePackIntoDB(packId, payload);
            sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Pack updated successfully",
                data: result,
            });
        } catch (error) {
            console.error("S3 upload error:", error);
            res.status(500).send({ message: "Upload failed", error });
        }
    });
    req.pipe(bb);
});


const getSingleUserAllPackFromDB = catchAsync(async (req, res) => {
    const result = await packService.getSingleUserAllPackFromDB(req.params.userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get single user all Pack successfully',
        data: result,
    });
});


const selectFavoritePack = catchAsync(async (req, res) => {
    const packId = req.params.packId
    const userId = req.query.userId
    const result = await packService.selectFavoritePack(packId as string, userId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        // message: 'Melody has been successfully added to your favourites.',
        message: result.message,
        data: true,
    });
});


const getSinglePackAndAllPackEachUser = catchAsync(async (req, res) => {
    const result = await packService.getSinglePackAndAllPackEachUser(req.params.packId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get single pack data and each user all Pack data',
        data: result,
    });
});


const deleteSinglePackByUser = catchAsync(async (req, res) => {
    const result = await packService.deleteSinglePackByUser(req.params.packId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Pack Deleted successfully',
        data: result,
    });
});

const packPurchaseDataStoreIntoDB = catchAsync(async (req, res) => {
    const result = await packService.packPurchaseDataStoreIntoDB(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment Successfully , you can access your pack on your dashboard',
        data: result,
    });
});


export const packController = {
    getAllPackFromDB,
    createPackIntoDB,
    updatePackIntoDB,
    getSingleUserAllPackFromDB,
    selectFavoritePack,
    getSinglePackAndAllPackEachUser,
    deleteSinglePackByUser,
    packPurchaseDataStoreIntoDB
}