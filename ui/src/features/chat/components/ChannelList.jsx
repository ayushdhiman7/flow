import { Hash, MessageCircle, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/avatar";

export default function ChannelList({ channels, currentId, onSelect, onCreateChannel, onCreateDM }) {
  const channelItems = channels.filter(c => c.type !== "dm");
  const dmItems = channels.filter(c => c.type === "dm");

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-100 space-y-3">
        <Button onClick={onCreateChannel} className="w-full justify-start gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 h-9">
          <Plus className="h-4 w-4" /> Create channel
        </Button>
        <Button variant="outline" onClick={onCreateDM} className="w-full justify-start gap-2 rounded-xl h-9">
          <MessageCircle className="h-4 w-4" /> New DM
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-5">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-zinc-400 px-2 mb-2">CHANNELS • {channelItems.length}</p>
          <div className="space-y-1">
            {channelItems.map(ch => (
              <button
                key={ch._id}
                onClick={() => onSelect(ch._id)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left",
                  currentId===ch._id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900")}
              >
                <Hash className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{ch.name || "Unnamed"}</span>
                {ch.members?.length>1 && <span className="text-xs opacity-60 flex items-center gap-1"><Users className="h-3 w-3"/>{ch.members.length}</span>}
              </button>
            ))}
            {channelItems.length===0 && <p className="text-xs text-zinc-400 px-3 py-2">No channels yet</p>}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold tracking-widest text-zinc-400 px-2 mb-2">DIRECT MESSAGES • {dmItems.length}</p>
          <div className="space-y-1">
            {dmItems.map(ch => {
              const other = ch.members?.find(m=> typeof m === 'object' ? m._id !== ch.createdBy?._id : m !== ch.createdBy) || ch.members?.[0];
              const name = typeof other === 'object' ? other.name : "DM";
              const avatar = typeof other === 'object' ? other.avatar : null;
              return (
                <button
                  key={ch._id}
                  onClick={() => onSelect(ch._id)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left",
                    currentId===ch._id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900")}
                >
                  <div className="h-7 w-7 rounded-full bg-zinc-100 border border-zinc-200 grid place-items-center text-xs font-medium shrink-0 overflow-hidden">
                    {getAvatarUrl(avatar) ? <img src={getAvatarUrl(avatar)} alt="" className="h-full w-full object-cover" /> : (name?.[0]?.toUpperCase() || "•")}
                  </div>
                  <span className="truncate flex-1">{name || "Direct message"}</span>
                </button>
              );
            })}
            {dmItems.length===0 && <p className="text-xs text-zinc-400 px-3 py-2">No DMs</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
