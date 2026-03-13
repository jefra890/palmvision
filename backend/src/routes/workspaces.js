/**
 * Workspaces Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, HttpErrors } from '../middleware/errorHandler.js';
import { authenticate, requireWorkspaceMember, requireWorkspaceAdmin } from '../middleware/auth.js';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';

const router = Router();

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  settings: z.object({}).passthrough().optional(),
});

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * GET /workspaces
 * List all workspaces for current user
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userWorkspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: req.user.id },
        { members: { some: { userId: req.user.id } } },
      ],
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, email: true, name: true, avatar: true },
          },
        },
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: userWorkspaces,
  });
}));

/**
 * POST /workspaces
 * Create a new workspace
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  // Validate input
  const result = createWorkspaceSchema.safeParse(req.body);
  if (!result.success) {
    throw HttpErrors.badRequest('Validation failed', result.error.errors);
  }

  const { name } = result.data;

  // Check workspace limit
  const userWorkspaceCount = await prisma.workspace.count({
    where: { ownerId: req.user.id },
  });

  if (userWorkspaceCount >= config.workspaces.maxPerUser) {
    throw HttpErrors.badRequest(`Maximum ${config.workspaces.maxPerUser} workspaces allowed`);
  }

  // Generate unique slug
  let slug = generateSlug(name);
  const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Create workspace with owner as member
  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      ownerId: req.user.id,
      plan: 'free',
      members: {
        create: {
          userId: req.user.id,
          role: 'owner',
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, email: true, name: true, avatar: true },
          },
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: workspace,
  });
}));

/**
 * GET /workspaces/:workspaceId
 * Get a specific workspace
 */
router.get('/:workspaceId', authenticate, requireWorkspaceMember, asyncHandler(async (req, res) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: req.params.workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, email: true, name: true, avatar: true },
          },
        },
      },
      subscription: true,
      _count: { select: { members: true } },
    },
  });

  if (!workspace) {
    throw HttpErrors.notFound('Workspace not found');
  }

  res.json({
    success: true,
    data: workspace,
  });
}));

/**
 * PATCH /workspaces/:workspaceId
 * Update a workspace
 */
router.patch('/:workspaceId', authenticate, requireWorkspaceAdmin, asyncHandler(async (req, res) => {
  const existing = await prisma.workspace.findUnique({
    where: { id: req.params.workspaceId },
  });

  if (!existing) {
    throw HttpErrors.notFound('Workspace not found');
  }

  // Validate input
  const result = updateWorkspaceSchema.safeParse(req.body);
  if (!result.success) {
    throw HttpErrors.badRequest('Validation failed', result.error.errors);
  }

  const { name, settings } = result.data;

  const updateData = {};
  if (name) {
    updateData.name = name;
    updateData.slug = generateSlug(name);
  }
  if (settings) {
    updateData.settings = { ...(existing.settings || {}), ...settings };
  }

  const workspace = await prisma.workspace.update({
    where: { id: req.params.workspaceId },
    data: updateData,
    include: {
      members: {
        include: {
          user: {
            select: { id: true, email: true, name: true, avatar: true },
          },
        },
      },
    },
  });

  res.json({
    success: true,
    data: workspace,
  });
}));

/**
 * DELETE /workspaces/:workspaceId
 * Delete a workspace
 */
router.delete('/:workspaceId', authenticate, asyncHandler(async (req, res) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: req.params.workspaceId },
  });

  if (!workspace) {
    throw HttpErrors.notFound('Workspace not found');
  }

  // Only owner can delete
  if (workspace.ownerId !== req.user.id) {
    throw HttpErrors.forbidden('Only the workspace owner can delete it');
  }

  await prisma.workspace.delete({
    where: { id: workspace.id },
  });

  res.json({
    success: true,
    message: 'Workspace deleted successfully',
  });
}));

/**
 * GET /workspaces/:workspaceId/members
 * List workspace members
 */
router.get('/:workspaceId/members', authenticate, requireWorkspaceMember, asyncHandler(async (req, res) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: req.params.workspaceId },
  });

  if (!workspace) {
    throw HttpErrors.notFound('Workspace not found');
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: req.params.workspaceId },
    include: {
      user: {
        select: { id: true, email: true, name: true, avatar: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  res.json({
    success: true,
    data: members,
  });
}));

export default router;
