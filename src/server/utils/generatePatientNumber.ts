import { prisma } from '../config/database';

export const generatePatientNumber = async (): Promise<string> => {
  const count = await prisma.patient.count();
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(6, '0');
  return `PAT-${year}-${sequence}`;
};
