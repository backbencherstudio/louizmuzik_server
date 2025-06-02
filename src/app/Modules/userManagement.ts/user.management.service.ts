/* eslint-disable no-undef */
import  path  from 'path';
import { deleteFile } from "../../middleware/deleteFile";
import { filteredObject } from "../../utils/filteredObject";
import { TUser } from "../User/user.interface";
import { User } from "../User/user.model";

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
    if (isExistsUserData?.profile_image && payload?.profile_image !== undefined ) {
        const absoluteFilePath = await getAbsoluteFilePath(isExistsUserData.profile_image);
        if (absoluteFilePath) {
            await deleteFile(absoluteFilePath);
        }
    }
    const updatedPayload = await filteredObject(payload);
    const result =  await User.findByIdAndUpdate({_id : userId}, updatedPayload, {new : true, runValidators :  true} )
    return result
}
 

export const UserManagement = {
    updateUserDataIntoDB
}