import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  notes?: string;
  dentalChart?: {
    toothNumber: number;
    procedures: {
      procedure: string;
      notes: string;
      date: Date;
      dentist?: mongoose.Types.ObjectId;
    }[];
  }[];
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
}

const PatientSchema: Schema = new Schema(
  {
    patientNumber: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String },
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    medicalHistory: [String],
    allergies: [String],
    insurance: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
    },
    notes: String,
    dentalChart: [{
      toothNumber: Number,
      procedures: [{
        procedure: String,
        notes: String,
        date: { type: Date, default: Date.now },
        dentist: { type: Schema.Types.ObjectId, ref: 'User' }
      }]
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PatientSchema.index({ patientNumber: 1 });
PatientSchema.index({ lastName: 1, firstName: 1 });
PatientSchema.index({ phone: 1 });

export default mongoose.model<IPatient>('Patient', PatientSchema);
