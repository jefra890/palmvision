/**
 * Teams Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { asyncHandler, HttpErrors } from '../middleware/errorHandler.js';
import { authenticate, requireWorkspaceMember, requireWorkspaceAdmin } from '../middleware/auth.js';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';

const router = Router();

// Validation schemas
const inviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'member']).default('member'),
});

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member']),
});

/**
 * POST /teams/workspaces/:workspaceId/invites
 * Invite a new team member
 */
router.post('/workspaces/:workspaceId/invites', authenticate, requireWorkspaceAdmin, asyncHandler(async (req, res) => {
  // Validate input
  const result = inviteSchema.safeParse(req.body);
  if (!result.success) {
    throw HttpErrors.badRequest('Validation failed', result.error.errors);
  }

  const { email, role } = result.data;
  const { workspaceId } = req.params;

  // Check workspace exists
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { _count: { select: { members: true } } },
  });

  if (!workspace) {
    throw HttpErrors.notFound('Workspace not found');
  }

  // Check member limit
  if (workspace._count.members >= config.teams.maxMembers) {
    throw HttpErrors.badRequest(`Maximum ${config.teams.maxMembers} members allowed`);
  }

  // Check if user is already a member
  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      user: { email },
    },
  });

  if (existingMember) {
    throw HttpErrors.conflict('User is already a member of this workspace');
  }

  // Check if invite already exists
  const existingInvite = await prisma.invite.findFirst({
    where: {
      workspaceId,
      email,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvite) {
    throw HttpErrors.conflict('An active invite already exists for this email');
  }

  // Create invite
  const token = crypto.randomBytes(32).toString('hex');
  const invite = await prisma.invite.create({
    data: {
      email,
      role,
      token,
      workspaceId,
      invitedById: req.user.id,
      expiresAt: new Date(Date.now() + config.teams.inviteExpiryDays * 24 * 60 * 60 * 1000),
    },
  });

  // In production, send invitation email here
  console.log(`📧 Invitation email would be sent to ${email}`);

  res.status(201).json({
    success: true,
    data: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    },
  });
}));

/**
 * GET /teams/workspaces/:workspaceId/invites
 * List pending invites
 */
router.get('/workspaces/:workspaceId/invites', authenticate, requireWorkspaceAdmin, asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;

  const invites = await prisma.invite.findMany({
    where: {
      workspaceId,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: invites,
  });
}));

/**
 * DELETE /teams/workspaces/:workspaceId/invites/:inviteId
 * Cancel an invite
 */
router.delete('/workspaces/:workspaceId/invites/:inviteId', authenticate, requireWorkspaceAdmin, asyncHandler(async (req, res) => {
  const { inviteId } = req.params;

  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    throw HttpErrors.notFound('Invite not found');
  }

  await prisma.invite.delete({
    where: { id: inviteId },
  });

  res.json({
    success: true,
    message: 'Invite cancelled',
  });
}));

/**
 * POST /teams/invites/:token/accept
 * Accept an invitation
 */
router.post('/invites/:token/accept', authenticate, asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Find invite by token
  const invite = await prisma.invite.findUnique({
    where: { token },
  });

  if (!invite) {
    throw HttpErrors.notFound('Invite not found or expired');
  }

  if (invite.expiresAt < new Date()) {
    await prisma.invite.delete({ where: { id: invite.id } });
    throw HttpErrors.badRequest('Invite has expired');
  }

  // Check if user is already a member
  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: req.user.id,
        workspaceId: invite.workspaceId,
      },
    },
  });

  if (existingMember) {
    await prisma.invite.delete({ where: { id: invite.id } });
    throw HttpErrors.conflict('You are already a member of this workspace');
  }

  // Add user to workspace
  await prisma.workspaceMember.create({
    data: {
      userId: req.user.id,
      workspaceId: invite.workspaceId,
      role: invite.role,
    },
  });

  // Remove invite after acceptance
  await prisma.invite.delete({ where: { id: invite.id } });

  res.json({
    success: true,
    data: {
      workspaceId: invite.workspaceId,
      role: invite.role,
    },
  });
}));

/**
 * PATCH /teams/workspaces/:workspaceId/members/:memberId
 * Update a team member's role
 */
router.patch('/workspaces/:workspaceId/members/:memberId', authenticate, requireWorkspaceAdmin, asyncHandler(async (req, res) => {
  // Validate input
  const result = updateMemberSchema.safeParse(req.body);
  if (!result.success) {
    throw HttpErrors.badRequest('Validation failed', result.error.errors);
  }

  const { role } = result.data;
  const { memberId, workspaceId } = req.params;

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });

  if (!member) {
    throw HttpErrors.notFound('Member not found');
  }

  // Cannot change owner's role
  if (member.role === 'owner') {
    throw HttpErrors.forbidden('Cannot change the owner\'s role');
  }

  const updatedMember = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
    include: {
      user: {
        select: { id: true, email: true, name: true, avatar: true },
      },
    },
  });

  res.json({
    success: true,
    data: updatedMember,
  });
}));

/**
 * DELETE /teams/workspaces/:workspaceId/members/:memberId
 * Remove a team member
 */
router.delete('/workspaces/:workspaceId/members/:memberId', authenticate, requireWorkspaceAdmin, asyncHandler(async (req, res) => {
  const { memberId, workspaceId } = req.params;

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });

  if (!member) {
    throw HttpErrors.notFound('Member not found');
  }

  // Cannot remove owner
  if (member.role === 'owner') {
    throw HttpErrors.forbidden('Cannot remove the workspace owner');
  }

  await prisma.workspaceMember.delete({
    where: { id: memberId },
  });

  res.json({
    success: true,
    message: 'Member removed from workspace',
  });
}));

/**
 * POST /teams/workspaces/:workspaceId/leave
 * Leave a workspace
 */
router.post('/workspaces/:workspaceId/leave', authenticate, requireWorkspaceMember, asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: req.user.id,
        workspaceId,
      },
    },
  });

  if (!member) {
    throw HttpErrors.notFound('You are not a member of this workspace');
  }

  if (member.role === 'owner') {
    throw HttpErrors.forbidden('Owners must transfer ownership before leaving');
  }

  await prisma.workspaceMember.delete({
    where: { id: member.id },
  });

  res.json({
    success: true,
    message: 'Successfully left workspace',
  });
}));

export default router;
