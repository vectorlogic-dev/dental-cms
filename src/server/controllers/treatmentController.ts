import { Response } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { isPrismaNotFoundError } from '../utils/prismaErrors';

// @desc    Get all treatments
// @route   GET /api/treatments
// @access  Private
export const getTreatments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      patientId,
      dentistId,
      status,
      startDate,
      endDate,
    } = req.query;

    const query: Prisma.TreatmentWhereInput = {};
    const getString = (value: typeof status): string | undefined =>
      typeof value === 'string' ? value : undefined;

    const patientValue = getString(patientId);
    if (patientValue) query.patientId = patientValue;

    const dentistValue = getString(dentistId);
    if (dentistValue) query.dentistId = dentistValue;

    const statusValue = getString(status);
    if (statusValue) query.status = statusValue;

    if (startDate || endDate) {
      query.treatmentDate = {};
      if (typeof startDate === 'string') query.treatmentDate.gte = new Date(startDate);
      if (typeof endDate === 'string') query.treatmentDate.lte = new Date(endDate);
    }

    const treatments = await prisma.treatment.findMany({
      where: query,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, patientNumber: true },
        },
        dentist: { select: { id: true, firstName: true, lastName: true } },
        appointment: true,
      },
      orderBy: { treatmentDate: 'desc' },
      take: Number(limit) * 1,
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await prisma.treatment.count({ where: query });

    res.json({
      success: true,
      data: treatments.map((treatment) => {
        const {
          id,
          patient,
          dentist,
          appointment,
          patientId: _patientId,
          dentistId: _dentistId,
          appointmentId: _appointmentId,
          createdById: _createdById,
          ...rest
        } = treatment;
        return {
          _id: id,
          ...rest,
          patient: patient
            ? {
                _id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                patientNumber: patient.patientNumber,
              }
            : undefined,
          dentist: dentist
            ? { _id: dentist.id, firstName: dentist.firstName, lastName: dentist.lastName }
            : undefined,
          appointment: appointment
            ? (() => {
                const { id, ...rest } = appointment;
                return { _id: id, ...rest };
              })()
            : undefined,
        };
      }),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  }
);

// @desc    Get single treatment
// @route   GET /api/treatments/:id
// @access  Private
export const getTreatment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const treatment = await prisma.treatment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        dentist: { select: { id: true, firstName: true, lastName: true } },
        appointment: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!treatment) {
      res.status(404).json({ message: 'Treatment not found' });
      return;
    }

    const {
      id,
      patient,
      dentist,
      appointment,
      createdBy,
      patientId: _patientId,
      dentistId: _dentistId,
      appointmentId: _appointmentId,
      createdById: _createdById,
      ...rest
    } = treatment;
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
        appointment: appointment
          ? (() => {
              const { id, ...rest } = appointment;
              return { _id: id, ...rest };
            })()
          : undefined,
        createdBy: createdBy ? { _id: createdBy.id, firstName: createdBy.firstName, lastName: createdBy.lastName } : undefined,
      },
    });
  }
);

// @desc    Create new treatment
// @route   POST /api/treatments
// @access  Private
export const createTreatment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { patient, dentist, appointment, ...payload } = req.body;
    const treatment = await prisma.treatment.create({
      data: {
        ...payload,
        patientId: patient,
        dentistId: dentist,
        appointmentId: appointment || undefined,
        createdById: req.user?.id ?? '',
      },
    });

    const populatedTreatment = await prisma.treatment.findUnique({
      where: { id: treatment.id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!populatedTreatment) {
      res.status(404).json({ message: 'Treatment not found' });
      return;
    }

    const {
      id,
      patient: patientRecord,
      dentist: dentistRecord,
      patientId: _patientId,
      dentistId: _dentistId,
      appointmentId: _appointmentId,
      createdById: _createdById,
      ...treatmentData
    } = populatedTreatment;
    res.status(201).json({
      success: true,
      data: {
        _id: id,
        ...treatmentData,
        patient: patientRecord
          ? { _id: patientRecord.id, firstName: patientRecord.firstName, lastName: patientRecord.lastName, patientNumber: patientRecord.patientNumber }
          : undefined,
        dentist: dentistRecord
          ? { _id: dentistRecord.id, firstName: dentistRecord.firstName, lastName: dentistRecord.lastName }
          : undefined,
      },
    });
  }
);

// @desc    Update treatment
// @route   PUT /api/treatments/:id
// @access  Private
export const updateTreatment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { patient, dentist, appointment, ...payload } = req.body;
    try {
      const treatment = await prisma.treatment.update({
        where: { id: req.params.id },
        data: {
          ...payload,
          ...(patient ? { patientId: patient } : {}),
          ...(dentist ? { dentistId: dentist } : {}),
          ...(appointment !== undefined ? { appointmentId: appointment || null } : {}),
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
          dentist: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      const {
        id,
        patient: patientRecord,
        dentist: dentistRecord,
        patientId: _patientId,
        dentistId: _dentistId,
        appointmentId: _appointmentId,
        createdById: _createdById,
        ...treatmentData
      } = treatment;
      res.json({
        success: true,
        data: {
          _id: id,
          ...treatmentData,
          patient: patientRecord
            ? { _id: patientRecord.id, firstName: patientRecord.firstName, lastName: patientRecord.lastName, patientNumber: patientRecord.patientNumber }
            : undefined,
          dentist: dentistRecord
            ? { _id: dentistRecord.id, firstName: dentistRecord.firstName, lastName: dentistRecord.lastName }
            : undefined,
        },
      });
    } catch (error: unknown) {
      if (isPrismaNotFoundError(error)) {
        res.status(404).json({ message: 'Treatment not found' });
        return;
      }
      throw error;
    }
  }
);

// @desc    Delete treatment
// @route   DELETE /api/treatments/:id
// @access  Private
export const deleteTreatment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      await prisma.treatment.delete({
        where: { id: req.params.id },
      });

      res.json({
        success: true,
        message: 'Treatment deleted successfully',
      });
    } catch (error: unknown) {
      if (isPrismaNotFoundError(error)) {
        res.status(404).json({ message: 'Treatment not found' });
        return;
      }
      throw error;
    }
  }
);
