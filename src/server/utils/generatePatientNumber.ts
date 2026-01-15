import Patient from '../models/Patient';

export const generatePatientNumber = async (): Promise<string> => {
  const count = await Patient.countDocuments();
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(6, '0');
  return `PAT-${year}-${sequence}`;
};
