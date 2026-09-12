import { useState } from "react";
import { Send, X, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function MessageInput({ onSend, sending, replyTo, onCancelReply }) {
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length>5000) return;
    onSend({ content: trimmed, replyTo: replyTo?._id });
    setContent("");
  };

  const handleKeyDown = (e) => {
    if (e.key==="Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-zinc-200 bg-white p-3 shrink-0">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-600 truncate">Replying to <span className="font-medium">{replyTo.user?.name || "message"}</span>: {replyTo.content.slice(0,60)}</span>
          </div>
          <button type="button" onClick={onCancelReply} className="h-6 w-6 rounded-lg hover:bg-white grid place-items-center text-zinc-500 cursor-pointer"><X className="h-4 w-4"/></button>
        </div>
      )}
      <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 focus-within:bg-white focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-900/5 p-2">
        <Textarea
          value={content}
          onChange={e=>setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Shift+Enter for newline)"
          className="min-h-[44px] max-h-[120px] border-0 bg-transparent shadow-none focus-visible:ring-0 resize-none flex-1"
          maxLength={5000}
        />
        <Button type="submit" disabled={sending || !content.trim()} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 h-9 w-9 p-0 shrink-0 cursor-pointer">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-[11px] text-zinc-400 mt-1 text-right">{content.length}/5000</div>
    </form>
  );
}
