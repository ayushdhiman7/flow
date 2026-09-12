import { Reply } from "lucide-react";

export default function MessageItem({ message, onReply }) {
  const user = message.user || {};
  const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "";
  return (
    <div className="group flex gap-3 px-4 py-2 hover:bg-zinc-50/70 rounded-xl transition-colors">
      <div className="h-8 w-8 rounded-full bg-zinc-900 text-white grid place-items-center text-xs font-medium shrink-0 overflow-hidden">
        {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : (user.name?.[0]?.toUpperCase() || "•")}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-zinc-900 truncate">{user.name || "Unknown"}</span>
          <span className="text-[11px] text-zinc-500 shrink-0">{time}</span>
          <button onClick={()=>onReply(message)} className="ml-auto opacity-0 group-hover:opacity-100 h-6 w-6 rounded-lg hover:bg-white border border-transparent hover:border-zinc-200 grid place-items-center text-zinc-500 transition-all cursor-pointer">
            <Reply className="h-3.5 w-3.5" />
          </button>
        </div>
        {message.replyTo && (
          <div className="mt-1 rounded-lg border-l-2 border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs">
            <span className="font-medium text-zinc-700">Replying to</span> <span className="text-zinc-600 line-clamp-1">{message.replyTo.content || "[message]"}</span>
          </div>
        )}
        <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap break-words mt-1">{message.content}</div>
      </div>
    </div>
  );
}
