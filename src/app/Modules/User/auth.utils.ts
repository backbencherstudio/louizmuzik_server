// import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

// export const createToken = (
//   jwtPayload: { email: string },
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

interface MyJwtPayload extends JwtPayload {
  email: string;
}

export const createToken = (
  jwtPayload: { email: string },
  secret: Secret,
  expiresIn: SignOptions["expiresIn"] 
): string => {
  return jwt.sign(jwtPayload, secret, { expiresIn });
};

export const verifyToken = (token: string, secret: Secret): MyJwtPayload => {
  return jwt.verify(token, secret) as MyJwtPayload;
};

