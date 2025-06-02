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


export const UserManagement = {
    updateUserDataIntoDB,
    changePasswordIntoDB
}