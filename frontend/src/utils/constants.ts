export const CARD_ACTIONS = {
  CREATED: 'card:created',
  MOVED: 'card:moved',
  UPDATED: 'card:updated',
  DELETED: 'card:deleted',
  ASSIGNED: 'card:assigned',
  COMMENT_ADDED: 'card:comment_added',
} as const;

export const SOCKET_EVENTS = {
  CARD_CREATED: 'card:created',
  CARD_MOVED: 'card:moved',
  CARD_UPDATED: 'card:updated',
  CARD_DELETED: 'card:deleted',
  MESSAGE_NEW: 'message:new',
  NOTIFICATION_NEW: 'notification:new',
  PRESENCE_UPDATE: 'presence:update',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
} as const;

export const CHANNEL_TYPES = {
  CHANNEL: 'channel',
  DM: 'dm',
} as const;

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;
