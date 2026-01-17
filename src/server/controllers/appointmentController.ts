import { Response } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { isPrismaNotFoundError } from '../utils/prismaErrors';

type AppointmentQuery = Prisma.AppointmentWhereInput;

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
    if (typeof startDate === 'string') query.appointmentDate.gte = new Date(startDate);
    if (typeof endDate === 'string') query.appointmentDate.lte = new Date(endDate);
  }

  const statusValue = getString(status);
  if (statusValue) query.status = statusValue;

  const patientValue = getString(patientId);
  if (patientValue) query.patientId = patientValue;

  const dentistValue = getString(dentistId);
  if (dentistValue) query.dentistId = dentistValue;

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

    const appointments = await prisma.appointment.findMany({
      where: query,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            patientNumber: true,
          },
        },
        dentist: {
          select: { id: true, firstName: true, lastName: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { appointmentDate: 'asc' },
      take: limitValue,
      skip: (pageValue - 1) * Number(limit),
    });

    const total = await prisma.appointment.count({ where: query });

    res.json({
      success: true,
      data: appointments.map((appointment) => {
        const {
          id,
          patient,
          dentist,
          createdBy,
          patientId: _patientId,
          dentistId: _dentistId,
          createdById: _createdById,
          ...rest
        } = appointment;
        return {
          _id: id,
          ...rest,
          patient: patient
            ? {
                _id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                phone: patient.phone,
                patientNumber: patient.patientNumber,
              }
            : undefined,
          dentist: dentist
            ? { _id: dentist.id, firstName: dentist.firstName, lastName: dentist.lastName }
            : undefined,
          createdBy: createdBy
            ? { _id: createdBy.id, firstName: createdBy.firstName, lastName: createdBy.lastName }
            : undefined,
        };
      }),
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
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        dentist: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    const {
      id,
      patient,
      dentist,
      createdBy,
      patientId: _patientId,
      dentistId: _dentistId,
      createdById: _createdById,
      ...rest
    } = appointment;
    const patientPayload = patient
      ? (() => {
          const { id: patientId, ...patientRest } = patient;
          return { _id: patientId, ...patientRest };
        })()
      : undefined;
    res.json({
      success: true,
      data: {
        _id: id,
        ...rest,
        patient: patientPayload,
        dentist: dentist ? { _id: dentist.id, firstName: dentist.firstName, lastName: dentist.lastName } : undefined,
        createdBy: createdBy ? { _id: createdBy.id, firstName: createdBy.firstName, lastName: createdBy.lastName } : undefined,
      },
    });
  }
);

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
export const createAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { patient, dentist, ...rest } = req.body;
    const appointment = await prisma.appointment.create({
      data: {
        ...rest,
        patientId: patient,
        dentistId: dentist,
        createdById: req.user?.id ?? '',
      },
    });

    const populatedAppointment = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!populatedAppointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    const {
      id,
      patient,
      dentist,
      patientId: _patientId,
      dentistId: _dentistId,
      createdById: _createdById,
      ...rest
    } = populatedAppointment;
    res.status(201).json({
      success: true,
      data: {
        _id: id,
        ...rest,
        patient: patient ? { _id: patient.id, firstName: patient.firstName, lastName: patient.lastName, phone: patient.phone } : undefined,
        dentist: dentist ? { _id: dentist.id, firstName: dentist.firstName, lastName: dentist.lastName } : undefined,
      },
    });
  }
);

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { patient, dentist, ...rest } = req.body;
    try {
      const appointment = await prisma.appointment.update({
        where: { id: req.params.id },
        data: {
          ...rest,
          ...(patient ? { patientId: patient } : {}),
          ...(dentist ? { dentistId: dentist } : {}),
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          dentist: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      const {
        id,
        patient,
        dentist,
        patientId: _patientId,
        dentistId: _dentistId,
        createdById: _createdById,
        ...rest
      } = appointment;
      res.json({
        success: true,
        data: {
          _id: id,
          ...rest,
          patient: patient ? { _id: patient.id, firstName: patient.firstName, lastName: patient.lastName, phone: patient.phone } : undefined,
          dentist: dentist ? { _id: dentist.id, firstName: dentist.firstName, lastName: dentist.lastName } : undefined,
        },
      });
    } catch (error: unknown) {
      if (isPrismaNotFoundError(error)) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }
      throw error;
    }
  }
);

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
export const deleteAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      await prisma.appointment.delete({
        where: { id: req.params.id },
      });

      res.json({
        success: true,
        message: 'Appointment deleted successfully',
      });
    } catch (error: unknown) {
      if (isPrismaNotFoundError(error)) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }
      throw error;
    }
  }
);
