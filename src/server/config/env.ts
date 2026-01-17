import dotenv from 'dotenv';

dotenv.config();

const resolvePort = (value: string | undefined, fallback: number): number => {
  const port = Number(value);
  if (Number.isFinite(port) && port > 0) {
    return port;
  }
  return fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: resolvePort(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/dental-cms',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET ?? 'fallback-secret',
  jwtExpire: process.env.JWT_EXPIRE ?? '7d',
};

export default env;
