/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose"
import { DailyMelodyDownloadStats, Melody } from "../../Melody/melody.module"
import { DailySealseStats, Pack, PackPurchase } from "../../Pack/pack.module"
import { User } from "../../User/user.model"
import { Transactions } from "../../Payment/payment.module"

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
        await DailyMelodyDownloadStats.deleteMany({ producerId: userId }).session(session);
        await DailySealseStats.deleteMany({ producerId: userId }).session(session);
        await PackPurchase.deleteMany({ userId }).session(session)

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


// const billingHistoryForAdmin = async () => {
//     const result = await Transactions.find().populate("packId").sort({ createdAt: -1 })
//     return result
// }

// const billingHistoryForAdmin = async () => {
//     const result = await Transactions.find()
//         .populate({
//             path: "packId",
//             select: "title userId",
//             strictPopulate: false 
//         })
//         .sort({ createdAt: -1 });

//     return result;
// };

const billingHistoryForAdmin = async () => {
    const result = await Transactions.find()
        .populate({
            path: "packId",
            select: "title userId", 
            populate: {
                path: "userId", 
                select: "email", 
            },
            strictPopulate: false,
        })
        .sort({ createdAt: -1 });

    return result;
};


// const adminOverview = async () => {
//     const activeUserCount = await User.countDocuments({ melodiesCounter: { $gt: 0 } });
//     const isPro = await User.countDocuments({ isPro: true });
//     const freeUser = await User.countDocuments({ isPro: true, paymentMethod: "free" });
//     const uploadedMelody = await Melody.countDocuments();
//     const totalDownloads = await Melody.aggregate([
//         {
//             $group: {
//                 _id: null,
//                 total: { $sum: "$downloads" }
//             }
//         }
//     ]);
//     const downloadsCount = totalDownloads[0]?.total || 0;
//     const samplePacksSold = await PackPurchase.countDocuments();
//     const totals = await Transactions.aggregate([
//         {
//             $group: {
//                 _id: null,
//                 totalSubscription: { $sum: "$subscriptionAmount" },
//                 totalCommission: { $sum: "$commission" }
//             }
//         }
//     ]);
//     const subscriptionAmountTotal = totals[0]?.totalSubscription || 0;
//     const commissionTotal = totals[0]?.totalCommission || 0;
//     const totalRevenue = subscriptionAmountTotal + commissionTotal;

//     const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
//     const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

//     const totalsRevenueForThisMonth = await Transactions.aggregate([
//         {
//             $match: {
//                 createdAt: { $gte: startOfMonth, $lt: endOfMonth }
//             }
//         },
//         {
//             $group: {
//                 _id: null,
//                 totalSubscription: { $sum: "$subscriptionAmount" },
//                 totalCommission: { $sum: "$commission" }
//             }
//         }
//     ]);

//     const subscriptionAmountTotalForThisMonth = totalsRevenueForThisMonth[0]?.totalSubscription || 0;
//     const commissionTotalForThisMonth = totalsRevenueForThisMonth[0]?.totalCommission || 0;
//     const totalRevenueForThisMonth = subscriptionAmountTotalForThisMonth + commissionTotalForThisMonth;




//     return {
//         activeUserCount,
//         isPro,
//         freeUser,
//         uploadedMelody,
//         downloadsCount,
//         samplePacksSold,
//         totalRevenue,
//         totalRevenueForThisMonth
//     }
// }

const adminOverview = async () => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const [
        activeUserCount,
        isPro,
        freeUser,
        uploadedMelody,
        totalDownloadsAgg,
        samplePacksSold,
        totalsRevenue
    ] = await Promise.all([
        User.countDocuments({ melodiesCounter: { $gt: 0 } }),
        User.countDocuments({ isPro: true }),
        User.countDocuments({ isPro: true, paymentMethod: "free" }),
        Melody.countDocuments(),
        Melody.aggregate([
            { $group: { _id: null, total: { $sum: "$downloads" } } }
        ]),
        PackPurchase.countDocuments(),
        Transactions.aggregate([
            {
                $facet: {
                    allTime: [
                        {
                            $group: {
                                _id: null,
                                totalSubscription: { $sum: "$subscriptionAmount" },
                                totalCommission: { $sum: "$commission" }
                            }
                        }
                    ],
                    thisMonth: [
                        {
                            $match: { createdAt: { $gte: startOfMonth, $lt: endOfMonth } }
                        },
                        {
                            $group: {
                                _id: null,
                                totalSubscription: { $sum: "$subscriptionAmount" },
                                totalCommission: { $sum: "$commission" }
                            }
                        }
                    ]
                }
            }
        ])
    ]);

    const downloadsCount = totalDownloadsAgg[0]?.total || 0;

    const subscriptionAmountTotal = totalsRevenue[0].allTime[0]?.totalSubscription || 0;
    const commissionTotal = totalsRevenue[0].allTime[0]?.totalCommission || 0;
    const totalRevenue = subscriptionAmountTotal + commissionTotal;

    const subscriptionAmountTotalForThisMonth = totalsRevenue[0].thisMonth[0]?.totalSubscription || 0;
    const commissionTotalForThisMonth = totalsRevenue[0].thisMonth[0]?.totalCommission || 0;
    const totalRevenueForThisMonth = subscriptionAmountTotalForThisMonth + commissionTotalForThisMonth;

    return {
        activeUserCount,
        isPro,
        freeUser,
        uploadedMelody,
        downloadsCount,
        samplePacksSold,
        totalRevenue,
        totalRevenueForThisMonth
    };
};


const singleUserInformationForAdmin = async (userId: string) => {
    const objectId = new mongoose.Types.ObjectId(userId);

    const melodyData = await Melody.aggregate([
        { $match: { userId: objectId } },
        {
            $group: {
                _id: null,
                totalMelodies: { $sum: 1 },
                totalPlays: { $sum: "$plays" },
                totalDownloads: { $sum: "$downloads" }
            }
        }
    ]);

    const packData = await Melody.countDocuments({ userId: objectId });

    const packSoldData = await PackPurchase.aggregate([
        {
            $match: {
                selectedProducerId: objectId,
                price: { $gt: 0 }
            }
        },
        {
            $group: {
                _id: null,
                totalSalesAmount: { $sum: "$price" },
            }
        }
    ]);

    return {
        melodyStatus: melodyData[0] || { totalMelodies: 0, totalPlays: 0, totalDownloads: 0 },
        packSoldStatus: packSoldData[0] || { totalSalesAmount: 0 },
        totalPack: packData
    }
};



export const adminService = {
    getALlUserByAdmin,
    changeUsersSubscriptionStatus,
    deleteUser,
    billingHistoryForAdmin,
    adminOverview,
    singleUserInformationForAdmin
}