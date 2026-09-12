export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
};

export const CHANNEL_TYPES = {
  CHANNEL: 'channel',
  DM: 'dm',
};

export const CARD_ACTIONS = {
  CREATED: 'card:created',
  MOVED: 'card:moved',
  UPDATED: 'card:updated',
  DELETED: 'card:deleted',
  ASSIGNED: 'card:assigned',
  COMMENT_ADDED: 'card:comment_added',
};

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
};

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
};

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  DESTINATION: './uploads',
};