import { Hash, Users } from "lucide-react";

export default function ChannelHeader({ channel }) {
  if (!channel) return <div className="h-[56px] border-b border-zinc-200 bg-white flex items-center px-4 text-sm text-zinc-500">Select a channel</div>;
  const isDM = channel.type === "dm";
  return (
    <div className="h-[56px] border-b border-zinc-200 bg-white flex items-center gap-3 px-4 shrink-0">
      <div className={`h-8 w-8 rounded-xl grid place-items-center ${isDM ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 border border-zinc-200"}`}>
        {isDM ? <Users className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate flex items-center gap-2">
          {isDM ? (channel.members?.map(m=>m.name).join(", ") || "Direct message") : `# ${channel.name}`}
          {!isDM && <span className="hidden sm:inline-flex items-center gap-1 text-xs font-normal text-zinc-500"><Users className="h-3 w-3"/>{channel.members?.length||0} members</span>}
        </div>
        <div className="text-xs text-zinc-500 truncate">{isDM ? "DM • workspace members" : channel.type}</div>
      </div>
    </div>
  );
}
