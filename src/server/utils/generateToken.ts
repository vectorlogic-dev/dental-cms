import jwt from 'jsonwebtoken';
import env from '../config/env';

export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpire,
    } as jwt.SignOptions
  );
};
