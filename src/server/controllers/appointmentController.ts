import { Response } from 'express';
import Appointment from '../models/Appointment';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

type AppointmentDateQuery = {
  $gte?: Date;
  $lte?: Date;
};

type AppointmentQuery = {
  appointmentDate?: AppointmentDateQuery;
  status?: string;
  patient?: string;
  dentist?: string;
};

const buildAppointmentQuery = (queryParams: AuthRequest['query']): AppointmentQuery => {
  const {
    startDate,
    endDate,
    status,
    patientId,
    dentistId,
  } = queryParams;

  const query: AppointmentQuery = {};
  const getString = (value: typeof status): string | undefined =>
    typeof value === 'string' ? value : undefined;

  if (startDate || endDate) {
    query.appointmentDate = {};
    if (typeof startDate === 'string') query.appointmentDate.$gte = new Date(startDate);
    if (typeof endDate === 'string') query.appointmentDate.$lte = new Date(endDate);
  }

  const statusValue = getString(status);
  if (statusValue) query.status = statusValue;

  const patientValue = getString(patientId);
  if (patientValue) query.patient = patientValue;

  const dentistValue = getString(dentistId);
  if (dentistValue) query.dentist = dentistValue;

  return query;
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 50,
    } = req.query;

    const query = buildAppointmentQuery(req.query);
    const limitValue = Number(limit) * 1;
    const pageValue = Number(page);

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName phone patientNumber')
      .populate('dentist', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ appointmentDate: 1 })
      .limit(limitValue)
      .skip((pageValue - 1) * Number(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: pageValue,
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  }
);

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient')
      .populate('dentist', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    res.json({
      success: true,
      data: appointment,
    });
  }
);

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
export const createAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const appointment = await Appointment.create({
      ...req.body,
      createdBy: req.user?._id,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName phone')
      .populate('dentist', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedAppointment,
    });
  }
);

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('patient', 'firstName lastName phone')
      .populate('dentist', 'firstName lastName');

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    res.json({
      success: true,
      data: appointment,
    });
  }
);

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
export const deleteAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  }
);
