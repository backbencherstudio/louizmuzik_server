import mongoose from "mongoose"
import { User } from "../User/user.model"
import { Tmelody } from "./melody.interface"
import { Melody } from "./melody.module"

const getAllMelodyes = async () => {
  const result = await Melody.find();
  return result
}

const melodyCreateByProducer = async (payload: Tmelody) => {
  const result = await Melody.create(payload)

  if (result) {
    await User.findByIdAndUpdate(
      { _id: payload.userId },
      { $inc: { melodiesCounter: 1 } },
      { new: true, runValidators: true }
    )
  }

  return result
}

const getAllMelodesEachProducer = async (userId: string) => {
  const result = await Melody.find({ userId })
  return result
}

const deleteMelodesEachProducer = async (melodyId: string, userId: string) => {
  const result = await Melody.deleteOne({ _id: melodyId })

  if (result?.acknowledged && result?.deletedCount > 0) {
    await User.findByIdAndUpdate(
      { _id: userId },
      { $inc: { melodiesCounter: -1 } },
      { new: true, runValidators: true }
    )
  }
  return result
}

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
  const result = await Melody.findByIdAndUpdate({ _id: id }, { $inc: { downloads: 1 } })
  return result
}


export const melodyService = {
  getAllMelodyes,
  melodyCreateByProducer,
  getAllMelodesEachProducer,
  deleteMelodesEachProducer,
  selectFavoriteMelody,
  eachMelodyDownloadCounter
}