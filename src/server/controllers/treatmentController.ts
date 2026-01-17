import { Response } from 'express';
import Treatment from '../models/Treatment';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

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

    const query: {
      patient?: string;
      dentist?: string;
      status?: string;
      treatmentDate?: { $gte?: Date; $lte?: Date };
    } = {};
    const getString = (value: typeof status): string | undefined =>
      typeof value === 'string' ? value : undefined;

    const patientValue = getString(patientId);
    if (patientValue) query.patient = patientValue;

    const dentistValue = getString(dentistId);
    if (dentistValue) query.dentist = dentistValue;

    const statusValue = getString(status);
    if (statusValue) query.status = statusValue;

    if (startDate || endDate) {
      query.treatmentDate = {};
      if (typeof startDate === 'string') query.treatmentDate.$gte = new Date(startDate);
      if (typeof endDate === 'string') query.treatmentDate.$lte = new Date(endDate);
    }

    const treatments = await Treatment.find(query)
      .populate('patient', 'firstName lastName patientNumber')
      .populate('dentist', 'firstName lastName')
      .populate('appointment')
      .sort({ treatmentDate: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Treatment.countDocuments(query);

    res.json({
      success: true,
      data: treatments,
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
    const treatment = await Treatment.findById(req.params.id)
      .populate('patient')
      .populate('dentist', 'firstName lastName')
      .populate('appointment')
      .populate('createdBy', 'firstName lastName');

    if (!treatment) {
      res.status(404).json({ message: 'Treatment not found' });
      return;
    }

    res.json({
      success: true,
      data: treatment,
    });
  }
);

// @desc    Create new treatment
// @route   POST /api/treatments
// @access  Private
export const createTreatment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const treatment = await Treatment.create({
      ...req.body,
      createdBy: req.user?._id,
    });

    const populatedTreatment = await Treatment.findById(treatment._id)
      .populate('patient', 'firstName lastName patientNumber')
      .populate('dentist', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedTreatment,
    });
  }
);

// @desc    Update treatment
// @route   PUT /api/treatments/:id
// @access  Private
export const updateTreatment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const treatment = await Treatment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('patient', 'firstName lastName patientNumber')
      .populate('dentist', 'firstName lastName');

    if (!treatment) {
      res.status(404).json({ message: 'Treatment not found' });
      return;
    }

    res.json({
      success: true,
      data: treatment,
    });
  }
);

// @desc    Delete treatment
// @route   DELETE /api/treatments/:id
// @access  Private
export const deleteTreatment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const treatment = await Treatment.findByIdAndDelete(req.params.id);

    if (!treatment) {
      res.status(404).json({ message: 'Treatment not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Treatment deleted successfully',
    });
  }
);
