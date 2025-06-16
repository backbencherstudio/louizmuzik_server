import { User } from "../../User/user.model"

const getALlUserByAdmin = async () =>{
    // const result = await User.find({role : 'user', isPro : true}).select("-password")
    const result = await User.find({role : 'user'}).select("-password")
    return result
}

export const adminService = {
    getALlUserByAdmin
}