import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import MessageItem from "./MessageItem";

export default function MessageList({ messages, loading, hasMore, onLoadMore, onReply }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading && messages.length===0) {
    return <div className="flex-1 grid place-items-center text-sm text-zinc-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading messages…</div>;
  }

  if (messages.length===0) {
    return <div className="flex-1 grid place-items-center p-8 text-center"><p className="text-sm text-zinc-500">No messages yet<br/><span className="text-xs">Be the first to send a message</span></p></div>;
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-auto py-2 space-y-1 custom-scrollbar">
      {hasMore && (
        <div className="flex justify-center py-2">
          <button onClick={onLoadMore} className="text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 cursor-pointer">Load older messages</button>
        </div>
      )}
      {messages.map(m => <MessageItem key={m._id} message={m} onReply={onReply} />)}
      <div ref={bottomRef} />
    </div>
  );
}
