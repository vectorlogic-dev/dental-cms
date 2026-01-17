import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Allowed collections for security
const ALLOWED_COLLECTIONS = ['patients', 'appointments', 'treatments', 'users'];

// @desc    Execute database query
// @route   POST /api/admin/query
// @access  Private (Admin only)
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
      const db = mongoose.connection.db;
      
      if (!db) {
        res.status(500).json({ message: 'Database connection not available' });
        return;
      }

      const collectionInstance = db.collection(collection);
      
      // Execute find query
      const results = await collectionInstance.find(query).toArray();
      const executionTime = Date.now() - startTime;

      // Convert MongoDB ObjectIds to strings for JSON serialization
      const sanitizedResults = results.map((doc: any) => {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(doc)) {
          if (value instanceof mongoose.Types.ObjectId) {
            sanitized[key] = value.toString();
          } else if (value instanceof Date) {
            sanitized[key] = value.toISOString();
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = JSON.parse(JSON.stringify(value));
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      });

      res.json({
        success: true,
        data: sanitizedResults,
        count: sanitizedResults.length,
        executionTime,
      });
    } catch (error: any) {
      res.status(400).json({
        message: 'Query execution failed',
        error: error.message,
      });
    }
  }
);
