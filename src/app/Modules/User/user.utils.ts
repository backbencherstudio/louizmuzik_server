import jwt, { JwtPayload } from 'jsonwebtoken';

export const createToken = (
  jwtPayload: { 
    email: string;
    name : string;
    userType : string | undefined;
    sessionId? : string | undefined ;
    createdAt : Date | undefined ;
  },
  secret: string,
  expiresIn: string,
) => {
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
