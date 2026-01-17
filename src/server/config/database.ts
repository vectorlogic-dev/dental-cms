import mongoose from 'mongoose';
import env from './env';

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
