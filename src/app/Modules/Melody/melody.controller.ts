/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { melodyService } from "./melody.service";
import AWS from "aws-sdk";
import busboy from "busboy";

// const region = process.env.REGION!;
// const accessKeyId = process.env.ACCESS_KEY!;
// const secretAccessKey = process.env.ACCESS_SECRET_key!;
const bucketName = process.env.BUCKET_NAME!;

// const s3 = new AWS.S3({
//     region,
//     accessKeyId,
//     secretAccessKey,
// });

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
    let imageUrl: string | null = null;
    let audioUrl: string | null = null;

    bb.on("file", (fieldname: any, file: any, filename: any, encoding: any, mimetype: any) => {
        let realFilename = filename;
        if (filename && typeof filename === "object" && "filename" in filename) {
            realFilename = (filename as any).filename;
        }
        const safeFilename = typeof realFilename === "string" ? realFilename : "unknown-file";
        const key = `${Date.now()}-${safeFilename.replace(/\s/g, "_")}`;        
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
                image : imageUrl,
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



// const melodyCreateByProducer = catchAsync(async (req, res) => {
//     console.log("hiiittt");
    
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

//         // Determine which file is image and which one is audio
//         if (fieldname === 'image') {
//             uploadPromise.then(data => imageUrl = data.Location);
//         } else if (fieldname === 'audio') {
//             uploadPromise.then(data => audioUrl = data.Location);
//         }

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
//         if (uploadPromises.length === 0 || !imageUrl || !audioUrl) {
//             return res.status(400).send({ message: "Both image and audio files must be uploaded" });
//         }
//         try {
//             // Wait for both uploads to finish
//             await Promise.all(uploadPromises);

//              console.log("hiiittt 222 ");

//             const payload = {
//                 ...fields,
//                 imageUrl,  // Store the image URL
//                 audioUrl,  // Store the audio URL
//             };

//             const result = await melodyService.melodyCreateByProducer(payload);

//              console.log("hiiittt 333");

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
// ========





// const melodyCreateByProducer = catchAsync(async (req, res) => {
//     const bb = busboy({ headers: req.headers });
//     const fields: any = {};
//     let uploadPromise: Promise<AWS.S3.ManagedUpload.SendData> | null = null;
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

//         uploadPromise = s3.upload(uploadParams).promise();
//     });
//     bb.on("field", (fieldname, val) => {
//         fields[fieldname] = val;
//     });
//     bb.on("error", (err) => {
//         console.error("Busboy error:", err);
//         res.status(500).send({ message: "File upload failed" });
//     });
//     bb.on("finish", async () => {
//         if (!uploadPromise) {
//             return res.status(400).send({ message: "No file uploaded" });
//         }
//         try {
//             const data = await uploadPromise;
//             const payload = {
//                 ...fields,
//                 image: data.Location,
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


// const melodyCreateByProducer = catchAsync(async (req, res) => {
//     const imageUrl = (req.file as any)?.location; // multer-s3 puts the full S3 URL in `location`
//     const payload = {
//         ...req.body,
//         image: imageUrl,
//     };
//     const result = await melodyService.melodyCreateByProducer(payload);
//     // const result = await melodyService.melodyCreateByProducer(req.body);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: 'melody created successfully',
//         data: result,
//     });
// });


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
    getAllMelodesEachProducer,
    deleteMelodesEachProducer,
    selectFavoriteMelody,
    eachMelodyDownloadCounter,
    melodyPlay
}