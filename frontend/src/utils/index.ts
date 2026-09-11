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

export function formatDate(date: string | Date, format = 'PPp'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return d.toLocaleString(undefined, options);
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d, 'PP');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}