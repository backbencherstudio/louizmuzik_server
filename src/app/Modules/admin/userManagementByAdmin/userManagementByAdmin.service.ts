/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose"
import { DailyMelodyDownloadStats, Melody } from "../../Melody/melody.module"
import { Pack } from "../../Pack/pack.module"
import { User } from "../../User/user.model"

const getALlUserByAdmin = async () => {
    // const result = await User.find({role : 'user', isPro : true}).select("-password")
    const result = await User.find({ role: 'user' }).select("-password")
    return result
}

//url/admin/users ( role : free - pro ) [isPro : true / false]
const changeUsersSubscriptionStatus = async (userId: string) => {
    const userData = await User.findById({ _id: userId }).select("isPro")
    await User.findByIdAndUpdate(
        { _id: userId },
        { isPro: !userData?.isPro },
        { runValidators: true, new: true }
    )
    return true
}

// const deleteUser = async(userId : string)=>{
//     const userData = await User.findById({ _id: userId })
//     if(!userData?.isPro){
//         await Melody.deleteMany({userId})
//         await Pack.deleteMany({userId})
//         await User.findById({_id : userId})
//     }

// }

// const deleteUser = async (userId: string) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const userData = await User.findById(userId).session(session);
//     console.log(userData);


//     if (!userData) throw new Error("User not found");

//     if (!userData.isPro) {
//       await Melody.deleteMany({ userId }).session(session);
//       await Pack.deleteMany({ userId }).session(session);
//       await DailyMelodyDownloadStats.deleteMany({ producerId :userId }).session(session);
//       await User.deleteOne({ _id: userId }).session(session);
//     }

//     await session.commitTransaction();
//     return "User and related data deleted successfully"
//   } catch (error) {
//     await session.abortTransaction();
//     throw new Error("The user is currently subscribed. Please ensure the subscription is canceled before proceeding with the deletion of their account and associated data.")
//   } finally {
//     session.endSession();
//   }
// };

const deleteUser = async (userId: string) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const userData = await User.findById(userId).session(session);

        if (!userData) {
            throw new Error("User not found");
        }

        if (userData.isPro) {
            // If user is subscribed, don't delete anything
            throw new Error("The user is currently subscribed. Please ensure the subscription is canceled before proceeding with the deletion of their account and associated data.");
        }

        // Delete related data
        await Melody.deleteMany({ userId }).session(session);
        await Pack.deleteMany({ userId }).session(session);
        await DailyMelodyDownloadStats.deleteMany({ producerId : userId }).session(session);

        // Finally delete the user
        await User.deleteOne({ _id: userId }).session(session);

        await session.commitTransaction();
        return "User and related data deleted successfully";

    } catch (error: any) {
        await session.abortTransaction();
        return error.message;
    } finally {
        session.endSession();
    }
};



export const adminService = {
    getALlUserByAdmin,
    changeUsersSubscriptionStatus,
    deleteUser
}