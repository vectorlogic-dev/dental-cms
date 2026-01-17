import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('SQLite connected successfully');
  } catch (error) {
    console.error('SQLite connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
