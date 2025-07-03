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


// const melodyCreateByProducer = catchAsync(async (req, res) => {
//     const bb = busboy({ headers: req.headers });
//     const fields: any = {};
//     let uploadPromises: Promise<AWS.S3.ManagedUpload.SendData>[] = [];
//     let imageUrl: string | null = null;
//     let audioUrl: string | null = null;

//     bb.on("file", (fieldname: any, file: any, filename: any, encoding: any, mimetype: any) => {
//         let realFilename = filename;
//         if (filename && typeof filename === "object" && "filename" in filename) {
//             realFilename = (filename as any).filename;
//         }
//         const safeFilename = typeof realFilename === "string" ? realFilename : "unknown-file";
//         const key = `${Date.now()}-${safeFilename.replace(/\s/g, "_")}`;        
//         const uploadParams = {
//             Bucket: bucketName,
//             Key: key,
//             Body: file,
//             ContentType: mimetype,
//         };
//         const uploadPromise = s3.upload(uploadParams).promise();
//         uploadPromise.then(data => {
//             if (fieldname === 'image') {
//                 imageUrl = data.Location;
//             } else if (fieldname === 'audioUrl') {
//                 audioUrl = data.Location;
//             }
//         });
//         uploadPromises.push(uploadPromise);
//     });
//     bb.on("field", (fieldname, val) => {
//         fields[fieldname] = val;
//     });
//     bb.on("error", (err) => {
//         console.error("Busboy error:", err);
//         res.status(500).send({ message: "File upload failed" });
//     });

//     bb.on("finish", async () => {
//         try {
//             await Promise.all(uploadPromises);
//             if (!imageUrl || !audioUrl) {
//                 return res.status(400).send({ message: "Both image and audio files must be uploaded" });
//             }
//             const payload = {
//                 ...fields,
//                 image : imageUrl,
//                 audioUrl,
//             };
//             const result = await melodyService.melodyCreateByProducer(payload);
//             sendResponse(res, {
//                 statusCode: httpStatus.OK,
//                 success: true,
//                 message: "Melody uploaded successfully",
//                 data: result,
//             });
//         } catch (error) {
//             console.error("S3 upload error:", error);
//             res.status(500).send({ message: "Upload failed", error });
//         }
//     });

//     req.pipe(bb);
// });

const melodyCreateByProducer = catchAsync(async (req, res) => {
    const bb = busboy({ headers: req.headers });
    const fields: any = {};
    let uploadPromises: Promise<AWS.S3.ManagedUpload.SendData>[] = [];
    let imageUrl: string | null = null;
    let audioUrl: string | null = null;

    //  const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;  

    bb.on("file", (fieldname: any, file: any, filename: any, encoding: any, mimetype: any) => {
        let realFilename = filename;
        if (filename && typeof filename === "object" && "filename" in filename) {
            realFilename = (filename as any).filename;
        }

        // Clean the filename by removing spaces and unnecessary characters
        let cleanFilename = realFilename
            .replace(/\s+/g, "_")  // Replace all spaces with underscores
            .replace(/[^a-zA-Z0-9._-]/g, "")  // Remove unwanted characters (anything other than letters, numbers, underscores, periods, or hyphens)
            .toLowerCase();  // Optionally, convert the filename to lowercase

        // Ensure uniqueness by appending Date.now()
        const key = `${Date.now()}-${cleanFilename}`;

        // Check the file size before uploading
        // if (file.truncated || file.bytesRead > MAX_FILE_SIZE) {
        //     return res.status(400).send({ message: "File size exceeds the 5GB limit" });
        // }

        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: file,
            ContentType: mimetype,
        };

        const uploadPromise = s3.upload(uploadParams).promise();
        uploadPromise.then(data => {
            if (fieldname === 'image') {
                imageUrl = data.Location;
            } else if (fieldname === 'audioUrl') {
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
            if (!imageUrl || !audioUrl) {
                return res.status(400).send({ message: "Both image and audio files must be uploaded" });
            }
            const payload = {
                ...fields,
                image: imageUrl,
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
            console.error("S3 upload error:", error);
            res.status(500).send({ message: "Upload failed", error });
        }
    });

    req.pipe(bb);
});





const melodyUpdateByProducer = catchAsync(async (req, res) => {
    const { melodyId } = req.params; // Assuming you're passing the melodyId in the URL parameters
    const bb = busboy({ headers: req.headers });
    const fields: any = {};
    let uploadPromises: Promise<AWS.S3.ManagedUpload.SendData>[] = [];
    let imageUrl: string | null = null;
    let audioUrl: string | null = null;
    let oldImageUrl: string | null = null;
    let oldAudioUrl: string | null = null;

    // Fetch the existing melody to get current image and audio URLs
    const melody = await Melody.findById(melodyId);
    if (!melody) {
        return res.status(404).send({ message: "Melody not found" });
    }

    // Store current URLs to delete from S3 later if needed
    oldImageUrl = melody.image;
    oldAudioUrl = melody.audioUrl;

    // Function to extract the file key from the full S3 URL
    const getS3KeyFromUrl = (url: string | null): string | null => {
        if (!url) return null;
        const urlObj = new URL(url);
        const key = urlObj.pathname.substring(1); // Extract the path from the URL, skipping the leading "/"
        return key || null;
    };
    const oldImageKey = getS3KeyFromUrl(oldImageUrl);
    const oldAudioKey = getS3KeyFromUrl(oldAudioUrl);

    bb.on("file", (fieldname: any, file: any, filename: any, encoding: any, mimetype: any) => {
        let realFilename = filename;
        if (filename && typeof filename === "object" && "filename" in filename) {
            realFilename = (filename as any).filename;
        }
        // const safeFilename = typeof realFilename === "string" ? realFilename : "unknown-file";
        // const key = `${Date.now()}-${safeFilename.replace(/\s/g, "_")}`;
        let cleanFilename = realFilename
            .replace(/\s+/g, "_")  // Replace all spaces with underscores
            .replace(/[^a-zA-Z0-9._-]/g, "")  // Remove unwanted characters (anything other than letters, numbers, underscores, periods, or hyphens)
            .toLowerCase();  // Optionally, convert the filename to lowercase

        // Ensure uniqueness by appending Date.now()
        const key = `${Date.now()}-${cleanFilename}`;

        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: file,
            ContentType: mimetype,
        };

        const uploadPromise = s3.upload(uploadParams).promise();
        uploadPromise.then(data => {
            if (fieldname === 'image') {
                imageUrl = data.Location;
            } else if (fieldname === 'audioUrl') {
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
            // Wait for all uploads to finish
            await Promise.all(uploadPromises);

            // Delete the old files from S3, if new files are provided
            if (oldImageKey && imageUrl) {
                console.log("Deleting old image from S3:", oldImageKey);
                await s3.deleteObject({ Bucket: bucketName, Key: oldImageKey }).promise();
            }

            if (oldAudioKey && audioUrl) {
                console.log("Deleting old audio from S3:", oldAudioKey);
                await s3.deleteObject({ Bucket: bucketName, Key: oldAudioKey }).promise();
            }

            // Build the update payload with the new values
            const payload = {
                ...fields,
                image: imageUrl || melody.image, // If no new image, keep the old one
                audioUrl: audioUrl || melody.audioUrl, // If no new audio, keep the old one
            };

            const result = await melodyService.melodyUpdateByProducer(melodyId, payload);

            sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Melody updated successfully",
                data: result,
            });
        } catch (error) {
            console.error("S3 upload error:", error);
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
        // message: 'Melody has been successfully added to your favourites.',
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



export const melodyController = {
    getAllMelodyes,
    melodyCreateByProducer,
    melodyUpdateByProducer,
    getAllMelodesEachProducer,
    deleteMelodesEachProducer,
    selectFavoriteMelody,
    eachMelodyDownloadCounter,
    melodyPlay
}