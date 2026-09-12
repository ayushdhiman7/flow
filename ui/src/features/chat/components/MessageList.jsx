import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import MessageItem, { getUserId } from "./MessageItem";

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() === db.toDateString();
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

export default function MessageList({ messages, loading, hasMore, onLoadMore, onReply, currentUserId }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const topSentinelRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Infinite scroll via IntersectionObserver: when top sentinel visible, load older
  useEffect(() => {
    if (!hasMore || loading) return;
    const container = containerRef.current;
    const sentinel = topSentinelRef.current;
    if (!container || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore?.();
        }
      },
      { root: container, threshold: 0.1, rootMargin: "100px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (loading && messages.length===0) {
    return <div className="flex-1 grid place-items-center text-sm text-zinc-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading messages…</div>;
  }

  if (messages.length===0) {
    return <div className="flex-1 grid place-items-center p-8 text-center"><p className="text-sm text-zinc-500">No messages yet<br/><span className="text-xs">Be the first to send a message</span></p></div>;
  }

  const normalizedCurrent = currentUserId ? String(currentUserId) : null;

  return (
    <div ref={containerRef} className="flex-1 overflow-auto py-3 space-y-0.5 bg-[#f8f9fb] dark:bg-zinc-900 custom-scrollbar">
      <div ref={topSentinelRef} className="h-1" aria-hidden />
      {hasMore && (
        <div className="flex justify-center py-2">
          {loading ? (
            <span className="text-xs text-zinc-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Loading…</span>
          ) : (
            <span className="text-[11px] text-zinc-400">Scroll up to load older messages</span>
          )}
        </div>
      )}
      {messages.map((m, idx) => {
        const prev = messages[idx - 1];
        const showDaySeparator = !prev || !isSameDay(prev.createdAt, m.createdAt);
        const userId = getUserId(m.user);
        const isOwn = normalizedCurrent ? String(userId) === normalizedCurrent : false;
        return (
          <div key={m._id}>
            {showDaySeparator && (
              <div className="flex justify-center my-3">
                <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-500 shadow-sm">
                  {formatDayLabel(m.createdAt)}
                </span>
              </div>
            )}
            <MessageItem message={m} isOwn={isOwn} onReply={onReply} />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
