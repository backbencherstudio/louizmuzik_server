import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";

const region = process.env.REGION!;
const accessKeyId = process.env.ACCESS_KEY!;
const secretAccessKey = process.env.ACCESS_SECRET_key!;
const bucketName = process.env.BUCKET_NAME!;

AWS.config.update({
  region,
  accessKeyId,
  secretAccessKey,
});

const s3 = new AWS.S3() as unknown as import("@aws-sdk/client-s3").S3Client;

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
});

export default upload;






// import AWS from "aws-sdk";
// import multer from "multer";
// import multerS3 from "multer-s3";

// // Ensure your environment variables are defined
// const region = process.env.REGION!;
// const accessKeyId = process.env.ACCESS_KEY!;
// const secretAccessKey = process.env.ACCESS_SECRET_key!;
// const bucketName = process.env.BUCKET_NAME!;

// // Use AWS SDK v2 S3 client
// AWS.config.update({
//   accessKeyId,
//   secretAccessKey,
//   region,
// });

// const s3 = new AWS.S3(); // ✅ has .upload() method

// const upload = multer({
//   storage: multerS3({
//     s3,
//     bucket: bucketName,
//     metadata: (req, file, cb) => {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: (req, file, cb) => {
//       const uniqueName = `${Date.now()}-${file.originalname}`;
//       cb(null, uniqueName);
//     },
//   }),
// });

// export default upload;



// import multer from "multer";
// import multerS3 from "multer-s3";
// import { S3Client } from "@aws-sdk/client-s3";

// // Validate your env vars are defined
// const region = process.env.REGION!;
// const accessKeyId = process.env.ACCESS_KEY!;
// const secretAccessKey = process.env.ACCESS_SECRET_key!;
// const bucketName = process.env.BUCKET_NAME!;

// // Create an S3Client (V3)
// const s3Client = new S3Client({
//   region,
//   credentials: {
//     accessKeyId,
//     secretAccessKey,
//   },
// });

// // Configure multer with multer-s3
// const upload = multer({
//   storage: multerS3({
//     s3: s3Client,
//     bucket: bucketName,
//     metadata: (req, file, cb) => {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: (req, file, cb) => {
//       cb(null, file.originalname);
//     },
//   }),
// });

// export default upload;
