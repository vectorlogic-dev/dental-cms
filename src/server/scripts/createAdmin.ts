import connectDB, { prisma } from '../config/database';
import { hashPassword } from '../utils/password';

const createAdminUser = async () => {
  try {
    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@dentalcms.com' } });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@dentalcms.com');
      await prisma.$disconnect();
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    await prisma.user.create({
      data: {
        email: 'admin@dentalcms.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
      },
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@dentalcms.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

createAdminUser();
