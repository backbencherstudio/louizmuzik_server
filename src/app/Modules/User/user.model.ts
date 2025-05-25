import { model, Schema } from "mongoose";
import bcrypt from 'bcrypt';
import { TampUser, TUser } from "./user.interface";


const TampUserSchema = new Schema<TampUser>(
  {
    id: {
      type: String,
    },
    otp: {
      type: String,
      required: [true, "Otp is required"],
    },
     name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
     isDeleted: {
      type: Boolean,
      default: false,
    },

    expiresAt: { type: Date, required: true },

  },
  {
    timestamps: true,
  }
);



const userSchema = new Schema<TUser>(
  {
    id: {
      type: String,
    },
     name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
    },    
    isDeleted: {
      type: Boolean,
      default: false,
    },   
    
  },
  {
    timestamps: true,
  }
);



userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashPassword,
) {
  return await bcrypt.compare(plainTextPassword, hashPassword);
};



export const TampUserCollection = model<TUser>('TampUser', TampUserSchema);

export const User = model<TUser>('User', userSchema);

