/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { IPack, IPackPurchase } from "./pack.inteface";
import { DailySealseStats, Pack, PackPurchase } from "./pack.module";
import { User } from "../User/user.model";
import { AppError } from "../../errors/AppErrors";
import httpStatus from "http-status";
import AWS from "aws-sdk";
import dayjs from "dayjs";

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


const getAllPackFromDB = async () => {
  const result = await Pack.find().populate("userId").populate('userId', 'profile_image producer_name role email country');
  return result
}

// const createPackIntoDB = async (payload: IPack) => {
//     const result = await Pack.create(payload)
//     return result
// }

const createPackIntoDB = async (payload: IPack) => {
  const parsedPayload = { ...payload };

  // Handle genre stringified array
  if (typeof parsedPayload.genre === "string") {
    try {
      parsedPayload.genre = JSON.parse(parsedPayload.genre);
    } catch (error) {
      throw new Error("Invalid genre format. It must be a JSON array string.");
    }
  }

  // Ensure it's an array of strings
  if (!Array.isArray(parsedPayload.genre)) {
    throw new Error("Genre must be an array.");
  }

  const result = await Pack.create(parsedPayload);
  return result;
};



// const updatePackIntoDB = async (packId: string, payload: Partial<IPack>) => {
//     const result = await Pack.findByIdAndUpdate({ _id: packId }, payload, { runValidators: true, new: true });
//     return result
// }

const updatePackIntoDB = async (packId: string, payload: Partial<IPack>) => {
  const parsedPayload = { ...payload };

  if (parsedPayload.genre !== undefined) {
    if (typeof parsedPayload.genre === "string") {
      try {
        parsedPayload.genre = JSON.parse(parsedPayload.genre);
      } catch (error) {
        throw new Error("Invalid genre format. It must be a JSON array string.");
      }
    }

    if (!Array.isArray(parsedPayload.genre)) {
      throw new Error("Genre must be an array.");
    }
  }

  const result = await Pack.findByIdAndUpdate(
    { _id: packId },
    parsedPayload,
    { runValidators: true, new: true }
  );

  return result;
};


const getSingleUserAllPackFromDB = async (userId: string) => {
  const result = await Pack.find({ userId });
  //   const result = await Pack.find({ userId }).populate('userId', 'profile_image producer_name role email country');
  return result;
};


const selectFavoritePack = async (packId: string, userId: string) => {
  const packObjectId = new mongoose.Types.ObjectId(packId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(userObjectId);
  if (!user) {
    throw new Error("User not found");
  }

  const isAlreadyFavorited = user.favourite_packs?.some(
    (id) => id.toString() === packId
  );

  if (isAlreadyFavorited) {
    // Remove from favorites
    await User.findByIdAndUpdate(
      userObjectId,
      { $pull: { favourite_packs: packObjectId } },
      { new: true, runValidators: true }
    );

    await Pack.findByIdAndUpdate(
      packObjectId,
      { $inc: { favorites: -1 } },
      { new: true, runValidators: true }
    );

    return { message: "Pack removed from favourites" };
  } else {
    // Add to favorites
    await User.findByIdAndUpdate(
      userObjectId,
      { $addToSet: { favourite_packs: packObjectId } },
      { new: true, runValidators: true }
    );

    await Pack.findByIdAndUpdate(
      packObjectId,
      { $inc: { favorites: 1 } },
      { new: true, runValidators: true }
    );

    return { message: "Pack added to favourites" };
  }
};

//=== this api for single pack page
const getSinglePackAndAllPackEachUser = async (packId: string) => {
  const singlePackData = await Pack.findById({ _id: packId }).populate("userId").populate('userId', 'profile_image producer_name role email country');;

  if (!singlePackData) throw new AppError(httpStatus.NOT_FOUND, "pack data not found")

  const userIdStr = (singlePackData.userId as any)._id.toString();
  const eachUserAllPack = await Pack.find({ userId: userIdStr })
    .populate('userId', 'profile_image producer_name role email country');

  return {
    singlePackData,
    eachUserAllPack
  }
}

const deleteSinglePackByUser = async (packId: string) => {
  const packData = await Pack.findById(packId).select(["thumbnail_image", "audio_path", "zip_path"]);

  if (!packData) throw new AppError(httpStatus.NOT_FOUND, "Pack not found")
  const getS3KeyFromUrl = (url: string | null): string | null => {
    if (!url) return null;
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  };

  const imageKey = getS3KeyFromUrl(packData.thumbnail_image);
  const audioKey = getS3KeyFromUrl(packData.audio_path);
  const zipKey = getS3KeyFromUrl(packData.zip_path as string);

  try {
    if (imageKey) {
      await s3.deleteObject({ Bucket: bucketName, Key: imageKey }).promise();
      console.log(`Deleting thumbnail image file from S3: ${imageKey}`);
    }

    if (audioKey) {
      await s3.deleteObject({ Bucket: bucketName, Key: audioKey }).promise();
      console.log(`Deleting audio file from S3: ${audioKey}`);
    }

    if (zipKey) {
      await s3.deleteObject({ Bucket: bucketName, Key: zipKey }).promise();
      console.log(`Deleting zip file from S3: ${zipKey}`);
    }

    await Pack.findByIdAndDelete(packId);

    return true;
  } catch (error) {
    console.error("Error deleting pack files or data:", error);
    return false; // If there is any error, return false
  }
};




// const packPurchaseDataStoreIntoDB = async (payload: IPackPurchase[]) => {    
//     const result = await PackPurchase.insertMany(payload)
//     return result
// }

const packPurchaseDataStoreIntoDB = async (payload: IPackPurchase[]) => {
  if (!payload || !payload.length) {
    throw new Error("❌ No pack purchase data provided.");
  }

  // 1️⃣ Aggregate sales/profit per pack
  const aggregatedPacks = payload.reduce((acc, item) => {
    const packId = item.packId.toString();

    if (!acc[packId]) {
      acc[packId] = { salesCount: 0, profit: 0 };
    }

    acc[packId].salesCount += 1;
    acc[packId].profit += item.price;

    return acc;
  }, {} as Record<string, { salesCount: number; profit: number }>);

  // 2️⃣ Aggregate sales per producer for daily stats
  const aggregatedProducers = payload.reduce((acc, item) => {
    const producerId = item.selectedProducerId.toString();

    if (!acc[producerId]) {
      acc[producerId] = 0;
    }

    acc[producerId] += 1; // Each purchase counts as 1 sale

    return acc;
  }, {} as Record<string, number>);

  // 3️⃣ Bulk update packs' sales/profit
  const bulkOps = Object.entries(aggregatedPacks).map(([packId, values]) => ({
    updateOne: {
      filter: { _id: packId },
      update: {
        $inc: {
          sales: values.salesCount,
          profit: values.profit,
        },
      },
    },
  }));

  // 4️⃣ Prepare daily sales stats updates for each producer
  const currentDate = dayjs().format("YYYY-MM-DD");
  const currentDay = dayjs().format("ddd");

  const dailyStatsOps = Object.entries(aggregatedProducers).map(
    ([producerId, salesCount]) => ({
      updateOne: {
        filter: { producerId, date: currentDate },
        update: {
          $inc: { salesCount: salesCount },
          $setOnInsert: { day: currentDay },
        },
        upsert: true,
      },
    })
  );

  // 5️⃣ Execute all DB operations
  const [packUpdateResult, purchaseInsertResult, dailyStatsResult] =
    await Promise.all([
      Pack.bulkWrite(bulkOps),
      PackPurchase.insertMany(payload),
      DailySealseStats.bulkWrite(dailyStatsOps),
    ]);

  return {
    message: "✅ Pack purchases processed successfully.",
    updatedPacks: packUpdateResult.modifiedCount,
    insertedPurchases: purchaseInsertResult.length,
    updatedDailyStats: dailyStatsResult.modifiedCount,
  };
};



// const packPurchaseDataStoreIntoDB = async (payload: IPackPurchase[]) => {
//   if (!payload || !payload.length) {
//     throw new Error("❌ No pack purchase data provided.");
//   }

//   const aggregated = payload.reduce((acc, item) => {
//     const packId = item.packId.toString();

//     if (!acc[packId]) {
//       acc[packId] = { salesCount: 0, profit: 0 };
//     }

//     acc[packId].salesCount += 1;
//     acc[packId].profit += item.price;

//     return acc;
//   }, {} as Record<string, { salesCount: number; profit: number }>);

//   const bulkOps = Object.entries(aggregated).map(([packId, values]) => ({
//     updateOne: {
//       filter: { _id: packId },
//       update: {
//         $inc: {
//           sales: values.salesCount,
//           profit: values.profit,
//         },
//       },
//     },
//   }));



//   // 3️⃣ Run the updates and insert purchases
//   const packUpdateResult = await Pack.bulkWrite(bulkOps);
//   const purchaseInsertResult = await PackPurchase.insertMany(payload);

//   return {
//     message: "✅ Pack purchases processed successfully.",
//     updatedPacks: packUpdateResult.modifiedCount,
//     insertedPurchases: purchaseInsertResult.length,
//   };
// };

const getSingleUserALlPurchaseDataFormDB = async (userId: string) => {
  const result = await PackPurchase.find({ userId })
    .populate({
      path: "packId",
      select: "title producer thumbnail_image audio_path zip_path video_path price description genre"
    })
    .populate({
      path: "selectedProducerId",
      select: "producer_name"
    });

  return result;
};



export const packService = {
  createPackIntoDB,
  updatePackIntoDB,
  getAllPackFromDB,
  getSingleUserAllPackFromDB,
  selectFavoritePack,
  getSinglePackAndAllPackEachUser,
  deleteSinglePackByUser,
  packPurchaseDataStoreIntoDB,
  getSingleUserALlPurchaseDataFormDB
}