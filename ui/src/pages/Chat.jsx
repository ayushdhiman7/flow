import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSelectedWorkspaceId, selectWorkspaces } from "@/features/workspace/workspaceSelectors";
import { fetchWorkspaces } from "@/features/workspace/workspaceSlice";
import { selectUser } from "@/features/auth/authSelectors";
import { fetchChannels, fetchGlobalDMs, createChannel, createDM, createDMByCode, fetchMessages, sendMessage, selectChannel } from "@/features/chat/chatSlice";
import { selectAllChannels, selectCurrentChannelId, selectMessagesForChannel, selectChatLoading, selectChatError } from "@/features/chat/chatSelectors";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Hash, AlertCircle, Copy, Check } from "lucide-react";
import ChannelList from "@/features/chat/components/ChannelList";
import ChannelHeader from "@/features/chat/components/ChannelHeader";
import MessageList from "@/features/chat/components/MessageList";
import MessageInput from "@/features/chat/components/MessageInput";
import CreateChannelDialog from "@/features/chat/components/CreateChannelDialog";
import CreateDMDialog from "@/features/chat/components/CreateDMDialog";
import useSocket from "@/features/chat/hooks/useSocket";

export default function ChatPage() {
  const dispatch = useDispatch();
  const workspaceId = useSelector(selectSelectedWorkspaceId);
  const workspaces = useSelector(selectWorkspaces);
  const allChannels = useSelector(selectAllChannels);
  const currentId = useSelector(selectCurrentChannelId);
  const currentChannel = allChannels.find(c=>c._id===currentId) || null;
  const channelWorkspaceId = currentChannel?.workspace?._id || currentChannel?.workspace || workspaceId;
  const msgState = useSelector(s=> selectMessagesForChannel(s, currentId));
  const loading = useSelector(selectChatLoading);
  const error = useSelector(selectChatError);

  const user = useSelector(selectUser);
  const [createOpen, setCreateOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [copied, setCopied] = useState(false);

  useSocket();

  useEffect(()=>{ dispatch(fetchWorkspaces()); },[dispatch]);
  useEffect(()=>{ if(workspaceId) dispatch(fetchChannels(workspaceId)); },[dispatch, workspaceId]);
  useEffect(()=>{
    if(workspaces.length) dispatch(fetchGlobalDMs(workspaces));
  },[dispatch, workspaces]);
  useEffect(()=>{
    if(channelWorkspaceId && currentId) dispatch(fetchMessages({workspaceId: channelWorkspaceId, channelId: currentId}));
  },[dispatch, channelWorkspaceId, currentId]);

  // polling fallback ensures message is received even if socket missed (e.g. receiver not yet joined or different workspace)
  useEffect(()=>{
    if(!channelWorkspaceId || !currentId) return;
    const id = setInterval(()=> dispatch(fetchMessages({workspaceId: channelWorkspaceId, channelId: currentId})), 3000);
    return ()=> clearInterval(id);
  },[dispatch, channelWorkspaceId, currentId]);
  // also poll DMs list so cross-workspace DM appears quickly for receiver
  useEffect(()=>{
    if(!workspaces.length) return;
    const id = setInterval(()=> dispatch(fetchGlobalDMs(workspaces)), 5000);
    return ()=> clearInterval(id);
  },[dispatch, workspaces]);

  const handleSelect = (id) => dispatch(selectChannel(id));

  const handleCreateChannel = async ({name, memberIds}) => {
    await dispatch(createChannel({workspaceId, name, memberIds}));
  };
  const handleCreateDM = async (userId) => {
    await dispatch(createDM({workspaceId, userId}));
  };
  const handleCreateDMByCode = async (chatCode) => {
    await dispatch(createDMByCode({workspaceId, chatCode}));
  };
  const handleCopyCode = async ()=>{
    if(!user?.chatCode) return;
    await navigator.clipboard.writeText(user.chatCode);
    setCopied(true); setTimeout(()=>setCopied(false),1500);
  };
  const handleSend = async ({content, replyTo: rt}) => {
    if(!currentId || !channelWorkspaceId) return;
    await dispatch(sendMessage({workspaceId: channelWorkspaceId, channelId: currentId, content, replyTo: rt}));
    setReplyTo(null);
  };
  const handleLoadMore = () => {
    if(!currentId || !msgState.hasMore) return;
    dispatch(fetchMessages({workspaceId: channelWorkspaceId, channelId: currentId, cursor: msgState.nextCursor, limit: 50}));
  };

  if(!workspaceId){
    return <div className="p-8 max-w-xl mx-auto"><Card className="rounded-2xl"><CardContent className="py-8 text-center text-sm text-zinc-500">Select a workspace to chat.</CardContent></Card></div>;
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-[#fbfcfe]">
      <div className="w-[280px] lg:w-[300px] border-r border-zinc-200 bg-white shrink-0 hidden sm:flex flex-col">
        <div className="mx-3 mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-widest text-zinc-500">YOUR CHAT CODE</div>
            <div className="font-mono text-sm font-bold tracking-widest truncate">{user?.chatCode || "—"}</div>
            <div className="text-[11px] text-zinc-500">Share to let others DM you</div>
          </div>
          <Button size="icon" variant="outline" className="h-8 w-8 rounded-xl shrink-0" onClick={handleCopyCode}>{copied ? <Check className="h-4 w-4 text-green-600"/> : <Copy className="h-4 w-4"/>}</Button>
        </div>
        {loading && allChannels.length===0 ? <div className="p-4 space-y-3"><Skeleton className="h-10 rounded-xl"/><Skeleton className="h-20 rounded-xl"/><Skeleton className="h-20 rounded-xl"/></div> :
          <ChannelList channels={allChannels} currentId={currentId} onSelect={handleSelect} onCreateChannel={()=>setCreateOpen(true)} onCreateDM={()=>setDmOpen(true)} />
        }
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <ChannelHeader channel={currentChannel} />
        {error && <div className="px-4 pt-2"><Alert variant="destructive" className="rounded-xl"><AlertCircle className="h-4 w-4"/><AlertDescription className="ml-2">{error}</AlertDescription></Alert></div>}

        {!currentId ? (
          <div className="flex-1 grid place-items-center p-8 text-center">
            <div className="space-y-3 max-w-sm">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-zinc-900 text-white grid place-items-center"><MessageSquare className="h-6 w-6"/></div>
              <h3 className="font-semibold">No channel selected</h3>
              <p className="text-sm text-zinc-500">Choose a channel from the list or create a new one. Channels are workspace-scoped and only visible to members.</p>
              <div className="flex justify-center gap-2">
                <Button onClick={()=>setCreateOpen(true)} className="rounded-xl bg-zinc-900 hover:bg-zinc-800">Create channel</Button>
                <Button variant="outline" onClick={()=>setDmOpen(true)} className="rounded-xl">New DM</Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <MessageList
              messages={msgState.items}
              loading={msgState.loading}
              hasMore={msgState.hasMore}
              onLoadMore={handleLoadMore}
              onReply={setReplyTo}
              currentUserId={user?._id || user?.id}
            />
            <MessageInput onSend={handleSend} sending={false} replyTo={replyTo} onCancelReply={()=>setReplyTo(null)} />
          </>
        )}
      </div>

      {/* Mobile channel list overlay when no channel? Show as drawer on small */}
      <div className="sm:hidden fixed bottom-4 left-4 right-4 flex gap-2">
        {!currentId && <Button size="sm" className="flex-1 rounded-xl bg-zinc-900" onClick={()=>setCreateOpen(true)}><Hash className="h-4 w-4"/> New channel</Button>}
      </div>

      <CreateChannelDialog open={createOpen} onOpenChange={setCreateOpen} workspaceId={workspaceId} onCreate={handleCreateChannel} />
      <CreateDMDialog open={dmOpen} onOpenChange={setDmOpen} workspaceId={workspaceId} onCreate={handleCreateDM} onCreateByCode={handleCreateDMByCode} />
    </div>
  );
}
