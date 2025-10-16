/* eslint-disable no-useless-escape */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { melodyService } from "./melody.service";
import AWS from "aws-sdk";
import busboy from "busboy";
import { Melody } from "./melody.module";

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


const getAllMelodyes = catchAsync(async (req, res) => {
    const result = await melodyService.getAllMelodyes();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get all melodies',
        data: result,
    });
});

const melodyCreateByProducer = catchAsync(async (req, res) => {
    const bb = busboy({ headers: req.headers });
    const fields: any = {};
    let uploadPromises: Promise<AWS.S3.ManagedUpload.SendData>[] = [];
    let audioUrl: string | null = null;

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
            if (fieldname === 'audioUrl') {
                audioUrl = data.Location;
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
            if (!audioUrl) {
                return res.status(400).send({ message: " audio files must be uploaded" });
            }
            const payload = {
                ...fields,
                audioUrl,
            };
            const result = await melodyService.melodyCreateByProducer(payload);
            sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Melody uploaded successfully",
                data: result,
            });
        } catch (error) {
            console.error(176, "S3 upload error:", error);
            res.status(500).send({ message: "Upload failed", error });
        }
    });
    req.pipe(bb);
});



const melodyUpdateByProducer = catchAsync(async (req, res) => {
    const { melodyId } = req.params;
    const bb = busboy({ headers: req.headers });
    const fields: any = {};
    let uploadPromises: Promise<AWS.S3.ManagedUpload.SendData>[] = [];
    let audioUrl: string | null = null;
    let oldAudioUrl: string | null = null;

    const melody = await Melody.findById(melodyId);
    if (!melody) {
        return res.status(404).send({ message: "Melody not found" });
    }

    oldAudioUrl = melody.audioUrl;

    const getS3KeyFromUrl = (url: string | null): string | null => {
        if (!url) return null;
        const urlObj = new URL(url);
        const key = urlObj.pathname.substring(1); 
        return key || null;
    };
    const oldAudioKey = getS3KeyFromUrl(oldAudioUrl);

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
                if (fieldname === 'audioUrl') {
                audioUrl = data.Location;
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
            if (oldAudioKey && audioUrl) {
                console.log("Deleting old audio from S3:", oldAudioKey);
                await s3.deleteObject({ Bucket: bucketName, Key: oldAudioKey }).promise();
            }
            const payload = {
                ...fields,
                audioUrl: audioUrl || melody.audioUrl, 
            };

            const result = await melodyService.melodyUpdateByProducer(melodyId, payload);

            sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Melody updated successfully",
                data: result,
            });
        } catch (error) {
            console.error(292, "S3 upload error:", error);
            res.status(500).send({ message: "Upload failed", error });
        }
    });

    req.pipe(bb);
});


const getAllMelodesEachProducer = catchAsync(async (req, res) => {
    const result = await melodyService.getAllMelodesEachProducer(req.params.userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get single producer all melody successfully',
        data: result,
    });
});

const deleteMelodesEachProducer = catchAsync(async (req, res) => {
    const result = await melodyService.deleteMelodesEachProducer(req.params.melodyId, req.query.userId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'melody deleted successfully',
        data: result,
    });
});

const selectFavoriteMelody = catchAsync(async (req, res) => {
    const melodyId = req.params.melodyId
    const userId = req.query.userId
    const result = await melodyService.selectFavoriteMelody(melodyId as string, userId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: true,
    });
});

const eachMelodyDownloadCounter = catchAsync(async (req, res) => {
    const melodyId = req.params.melodyId
    await melodyService.eachMelodyDownloadCounter(melodyId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Melody download successfully',
        data: true,
    });
});

const melodyDownloadCounterForEachProducer = catchAsync(async (req, res) => {
    const producerId = req.params.producerId
    const result = await melodyService.melodyDownloadCounterForEachProducer(producerId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Daily Melody download status',
        data: result,
    });
});

const melodyPlay = catchAsync(async (req, res) => {
    const melodyId = req.params.melodyId
    await melodyService.melodyPlay(melodyId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Melody play',
        data: true,
    });
});

const getSingleMelodyData = catchAsync(async (req, res) => {
    const melodyId = req.params.melodyId
    const result = await melodyService.getSingleMelodyData(melodyId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Single melody get successfully',
        data: result,
    });
});



export const melodyController = {
    getAllMelodyes,
    melodyCreateByProducer,
    melodyUpdateByProducer,
    getAllMelodesEachProducer,
    deleteMelodesEachProducer,
    selectFavoriteMelody,
    eachMelodyDownloadCounter,
    melodyDownloadCounterForEachProducer,
    melodyPlay,
    getSingleMelodyData
}