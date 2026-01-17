import { Response } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { generatePatientNumber } from '../utils/generatePatientNumber';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { isPrismaNotFoundError } from '../utils/prismaErrors';

type DentalChartProcedure = {
  procedure?: string;
  notes?: string;
  date?: string | Date;
  dentist?: string | { _id: string; firstName: string; lastName: string };
};

type DentalChartEntry = {
  toothNumber: number;
  procedures: DentalChartProcedure[];
};

const normalizeDentalChart = (value: unknown): DentalChartEntry[] => {
  if (!Array.isArray(value)) return [];
  return value as DentalChartEntry[];
};

const mapUserSummary = (user: { id: string; firstName: string; lastName: string }) => ({
  _id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
});

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
export const getPatients = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
    } = req.query;

    const isActiveValue =
      typeof isActive === 'string' ? isActive === 'true' : isActive ?? true;
    const query: Prisma.PatientWhereInput = { isActive: isActiveValue };

    if (search) {
      query.OR = [
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { patientNumber: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where: query,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) * 1,
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await prisma.patient.count({ where: query });

    res.json({
      success: true,
      data: patients.map((patient) => {
        const { id, createdBy, createdById: _createdById, ...rest } = patient;
        return {
          _id: id,
          ...rest,
          createdBy: createdBy ? mapUserSummary(createdBy) : undefined,
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

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
export const getPatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    const dentalChart = normalizeDentalChart(patient.dentalChart);
    const dentistIds = new Set<string>();
    for (const entry of dentalChart) {
      for (const procedure of entry.procedures ?? []) {
        if (typeof procedure.dentist === 'string') {
          dentistIds.add(procedure.dentist);
        }
      }
    }

    const dentists = dentistIds.size
      ? await prisma.user.findMany({
          where: { id: { in: [...dentistIds] } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];

    const dentistMap = new Map(
      dentists.map((dentist) => [dentist.id, mapUserSummary(dentist)])
    );

    const hydratedDentalChart = dentalChart.map((entry) => ({
      ...entry,
      procedures: entry.procedures?.map((procedure) => ({
        ...procedure,
        dentist:
          typeof procedure.dentist === 'string'
            ? dentistMap.get(procedure.dentist) ?? procedure.dentist
            : procedure.dentist,
      })),
    }));

    const {
      id,
      createdBy,
      createdById: _createdById,
      dentalChart: _chart,
      ...rest
    } = patient;
    res.json({
      success: true,
      data: {
        _id: id,
        ...rest,
        dentalChart: hydratedDentalChart,
        createdBy: createdBy ? mapUserSummary(createdBy) : undefined,
      },
    });
  }
);

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private
export const createPatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const patientNumber = await generatePatientNumber();

    const patient = await prisma.patient.create({
      data: {
        ...req.body,
        patientNumber,
        createdById: req.user?.id ?? '',
      },
    });

    const { id, createdById: _createdById, ...rest } = patient;
    res.status(201).json({
      success: true,
      data: {
        _id: id,
        ...rest,
      },
    });
  }
);

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
export const updatePatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const patient = await prisma.patient.update({
        where: { id: req.params.id },
        data: req.body,
      });

      const { id, createdById: _createdById, ...rest } = patient;
      res.json({
        success: true,
        data: {
          _id: id,
          ...rest,
        },
      });
    } catch (error: unknown) {
      if (isPrismaNotFoundError(error)) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }
      throw error;
    }
  }
);

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private
export const deletePatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      await prisma.patient.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'Patient deactivated successfully',
      });
    } catch (error: unknown) {
      if (isPrismaNotFoundError(error)) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }
      throw error;
    }
  }
);
