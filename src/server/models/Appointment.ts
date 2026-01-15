import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId;
  dentist: mongoose.Types.ObjectId;
  appointmentDate: Date;
  duration: number; // in minutes
  type: 'checkup' | 'cleaning' | 'treatment' | 'consultation' | 'emergency' | 'follow-up';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  reminders?: {
    sent: boolean;
    sentAt?: Date;
  };
}

const AppointmentSchema: Schema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
    },
    dentist: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Dentist is required'],
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    duration: {
      type: Number,
      required: true,
      default: 30, // default 30 minutes
    },
    type: {
      type: String,
      enum: ['checkup', 'cleaning', 'treatment', 'consultation', 'emergency', 'follow-up'],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    notes: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reminders: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AppointmentSchema.index({ patient: 1, appointmentDate: 1 });
AppointmentSchema.index({ dentist: 1, appointmentDate: 1 });
AppointmentSchema.index({ appointmentDate: 1, status: 1 });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
