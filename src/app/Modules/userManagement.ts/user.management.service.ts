/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
import bcrypt from 'bcrypt';
import path from 'path';
import { deleteFile } from "../../middleware/deleteFile";
import { filteredObject } from "../../utils/filteredObject";
import { TUser } from "../User/user.interface";
import { User } from "../User/user.model";
import { AppError } from '../../errors/AppErrors';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

const getAbsoluteFilePath = async (dbPath: string) => {
    try {
        const relativePath = dbPath
            .replace(/^\//, '')
            .replace(/^uploads\//, '');
        const uploadsDir = path.join(__dirname, '..', '..', '..', '..', '/uploads');
        return path.join(uploadsDir, relativePath);
    } catch (error) {
        console.error('Error constructing file path:', error);
        return null;
    }
};


const updateUserDataIntoDB = async (userId: string, payload: Partial<TUser>) => {
    const isExistsUserData = await User.findById({ _id: userId }).select("profile_image")
    if (isExistsUserData?.profile_image && payload?.profile_image !== undefined) {
        const absoluteFilePath = await getAbsoluteFilePath(isExistsUserData.profile_image);
        if (absoluteFilePath) {
            await deleteFile(absoluteFilePath);
        }
    }
    const updatedPayload = await filteredObject(payload);
    const result = await User.findByIdAndUpdate({ _id: userId }, updatedPayload, { new: true, runValidators: true })
    return result
}


const changePasswordIntoDB = async (userId: string, paylod: any) => {
    const userData = await User.findById({ _id: userId })
    if (!userData) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    const res = await bcrypt.compare(paylod.old_password, userData?.password)
    if (!res) {
        throw new AppError(httpStatus.FORBIDDEN, 'The current password you entered does not match our records');
    }
    const hashedPassword = await bcrypt.hash(paylod?.new_password, 8);
    await User.findOneAndUpdate({ _id: userId }, { password: hashedPassword }, { new: true, runValidators: true })
}


const followingProducersCalculation = async (currentUserId: string, producerUserId: string) => {
  const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
  const producerUserObjectId = new mongoose.Types.ObjectId(producerUserId);

  const currentUser = await User.findById(currentUserObjectId);
  if (!currentUser) throw new Error("Current user not found");

  const isAlreadyFollowing = currentUser.following.some(
    (id) => id.toString() === producerUserId
  );

  if (isAlreadyFollowing) {
    // Unfollow: remove producer ID from currentUser.following & decrease producer's followersCounter
    await User.findByIdAndUpdate(
      currentUserObjectId,
      { $pull: { following: producerUserObjectId } },
      { new: true, runValidators: true }
    );

    await User.findByIdAndUpdate(
      producerUserObjectId,
      { $inc: { followersCounter: -1 } },
      { new: true, runValidators: true }
    );

    return { message: "You have unfollowed this user." };
  } else {
    //  Follow: add producer ID to currentUser.following & increase producer's followersCounter
    await User.findByIdAndUpdate(
      currentUserObjectId,
      { $addToSet: { following: producerUserObjectId } },
      { new: true, runValidators: true }
    );

    await User.findByIdAndUpdate(
      producerUserObjectId,
      { $inc: { followersCounter: 1 } },
      { new: true, runValidators: true }
    );

    return { message: "You are now following this user." };
  }
};


const allProducersDataWithTopProducersData = async () =>{
const top5Producers = await User.find({ role: "user", isDeleted: false })
  .sort({ followersCounter: -1 })
  .limit(5);

const allProducers = await User.find({
  isDeleted: false,
  role : "user"
});

return { top5Producers, allProducers }
}


//======= following usrs all melody and pack





export const UserManagement = {
    updateUserDataIntoDB,
    changePasswordIntoDB,
    followingProducersCalculation,
    allProducersDataWithTopProducersData
}