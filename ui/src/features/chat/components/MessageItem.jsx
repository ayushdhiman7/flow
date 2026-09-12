/* eslint-disable react-refresh/only-export-components */
import { Reply, CheckCheck } from "lucide-react";

function getUserId(u) {
  if (!u) return null;
  if (typeof u === "string") return u;
  return u._id || u.id || null;
}

export default function MessageItem({ message, isOwn, onReply }) {
  const user = message.user || {};
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const replyContent = message.replyTo?.content || "";
  const replyUser = message.replyTo?.user;

  // own -> right aligned dark bubble, other -> left aligned light bubble
  if (isOwn) {
    return (
      <div className="group flex justify-end gap-2 px-4 py-1">
        <div className="flex flex-col items-end max-w-[78%] sm:max-w-[68%]">
          <div className="relative bg-zinc-900 text-white rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm">
            {message.replyTo && (
              <div className="mb-1.5 rounded-lg border-l-2 border-white/40 bg-white/10 px-2.5 py-1">
                <div className="text-[11px] font-medium text-zinc-200 leading-none">
                  Replying to {typeof replyUser === "object" ? replyUser?.name : "message"}
                </div>
                <div className="text-xs text-zinc-100/90 line-clamp-2 leading-tight mt-0.5">{replyContent || "[message]"}</div>
              </div>
            )}
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</div>
            <div className="mt-1 flex items-center justify-end gap-1.5">
              <span className="text-[11px] text-zinc-400">{time}</span>
              <CheckCheck className="h-3 w-3 text-zinc-500" />
            </div>
            <button
              onClick={() => onReply(message)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-7 w-7 rounded-full bg-white border border-zinc-200 shadow-sm grid place-items-center text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer"
              title="Reply"
            >
              <Reply className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex gap-2.5 px-4 py-1">
      <div className="h-8 w-8 rounded-full bg-zinc-900 text-white grid place-items-center text-xs font-medium shrink-0 overflow-hidden mt-0.5">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          user.name?.[0]?.toUpperCase() || "•"
        )}
      </div>
      <div className="flex flex-col items-start max-w-[78%] sm:max-w-[68%]">
        <div className="flex items-baseline gap-2 mb-1 ml-1">
          <span className="text-xs font-semibold text-zinc-900">{user.name || "Unknown"}</span>
          <span className="text-[11px] text-zinc-500">{time}</span>
        </div>
        <div className="relative bg-white border border-zinc-200 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
          {message.replyTo && (
            <div className="mb-1.5 rounded-lg border-l-2 border-zinc-300 bg-zinc-50 px-2.5 py-1">
              <div className="text-[11px] font-medium text-zinc-700 leading-none">
                Replying to {typeof replyUser === "object" ? replyUser?.name : "message"}
              </div>
              <div className="text-xs text-zinc-600 line-clamp-2 leading-tight mt-0.5">{replyContent || "[message]"}</div>
            </div>
          )}
          <div className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">{message.content}</div>
          <button
            onClick={() => onReply(message)}
            className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-7 w-7 rounded-full bg-white border border-zinc-200 shadow-sm grid place-items-center text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer"
            title="Reply"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { getUserId };
