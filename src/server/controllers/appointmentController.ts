import { Response } from 'express';
import { validationResult } from 'express-validator';
import Appointment from '../models/Appointment';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const buildAppointmentQuery = (queryParams: AuthRequest['query']) => {
  const {
    startDate,
    endDate,
    status,
    patientId,
    dentistId,
  } = queryParams;

  const query: any = {};

  if (startDate || endDate) {
    query.appointmentDate = {};
    if (startDate) query.appointmentDate.$gte = new Date(startDate as string);
    if (endDate) query.appointmentDate.$lte = new Date(endDate as string);
  }

  if (status) query.status = status;
  if (patientId) query.patient = patientId;
  if (dentistId) query.dentist = dentistId;

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

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
