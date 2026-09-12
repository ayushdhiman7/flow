import { Channel } from './channel.model.js';
import { Message } from './message.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { AppError } from '../../middleware/error.js';
import { getMemberRole } from '../workspaces/workspace.service.js';
import { SOCKET_EVENTS } from '../../utils/constants.js';
import { addNotificationJob } from '../../config/queue.js';
import { emitToChannel } from '../../socket/socket.js';

export async function createChannel(workspaceId, userId, data) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  const memberIds = [...new Set([userId, ...data.memberIds])];
  const channel = await Channel.create({
    ...data,
    workspace: workspaceId,
    members: memberIds,
    createdBy: userId,
  });

  return channel;
}

export async function getChannels(workspaceId, userId) {
  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  return Channel.find({ workspace: workspaceId, members: userId, isArchived: false })
    .populate('members', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .sort({ updatedAt: -1 });
}

export async function getChannelById(channelId, userId) {
  const channel = await Channel.findById(channelId)
    .populate('members', 'name email avatar')
    .populate('createdBy', 'name email avatar');
  if (!channel) throw new AppError('Channel not found', 404);

  const role = await getMemberRole(channel.workspace, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  if (!channel.members.some(m => m._id.toString() === userId)) {
    throw new AppError('Not a member of this channel', 403);
  }

  return channel;
}

export async function createDM(workspaceId, userId, targetUserId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  const existing = await Channel.findOne({
    workspace: workspaceId,
    type: 'dm',
    members: { $all: [userId, targetUserId], $size: 2 },
  });

  if (existing) return existing;

  const channel = await Channel.create({
    workspace: workspaceId,
    type: 'dm',
    members: [userId, targetUserId],
    createdBy: userId,
  });

  return channel;
}

export async function createDMByCode(workspaceId, userId, chatCode) {
  const { User } = await import('../auth/user.model.js');
  const target = await User.findOne({ chatCode: chatCode.toUpperCase().trim() });
  if (!target) throw new AppError('User not found for this chat code', 404);
  if (target._id.toString() === userId) throw new AppError('Cannot DM yourself', 400);
  // auto-add target to workspace if not already a member so DM is visible to both
  const targetRole = await getMemberRole(workspaceId, target._id.toString());
  if (!targetRole) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError('Workspace not found', 404);
    workspace.members.push({ user: target._id, role: 'member' });
    await workspace.save();
    await User.findByIdAndUpdate(target._id, { $addToSet: { workspaces: workspaceId } });
  }
  return createDM(workspaceId, userId, target._id.toString());
}

export async function getMessages(channelId, userId, cursor, limit) {
  const channel = await getChannelById(channelId, userId);

  const query = { channel: channelId, isDeleted: false };
  if (cursor) query._id = { $gt: cursor };

  const messages = await Message.find(query)
    .populate('user', 'name email avatar')
    .populate('replyTo', 'content user')
    .sort({ createdAt: 1 })
    .limit(limit + 1);

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  return {
    messages: messages.reverse(),
    hasMore,
    nextCursor: messages.length ? messages[0]._id.toString() : null,
  };
}

export async function sendMessage(channelId, userId, data) {
  const channel = await getChannelById(channelId, userId);

  const message = await Message.create({
    ...data,
    channel: channelId,
    user: userId,
  });

  await channel.updateOne({ lastMessageAt: new Date() });

  const populated = await Message.findById(message._id)
    .populate('user', 'name email avatar')
    .populate('replyTo', 'content user');

  await emitToChannel(channelId, SOCKET_EVENTS.MESSAGE_NEW, { message: populated });
  await notifyChannelMembers(channel, userId, message);

  return populated;
}

async function notifyChannelMembers(channel, senderId, message) {
  const otherMembers = channel.members
    .map(m => m.toString())
    .filter(id => id !== senderId);

  for (const memberId of otherMembers) {
    await addNotificationJob('new-message', {
      userId: memberId,
      channelId: channel._id,
      channelName: channel.name || 'DM',
      messagePreview: message.content.slice(0, 100),
    });
  }
}