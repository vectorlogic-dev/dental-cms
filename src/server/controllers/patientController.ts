import { Response } from 'express';
import { validationResult } from 'express-validator';
import Patient from '../models/Patient';
import { generatePatientNumber } from '../utils/generatePatientNumber';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
export const getPatients = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      isActive = true,
    } = req.query;

    const query: any = { isActive };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { patientNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const patients = await Patient.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: patients,
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
    const patient = await Patient.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    res.json({
      success: true,
      data: patient,
    });
  }
);

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private
export const createPatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const patientNumber = await generatePatientNumber();

    const patient = await Patient.create({
      ...req.body,
      patientNumber,
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      data: patient,
    });
  }
);

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
export const updatePatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    res.json({
      success: true,
      data: patient,
    });
  }
);

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private
export const deletePatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Patient deactivated successfully',
    });
  }
);
