import { createWorker } from '../config/queue.js';
import { isTest } from '../config/env.js';
import { emitToUser } from '../socket/socket.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

export const notificationWorker = isTest ? null : createWorker('notifications', async (job) => {
  const { name, data } = job;
  console.log(`[Notification Job] ${name}:`, data);

  switch (name) {
    case 'card-assigned':
      await notifyCardAssigned(data);
      break;
    case 'new-message':
      await notifyNewMessage(data);
      break;
    case 'card-comment':
      await notifyCardComment(data);
      break;
    case 'card-moved':
      await notifyCardMoved(data);
      break;
    case 'workspace-join-request':
      await notifyWorkspaceJoinRequest(data);
      break;
    case 'workspace-join-approved':
      await notifyWorkspaceJoinApproved(data);
      break;
    case 'workspace-join-rejected':
      await notifyWorkspaceJoinRejected(data);
      break;
    default:
      console.log(`Unknown notification job: ${name}`);
  }
});

async function notifyCardAssigned(data) {
  await emitToUser(data.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
    type: 'card-assigned',
    actorId: data.actorId,
    cardId: data.cardId,
    cardTitle: data.cardTitle,
    action: data.action,
    read: false,
    createdAt: new Date(),
  });
}

async function notifyNewMessage(data) {
  await emitToUser(data.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
    type: 'new-message',
    channelId: data.channelId,
    channelName: data.channelName,
    messagePreview: data.messagePreview,
    read: false,
    createdAt: new Date(),
  });
}

async function notifyCardComment(data) {
  await emitToUser(data.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
    type: 'card-comment',
    cardId: data.cardId,
    cardTitle: data.cardTitle,
    commentPreview: data.commentPreview,
    read: false,
    createdAt: new Date(),
  });
}

async function notifyCardMoved(data) {
  await emitToUser(data.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
    type: 'card-moved',
    cardId: data.cardId,
    cardTitle: data.cardTitle,
    fromList: data.fromList,
    toList: data.toList,
    read: false,
    createdAt: new Date(),
  });
}

async function notifyWorkspaceJoinRequest(data) {
  await emitToUser(data.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
    type: 'workspace-join-request',
    workspaceId: data.workspaceId,
    workspaceName: data.workspaceName,
    workspaceSlug: data.workspaceSlug,
    requestId: data.requestId,
    requester: data.requester,
    read: false,
    createdAt: new Date(),
  });
}

async function notifyWorkspaceJoinApproved(data) {
  await emitToUser(data.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
    type: 'workspace-join-approved',
    workspaceId: data.workspaceId,
    workspaceName: data.workspaceName,
    read: false,
    createdAt: new Date(),
  });
}

async function notifyWorkspaceJoinRejected(data) {
  await emitToUser(data.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
    type: 'workspace-join-rejected',
    workspaceId: data.workspaceId,
    workspaceName: data.workspaceName,
    read: false,
    createdAt: new Date(),
  });
}