import mongoose from "mongoose"
import { User } from "../User/user.model"
import { Tmelody } from "./melody.interface"
import { Melody } from "./melody.module"

const melodyCreateByProducer = async (payload: Tmelody) => {
    const result = await Melody.create(payload)
    return result
}

const getAllMelodesEachProducer = async (userId: string) => {
    const result = await Melody.find({ userId })
    return result
}

const deleteMelodesEachProducer = async (melodyId: string) => {
    const result = await Melody.deleteOne({ _id: melodyId })
    return result
}

// const selectFavoriteMelody = async (melodyId: string, userId: string) => {
//     console.log(melodyId, userId);
//     await Melody.findByIdAndUpdate(
//         { _id: melodyId },
//         { $inc: { favorites: 1 } },
//         { new: true, runValidators: true }
//     )

//     await User.findByIdAndUpdate({_id : userId}, {
//         favourite_melodies : 
//     } )

// }

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



export const melodyService = {
    melodyCreateByProducer,
    getAllMelodesEachProducer,
    deleteMelodesEachProducer,
    selectFavoriteMelody
}