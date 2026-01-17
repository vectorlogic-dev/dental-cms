import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (plainText: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainText, salt);
};

export const comparePassword = async (
  plainText: string,
  hashedPassword: string
): Promise<boolean> => bcrypt.compare(plainText, hashedPassword);
