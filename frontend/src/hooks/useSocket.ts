import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { SOCKET_EVENTS } from '../utils/constants';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { addMessage, incrementUnread, markAsRead, currentChannel } = useChatStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      if (socket) {
        socket.disconnect();
        socket = null;
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    if (!socket) {
      socket = io('/', {
        auth: { token: accessToken },
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });
      socketRef.current = socket;
    }

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, (data: { message: any }) => {
      addMessage(data.message);
      if (currentChannel?.id !== data.message.channelId) {
        incrementUnread(data.message.channelId);
        toast('New message', { icon: '💬' });
      }
    });

    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, (notification: any) => {
      toast(notification.action || 'New notification', { icon: '🔔' });
    });

    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (data: any) => {
      console.log('Presence update:', data);
    });

    return () => {
      socket?.off('connect');
      socket?.off('disconnect');
      socket?.off(SOCKET_EVENTS.MESSAGE_NEW);
      socket?.off(SOCKET_EVENTS.NOTIFICATION_NEW);
      socket?.off(SOCKET_EVENTS.PRESENCE_UPDATE);
    };
  }, [accessToken, addMessage, incrementUnread, currentChannel]);

  const joinWorkspace = (workspaceId: string) => socket?.emit('join:workspace', workspaceId);
  const leaveWorkspace = (workspaceId: string) => socket?.emit('leave:workspace', workspaceId);
  const joinBoard = (boardId: string) => socket?.emit('join:board', boardId);
  const leaveBoard = (boardId: string) => socket?.emit('leave:board', boardId);
  const joinChannel = (channelId: string) => socket?.emit('join:channel', channelId);
  const leaveChannel = (channelId: string) => socket?.emit('leave:channel', channelId);
  const updatePresence = (data: { status: 'online' | 'away' | 'busy' }) => socket?.emit('presence:update', data);

  return { socket: socketRef.current, isConnected, joinWorkspace, leaveWorkspace, joinBoard, leaveBoard, joinChannel, leaveChannel, updatePresence };
}

export function getSocket() {
  return socket;
}