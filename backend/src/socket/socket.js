import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    let token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    // fallback to httpOnly cookie (accessToken) for browser clients using withCredentials
    if (!token && socket.handshake.headers.cookie) {
      const cookies = Object.fromEntries(socket.handshake.headers.cookie.split(';').map(c => {
        const idx = c.indexOf('=');
        const k = c.slice(0, idx).trim();
        const v = c.slice(idx+1).trim();
        try { return [decodeURIComponent(k), decodeURIComponent(v)]; } catch { return [k, v]; }
      }));
      token = cookies.accessToken;
    }
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.id})`);

    socket.on('join:workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      socket.workspaceId = workspaceId;
    });

    socket.on('join:board', (boardId) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('join:channel', (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('leave:workspace', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on('leave:board', (boardId) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on('leave:channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('presence:update', (data) => {
      if (socket.workspaceId) {
        socket.to(`workspace:${socket.workspaceId}`).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
          userId: socket.user.id,
          ...data,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitToWorkspace(workspaceId, event, data) {
  if (!io) return;
  io.to(`workspace:${workspaceId}`).emit(event, data);
}

export function emitToBoard(boardId, event, data) {
  if (!io) return;
  io.to(`board:${boardId}`).emit(event, data);
}

export function emitToChannel(channelId, event, data) {
  if (!io) return;
  io.to(`channel:${channelId}`).emit(event, data);
}

export function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}