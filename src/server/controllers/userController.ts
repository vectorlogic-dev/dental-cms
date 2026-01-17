import { Response } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { isPrismaNotFoundError } from '../utils/prismaErrors';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
export const getUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, role, isActive } = req.query;

    const query: Prisma.UserWhereInput = {};
    const roleValue = typeof role === 'string' ? role : undefined;
    if (roleValue) query.role = roleValue;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await prisma.user.findMany({
      where: query,
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
      orderBy: { createdAt: 'desc' },
      take: Number(limit) * 1,
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await prisma.user.count({ where: query });

    res.json({
      success: true,
      data: users.map((user) => {
        const { id, ...rest } = user;
        return { _id: id, ...rest };
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

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
export const getUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
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

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { id, ...rest } = user;
    res.json({
      success: true,
      data: {
        _id: id,
        ...rest,
      },
    });
  }
);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { password: _password, ...updateData } = req.body;

    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
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

      const { id, ...rest } = user;
      res.json({
        success: true,
        data: {
          _id: id,
          ...rest,
        },
      });
    } catch (error: unknown) {
      if (isPrismaNotFoundError(error)) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      throw error;
    }
  }
);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error: unknown) {
      if (isPrismaNotFoundError(error)) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      throw error;
    }
  }
);
