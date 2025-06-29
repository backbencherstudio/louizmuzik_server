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




export const adminService = {
    getALlUserByAdmin,
    changeUsersSubscriptionStatus
}