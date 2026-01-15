import mongoose, { Schema, Document } from 'mongoose';

export interface ITreatment extends Document {
  patient: mongoose.Types.ObjectId;
  appointment?: mongoose.Types.ObjectId;
  dentist: mongoose.Types.ObjectId;
  treatmentDate: Date;
  treatmentType: string;
  toothNumbers?: string[];
  diagnosis?: string;
  procedure: string;
  description?: string;
  cost: number;
  paid: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  attachments?: string[]; // URLs to files/images
  createdBy: mongoose.Types.ObjectId;
}

const TreatmentSchema: Schema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    dentist: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Dentist is required'],
    },
    treatmentDate: {
      type: Date,
      required: [true, 'Treatment date is required'],
      default: Date.now,
    },
    treatmentType: {
      type: String,
      required: [true, 'Treatment type is required'],
    },
    toothNumbers: [String],
    diagnosis: String,
    procedure: {
      type: String,
      required: [true, 'Procedure is required'],
    },
    description: String,
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: 0,
    },
    paid: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: String,
    attachments: [String],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TreatmentSchema.index({ patient: 1, treatmentDate: -1 });
TreatmentSchema.index({ dentist: 1, treatmentDate: -1 });
TreatmentSchema.index({ appointment: 1 });

export default mongoose.model<ITreatment>('Treatment', TreatmentSchema);
