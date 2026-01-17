import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

// Allowed collections for security
const ALLOWED_COLLECTIONS = ['patients', 'appointments', 'treatments', 'users'];

// @desc    Execute database query
// @route   POST /api/admin/query
// @access  Private (Admin only)
type SanitizedRecord = Record<string, unknown>;

const sanitizeRecord = (doc: SanitizedRecord): SanitizedRecord => {
  const sanitized: SanitizedRecord = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = JSON.parse(JSON.stringify(value)) as SanitizedRecord;
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const queryDatabase = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { collection, query } = req.body;

    if (!collection || !ALLOWED_COLLECTIONS.includes(collection)) {
      res.status(400).json({
        message: `Invalid collection. Allowed: ${ALLOWED_COLLECTIONS.join(', ')}`,
      });
      return;
    }

    if (!query || typeof query !== 'object') {
      res.status(400).json({ message: 'Invalid query. Must be a JSON object.' });
      return;
    }

    try {
      const startTime = Date.now();
      let results: SanitizedRecord[] = [];
      const where = query as Record<string, unknown>;

      switch (collection) {
        case 'patients':
          results = await prisma.patient.findMany({ where: where as any });
          break;
        case 'appointments':
          results = await prisma.appointment.findMany({ where: where as any });
          break;
        case 'treatments':
          results = await prisma.treatment.findMany({ where: where as any });
          break;
        case 'users':
          results = await prisma.user.findMany({
            where: where as any,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          });
          break;
        default:
          results = [];
      }

      const executionTime = Date.now() - startTime;

      const sanitizedResults = results.map((doc) => {
        const record = sanitizeRecord(doc);
        if (typeof record.id === 'string') {
          record._id = record.id;
          delete record.id;
        }
        return record;
      });

      res.json({
        success: true,
        data: sanitizedResults,
        count: sanitizedResults.length,
        executionTime,
      });
    } catch (error: unknown) {
      res.status(400).json({
        message: 'Query execution failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
