/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose"
import { User } from "../User/user.model"
import { Tmelody } from "./melody.interface"
import { DailyMelodyDownloadStats, Melody } from "./melody.module"
import dayjs from 'dayjs';
import AWS from "aws-sdk";

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

const getAllMelodyes = async () => {
  const result = await Melody.find();
  return result
}

const melodyCreateByProducer = async (payload: Tmelody) => {
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

  const result = await Melody.create(parsedPayload)

  if (result) {
    await User.findByIdAndUpdate(
      { _id: payload.userId },
      { $inc: { melodiesCounter: 1 } },
      { new: true, runValidators: true }
    )
  }
  return result
}

const melodyUpdateByProducer = async (melodyId: string, payload: Partial<Tmelody>) => {
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

  const result = await Melody.findByIdAndUpdate(
    { _id: melodyId },
    parsedPayload,
    { runValidators: true, new: true }
  )
  return result

}

const getAllMelodesEachProducer = async (userId: string) => {
  const result = await Melody.find({ userId })
  return result
}


// const deleteMelodesEachProducer = async (melodyId: string, userId: string) => {

//   const meloayData = await Melody.findById({_id : melodyId}).select(["image", "audioUrl"]);

//   console.log(41, meloayData);

//   console.log(43, userId);


//   // const result = await Melody.deleteOne({ _id: melodyId })

//   // if (result?.acknowledged && result?.deletedCount > 0) {
//   //   await User.findByIdAndUpdate(
//   //     { _id: userId },
//   //     { $inc: { melodiesCounter: -1 } },
//   //     { new: true, runValidators: true }
//   //   )
//   // }

//   return true
// }


const deleteMelodesEachProducer = async (melodyId: string, userId: string) => {
  const melodyData = await Melody.findById(melodyId).select(["image", "audioUrl"]);

  if (!melodyData) throw new Error("Melody not found");

  const getS3KeyFromUrl = (url: string | null): string | null => {
    if (!url) return null;
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  };

  const imageKey = getS3KeyFromUrl(melodyData.image);
  const audioKey = getS3KeyFromUrl(melodyData.audioUrl);

  try {
    if (imageKey) {
      await s3.deleteObject({ Bucket: bucketName, Key: imageKey }).promise();
      console.log(`Deleting image file from S3: ${imageKey}`);
    }

    if (audioKey) {
      await s3.deleteObject({ Bucket: bucketName, Key: audioKey }).promise();
      console.log(`Deleting audio file from S3: ${audioKey}`);
    }

    const result = await Melody.deleteOne({ _id: melodyId });

    if (result?.acknowledged && result?.deletedCount > 0) {
      await User.findByIdAndUpdate(
        { _id: userId },
        { $inc: { melodiesCounter: -1 } },
        { new: true, runValidators: true }
      );
      console.log('Melody deleted successfully');
    }

    return true;
  } catch (error) {
    console.error("Error deleting melody files or data:", error);
    return false;
  }
};



const selectFavoriteMelody = async (melodyId: string, userId: string) => {
  const melodyObjectId = new mongoose.Types.ObjectId(melodyId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(userObjectId);
  if (!user) {
    throw new Error("User not found");
  }

  const isAlreadyFavorited = user?.favourite_melodies.some(
    (id) => id.toString() === melodyId
  );

  if (isAlreadyFavorited) {
    //  Remove
    await User.findByIdAndUpdate(
      userObjectId,
      { $pull: { favourite_melodies: melodyObjectId } },
      { new: true, runValidators: true }
    );

    await Melody.findByIdAndUpdate(
      melodyObjectId,
      { $inc: { favorites: -1 } },
      { new: true, runValidators: true }
    );

    return { message: "Melody removed from favourites" };
  } else {
    //  Add
    await User.findByIdAndUpdate(
      userObjectId,
      { $addToSet: { favourite_melodies: melodyObjectId } },
      { new: true, runValidators: true }
    );

    await Melody.findByIdAndUpdate(
      melodyObjectId,
      { $inc: { favorites: 1 } },
      { new: true, runValidators: true }
    );

    return { message: "Melody added to favourites" };
  }
};


const eachMelodyDownloadCounter = async (id: string) => {
  const melody = await Melody.findByIdAndUpdate(
    { _id: id },
    { $inc: { downloads: 1 } },
    { new: true, runValidators: true }
  );

  if (!melody) throw new Error("Melody not found");

  const currentDate = dayjs().format("YYYY-MM-DD");
  const currentDay = dayjs().format("ddd")

  await DailyMelodyDownloadStats.findOneAndUpdate(
    { producerId: melody.userId, date: currentDate },
    {
      $inc: { downloads: 1 },
      $setOnInsert: { day: currentDay },
    },
    { upsert: true, new: true }
  );

  return melody;
};

const melodyPlay = async (id: string) => {
  await Melody.findByIdAndUpdate({ _id: id }, { $inc: { plays: 1 } }, { new: true, runValidators: true })
}


export const melodyService = {
  getAllMelodyes,
  melodyCreateByProducer,
  melodyUpdateByProducer,
  getAllMelodesEachProducer,
  deleteMelodesEachProducer,
  selectFavoriteMelody,
  eachMelodyDownloadCounter,
  melodyPlay
}