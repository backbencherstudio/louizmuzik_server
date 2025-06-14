/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

// ======================================>>>>>>>> Register Interface

export interface TUser {
  id: string;
  otp: string;
  name: string;
  producer_name: string;
  email: string;
  country: string;
  password: string;
  isDeleted: boolean;
  expiresAt : Date;
  profile_image: string;
  isPro: boolean;
  followersCounter: number;
  melodiesCounter: number;
  about: string;
  following: Types.ObjectId[]; 
  favourite_melodies: Types.ObjectId[]; 
  favourite_packs: Types.ObjectId[];
  beatstarsUsername?: string;
  instagramUsername?: string;
  youtubeUsername?: string;
  tiktokUsername?: string;
}

// ======================================>>>>>>>> Login Interface
export type TLoginUser = {
  email: string;
  password: string;
};


export interface UserModel extends Model<TUser> {
  isUserExistsByCustomeId(id: string): Promise<TUser>;
  isPasswordMatched(
    plainTextPassword: string,
    hashPassword: string,
  ): Promise<boolean>;
}


export interface TampUser extends TUser {} 