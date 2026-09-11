import { useState, useEffect, useRef } from 'react';
import { Button, Avatar, Input, Modal } from '../ui';
import { useChatStore, useUIStore } from '../../store';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../api/endpoints';
import { useSocket } from '../../hooks';
import { formatRelativeTime, classNames } from '../../utils';
import { SOCKET_EVENTS } from '../../utils/constants';

export function RightSidebar() {
  const { rightSidebarOpen } = useUIStore();
  const { channels, currentChannel, messages, hasMoreMessages, nextCursor, isLoading,
    addChannel, setCurrentChannel, setMessages, prependMessages, addMessage, markAsRead, incrementUnread } = useChatStore();
  const { user } = useAuthStore();
  const { socket, joinChannel, leaveChannel } = useSocket();
  const [newMessage, setNewMessage] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [dmUserEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentChannel) return;
    const loadMessages = async () => {
      try {
        const res = await chatApi.getMessages(currentChannel.id);
        const data = res.data as any;
        setMessages(data.messages || [], data.hasMore || false, data.nextCursor || null);
        markAsRead(currentChannel.id);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    loadMessages();
    joinChannel(currentChannel.id);
    return () => { leaveChannel(currentChannel.id); };
  }, [currentChannel, setMessages, markAsRead, joinChannel, leaveChannel]);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (data: { message: any }) => {
      addMessage(data.message);
      if (currentChannel?.id !== data.message.channelId) {
        incrementUnread(data.message.channelId);
      }
    };
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleMessage);
    return () => { socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleMessage); };
  }, [socket, addMessage, incrementUnread, currentChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMoreMessages = async () => {
    if (!currentChannel || !hasMoreMessages || isLoading || !nextCursor) return;
    try {
      const res = await chatApi.getMessages(currentChannel.id, nextCursor, 50);
      const data = res.data as any;
      prependMessages(data.messages || [], data.hasMore || false, data.nextCursor || null);
    } catch (err) {
      console.error('Failed to load more messages:', err);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChannel) return;
    const content = newMessage.trim();
    setNewMessage('');
    try {
      await chatApi.sendMessage(currentChannel.id, { content });
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(content);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    try {
      const workspaceId = getWorkspaceId();
      const res = await chatApi.create(workspaceId, { name: newChannelName, type: 'channel', memberIds: [] });
      addChannel((res.data as any).channel);
      setShowCreateChannel(false);
      setNewChannelName('');
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  const handleCreateDM = async () => {
    if (!dmUserEmail.trim()) return;
    try {
      const workspaceId = getWorkspaceId();
      const res = await chatApi.createDM(workspaceId, dmUserEmail);
      addChannel((res.data as any).channel);
      setShowCreateChannel(false);
    } catch (err) {
      console.error('Failed to create DM:', err);
    }
  };
  void handleCreateDM;

  function getWorkspaceId() {
    const path = window.location.pathname;
    const match = path.match(/\/w\/([^/]+)/);
    return match?.[1] || '';
  }

  if (!rightSidebarOpen) return null;

  return (
    <aside className="fixed right-0 top-16 bottom-0 z-30 w-96 bg-white dark:bg-slate-900 border-l dark:border-slate-700 flex flex-col">
      <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">Chat</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowCreateChannel(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => setCurrentChannel(channel)}
            className={classNames(
              'w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
              currentChannel?.id === channel.id ? 'bg-primary-50 dark:bg-primary-900/30' : ''
            )}
          >
            <div className={classNames('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              channel.type === 'dm' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
            )}>
              {channel.type === 'dm' ? (
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {channel.name || 'Direct Message'}
              </p>
              {(channel.unreadCount || 0) > 0 && (
                <span className="text-xs bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 px-2 py-0.5 rounded-full">
                  {channel.unreadCount}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {currentChannel && (
        <div className="border-t dark:border-slate-700 flex flex-col flex-1 min-h-0">
          <div className="p-4 flex items-center gap-3 border-b dark:border-slate-700">
            <div className={classNames('w-10 h-10 rounded-full flex items-center justify-center',
              currentChannel.type === 'dm' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
            )}>
              {currentChannel.type === 'dm' ? (
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{currentChannel.name || 'Direct Message'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentChannel.type === 'channel' ? '# Channel' : 'Direct Message'}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" onScroll={handleScroll}>
            {messages.map((message) => (
              <div key={message.id} className={classNames('flex gap-2', message.user.id === user?.id ? 'flex-row-reverse' : '')}>
                <Avatar name={message.user.name} src={message.user.avatar} size="sm" />
                <div className={classNames('max-w-[70%]', message.user.id === user?.id ? 'text-right' : '')}>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {message.user.id === user?.id ? 'You' : message.user.name}
                    {' '}{formatRelativeTime(message.createdAt)}
                  </p>
                  <div className={classNames(
                    'inline-block px-4 py-2 rounded-2xl text-sm',
                    message.user.id === user?.id
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none'
                  )}>
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-slate-700">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={!newMessage.trim()}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </div>
          </form>
        </div>
      )}

      <Modal isOpen={showCreateChannel} onClose={() => setShowCreateChannel(false)} title="New Conversation">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="channel" defaultChecked className="text-primary-600" />
                <span>Channel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="dm" className="text-primary-600" />
                <span>Direct Message</span>
              </label>
            </div>
          </div>
          <Input label="Channel Name" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="general" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreateChannel(false)}>Cancel</Button>
            <Button onClick={handleCreateChannel}>Create</Button>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
