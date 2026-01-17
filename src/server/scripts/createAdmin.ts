import mongoose from 'mongoose';
import User from '../models/User';
import connectDB from '../config/database';

const createAdminUser = async () => {
  try {
    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@dentalcms.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@dentalcms.com');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin user
    await User.create({
      email: 'admin@dentalcms.com',
      password: 'admin123', // This will be hashed by the pre-save hook
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@dentalcms.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdminUser();
