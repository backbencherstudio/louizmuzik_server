// import jwt, { JwtPayload } from 'jsonwebtoken';
// import { Types } from 'mongoose';

// export const createToken = (
//   jwtPayload: { 
//     email: string;
//     producer_name : string;
//     userId : Types.ObjectId;
//   },
//   secret: string,
//   expiresIn: string,
// ) => {
//   return jwt.sign(jwtPayload, secret, {
//     expiresIn,
//   });
// };

// export const verifyToken = (token: string, secret: string) => {
//   return jwt.verify(token, secret) as JwtPayload;
// };

import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";

interface MyJwtPayload extends JwtPayload {
  email: string;
  producer_name: string;
  userId: Types.ObjectId;
}

export const createToken = (
  jwtPayload: { 
    email: string;
    producer_name: string;
    userId: Types.ObjectId;
  },
  secret: Secret,
  expiresIn: SignOptions["expiresIn"] 
): string => {
  return jwt.sign(jwtPayload, secret, { expiresIn });
};

export const verifyToken = (token: string, secret: Secret): MyJwtPayload => {
  return jwt.verify(token, secret) as MyJwtPayload;
};
