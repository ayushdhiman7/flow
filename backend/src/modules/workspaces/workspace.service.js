import { Workspace } from './workspace.model.js';
import { User } from '../auth/index.js';
import { AppError } from '../../middleware/error.js';
import { generateSlug } from '../../utils/helpers.js';
import { cacheKey, getCache, setCache, delCache } from '../../config/redis.js';
import { CACHE_TTL, SOCKET_EVENTS } from '../../utils/constants.js';
import { emitToUser } from '../../socket/socket.js';
import { addNotificationJob } from '../../config/queue.js';

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
  await invalidateWorkspaceCache([ownerId]);
  return workspace;
}

export async function getWorkspaces(userId) {
  const key = cacheKey('workspaces', userId);
  const cached = await getCache(key);
  if (cached) return cached;
  const data = await Workspace.find({ 'members.user': userId })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar role')
    .sort({ createdAt: -1 });
  await setCache(key, data, CACHE_TTL.MEDIUM);
  return data;
}

async function invalidateWorkspaceCache(userIds = []) {
  if (!userIds.length) {
    await delCache(cacheKey('workspaces', '*'));
    return;
  }
  for (const uid of userIds) {
    await delCache(cacheKey('workspaces', uid));
  }
}

export async function getWorkspaceById(workspaceId, userId) {
  const key = cacheKey('workspace', workspaceId);
  const cached = await getCache(key);
  if (cached) {
    const isMemberCached = cached.members?.some(m => {
      const uid = m.user?._id?.toString() || m.user?.toString();
      return uid === userId;
    });
    if (!isMemberCached) throw new AppError('Not a member of this workspace', 403);
    return cached;
  }
  const workspace = await Workspace.findById(workspaceId)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar role');
  if (!workspace) throw new AppError('Workspace not found', 404);
  const isMember = workspace.members.some(m => m.user._id.toString() === userId);
  if (!isMember) throw new AppError('Not a member of this workspace', 403);
  await setCache(key, workspace, CACHE_TTL.SHORT);
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
  const memberIds = workspace.members.map(m => m.user.toString());
  await invalidateWorkspaceCache(memberIds);
  await delCache(cacheKey('workspace', workspaceId));
  return workspace;
}

export async function deleteWorkspace(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  if (workspace.owner.toString() !== userId) {
    throw new AppError('Only owner can delete workspace', 403);
  }

  const memberIdsDel = workspace.members.map(m => m.user.toString());
  await workspace.deleteOne();
  await User.updateMany({ workspaces: workspaceId }, { $pull: { workspaces: workspaceId } });
  await invalidateWorkspaceCache(memberIdsDel);
  await delCache(cacheKey('workspace', workspaceId));
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
  const allIdsInvite = workspace.members.map(m => m.user.toString());
  allIdsInvite.push(user._id.toString());
  await invalidateWorkspaceCache([...new Set(allIdsInvite)]);
  await delCache(cacheKey('workspace', workspaceId));
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
  await invalidateWorkspaceCache([targetUserId]);
  await delCache(cacheKey('workspace', workspaceId));
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
  await invalidateWorkspaceCache([targetUserId, ...workspace.members.map(m => m.user.toString())]);
  await delCache(cacheKey('workspace', workspaceId));
  return workspace;
}

export async function joinWorkspaceByCode(userId, code) {
  const slug = (code || "").toLowerCase().trim();
  if (!slug) throw new AppError('Invite code is required', 400);
  const workspace = await Workspace.findOne({ slug });
  if (!workspace) throw new AppError('Workspace not found for this code', 404);
  const existing = workspace.members.find(m => m.user.toString() === userId);
  if (existing) {
    const populated = await Workspace.findById(workspace._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');
    return { workspace: populated, status: 'already_member' };
  }
  const pending = workspace.joinRequests.find(r => r.user.toString() === userId && r.status === 'pending');
  if (pending) throw new AppError('Join request already pending — awaiting owner approval', 409);
  workspace.joinRequests.push({ user: userId, status: 'pending' });
  await workspace.save();
  await delCache(cacheKey('workspace', workspace._id.toString()));
  // notify owner/admins via socket + notification queue
  try {
    const requester = await User.findById(userId).select('name email avatar');
    const pendingId = workspace.joinRequests[workspace.joinRequests.length - 1]._id.toString();
    const payload = {
      type: 'workspace-join-request',
      workspaceId: workspace._id.toString(),
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      requestId: pendingId,
      requester: { _id: userId, name: requester?.name, email: requester?.email, avatar: requester?.avatar },
      createdAt: new Date(),
    };
    // notify owner and admins
    const notifyIds = workspace.members.filter(m => ['owner', 'admin'].includes(m.role)).map(m => m.user.toString());
    // ensure owner is included even if not in members (owner field)
    if (workspace.owner && !notifyIds.includes(workspace.owner.toString())) notifyIds.push(workspace.owner.toString());
    for (const nid of [...new Set(notifyIds)]) {
      if (nid === userId) continue;
      await emitToUser(nid, SOCKET_EVENTS.NOTIFICATION_NEW, payload);
      await addNotificationJob('workspace-join-request', { userId: nid, ...payload });
    }
  } catch (e) { /* non-blocking */ }
  return { workspace, status: 'pending' };
}

export async function getJoinRequests(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId).populate('joinRequests.user', 'name email avatar');
  if (!workspace) throw new AppError('Workspace not found', 404);
  const role = await getMemberRole(workspaceId, userId);
  if (!['owner', 'admin'].includes(role)) throw new AppError('Only owner/admin can view requests', 403);
  return workspace.joinRequests.filter(r => r.status === 'pending');
}

function idString(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v._id) return v._id.toString();
  return v.toString();
}

export async function handleJoinRequest(workspaceId, requestId, approverId, action) {
  const workspace = await Workspace.findById(workspaceId).populate('joinRequests.user', 'name email avatar');
  if (!workspace) throw new AppError('Workspace not found', 404);
  const role = await getMemberRole(workspaceId, approverId);
  if (role !== 'owner' && role !== 'admin') throw new AppError('Only owner/admin can handle requests', 403);
  const reqItem = workspace.joinRequests.id(requestId);
  if (!reqItem) throw new AppError('Request not found', 404);
  if (reqItem.status !== 'pending') throw new AppError('Request already handled', 409);
  const reqUserId = idString(reqItem.user);
  if (action === 'approve') {
    const exists = workspace.members.find(m => m.user.toString() === reqUserId);
    if (!exists) {
      workspace.members.push({ user: reqUserId, role: 'member' });
      await User.findByIdAndUpdate(reqUserId, { $addToSet: { workspaces: workspace._id } });
    }
    reqItem.status = 'approved';
    reqItem.handledBy = approverId;
    reqItem.handledAt = new Date();
    await workspace.save();
    await invalidateWorkspaceCache([reqUserId, ...workspace.members.map(m => m.user.toString())]);
    await delCache(cacheKey('workspace', workspace._id.toString()));
    try {
      await emitToUser(reqUserId, SOCKET_EVENTS.NOTIFICATION_NEW, {
        type: 'workspace-join-approved',
        workspaceId: workspace._id.toString(),
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
        read: false,
        createdAt: new Date(),
      });
      await addNotificationJob('workspace-join-approved', { userId: reqUserId, workspaceId: workspace._id.toString(), workspaceName: workspace.name });
    } catch {}
  } else if (action === 'reject') {
    reqItem.status = 'rejected';
    reqItem.handledBy = approverId;
    reqItem.handledAt = new Date();
    await workspace.save();
    await delCache(cacheKey('workspace', workspace._id.toString()));
    try {
      await emitToUser(reqUserId, SOCKET_EVENTS.NOTIFICATION_NEW, {
        type: 'workspace-join-rejected',
        workspaceId: workspace._id.toString(),
        workspaceName: workspace.name,
        read: false,
        createdAt: new Date(),
      });
      await addNotificationJob('workspace-join-rejected', { userId: reqUserId, workspaceId: workspace._id.toString(), workspaceName: workspace.name });
    } catch {}
  } else throw new AppError('Invalid action', 400);
  return workspace;
}

export async function getMemberRole(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return null;
  const member = workspace.members.find(m => m.user.toString() === userId);
  return member?.role || null;
}