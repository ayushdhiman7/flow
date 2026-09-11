import { Workspace } from './workspace.model.js';
import { User } from '../auth/index.js';
import { AppError } from '../../middleware/error.js';
import { generateSlug } from '../../utils/helpers.js';

export async function createWorkspace(ownerId, data) {
  const existing = await Workspace.findOne({ slug: data.slug });
  if (existing) throw new AppError('Slug already taken', 409);

  const workspace = await Workspace.create({
    ...data,
    slug: data.slug || generateSlug(data.name, []),
    owner: ownerId,
    members: [{ user: ownerId, role: 'owner' }],
  });

  await User.findByIdAndUpdate(ownerId, { $addToSet: { workspaces: workspace._id } });
  return workspace;
}

export async function getWorkspaces(userId) {
  return Workspace.find({ 'members.user': userId })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar role')
    .sort({ createdAt: -1 });
}

export async function getWorkspaceById(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar role');
  if (!workspace) throw new AppError('Workspace not found', 404);

  const isMember = workspace.members.some(m => m.user._id.toString() === userId);
  if (!isMember) throw new AppError('Not a member of this workspace', 403);

  return workspace;
}

export async function updateWorkspace(workspaceId, userId, data) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const member = workspace.members.find(m => m.user.toString() === userId);
  if (!member || member.role !== 'owner') {
    throw new AppError('Only owner can update workspace', 403);
  }

  Object.assign(workspace, data);
  await workspace.save();
  return workspace;
}

export async function deleteWorkspace(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  if (workspace.owner.toString() !== userId) {
    throw new AppError('Only owner can delete workspace', 403);
  }

  await workspace.deleteOne();
  await User.updateMany({ workspaces: workspaceId }, { $pull: { workspaces: workspaceId } });
}

export async function inviteMember(workspaceId, userId, data) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const inviter = workspace.members.find(m => m.user.toString() === userId);
  if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  if (!workspace.settings.allowMemberInvite && inviter.role !== 'owner') {
    throw new AppError('Member invites not allowed', 403);
  }

  const user = await User.findOne({ email: data.email });
  if (!user) throw new AppError('User not found', 404);

  const existing = workspace.members.find(m => m.user.toString() === user._id.toString());
  if (existing) throw new AppError('User already a member', 409);

  workspace.members.push({ user: user._id, role: data.role });
  await workspace.save();

  await User.findByIdAndUpdate(user._id, { $addToSet: { workspaces: workspaceId } });
  return workspace;
}

export async function updateMember(workspaceId, userId, targetUserId, role) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const requester = workspace.members.find(m => m.user.toString() === userId);
  if (!requester || requester.role !== 'owner') {
    throw new AppError('Only owner can change roles', 403);
  }

  const target = workspace.members.find(m => m.user.toString() === targetUserId);
  if (!target) throw new AppError('Member not found', 404);

  if (target.role === 'owner') throw new AppError('Cannot change owner role', 403);
  target.role = role;
  await workspace.save();
  return workspace;
}

export async function removeMember(workspaceId, userId, targetUserId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const requester = workspace.members.find(m => m.user.toString() === userId);
  const target = workspace.members.find(m => m.user.toString() === targetUserId);

  if (!target) throw new AppError('Member not found', 404);

  const canRemove = requester?.role === 'owner' ||
    (requester?.role === 'admin' && target.role === 'member') ||
    targetUserId === userId;

  if (!canRemove) throw new AppError('Insufficient permissions', 403);

  if (target.role === 'owner') throw new AppError('Cannot remove owner', 403);

  workspace.members = workspace.members.filter(m => m.user.toString() !== targetUserId);
  await workspace.save();

  await User.findByIdAndUpdate(targetUserId, { $pull: { workspaces: workspaceId } });
  return workspace;
}

export async function getMemberRole(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return null;
  const member = workspace.members.find(m => m.user.toString() === userId);
  return member?.role || null;
}