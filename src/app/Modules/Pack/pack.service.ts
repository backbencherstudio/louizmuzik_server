import mongoose from "mongoose";
import { IPack } from "./pack.inteface";
import { Pack } from "./pack.module";
import { User } from "../User/user.model";


const getAllPackFromDB = async () => {
    const result = await Pack.find().populate("userId").populate('userId', 'profile_image producer_name role email country');
    return result
}

const createPackIntoDB = async (payload: IPack) => {
    const result = await Pack.create(payload)
    return result
}

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

//=== ekhon single pack er data show kora api hobe, + ukto pack er user er joto pac ache ta sob show hobw 

const deleteSinglePackByUser = async(packId : string)=>{
    const result = await Pack.findByIdAndDelete({_id : packId})
    return result
}


export const packService = {
    createPackIntoDB,
    getAllPackFromDB,
    getSingleUserAllPackFromDB,
    selectFavoritePack,
    deleteSinglePackByUser
}