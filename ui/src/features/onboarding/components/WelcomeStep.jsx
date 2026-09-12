import { LayoutDashboard, MessageSquare, Users, Sparkles, Clock } from "lucide-react";

export default function WelcomeStep({ user }) {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-900 text-white tracking-wide">
          <Sparkles className="h-3 w-3" /> NEW WORKSPACE SETUP
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight leading-tight">
          Welcome to Flow, <span className="text-zinc-900">{user?.name?.split(" ")[0] || "there"}</span>
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600">
          Flow is your calm hub for boards, tasks, and team chat. Set up your workspace in under 2 minutes — we will guide you step by step.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 text-white grid place-items-center shadow-sm"><LayoutDashboard className="h-4 w-4" /></div>
          <h3 className="text-sm font-semibold">Boards & Tasks</h3>
          <p className="text-xs leading-relaxed text-zinc-500">Kanban boards to track work from idea to done with drag & drop.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center shadow-sm"><Users className="h-4 w-4" /></div>
          <h3 className="text-sm font-semibold">Workspaces</h3>
          <p className="text-xs leading-relaxed text-zinc-500">Create a dedicated space for your team or personal projects.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-9 w-9 rounded-xl bg-violet-600 text-white grid place-items-center shadow-sm"><MessageSquare className="h-4 w-4" /></div>
          <h3 className="text-sm font-semibold">Chat & Presence</h3>
          <p className="text-xs leading-relaxed text-zinc-500">Real-time channels and DMs with presence indicators.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 flex items-center gap-3 text-sm">
        <div className="h-8 w-8 rounded-xl bg-white border border-zinc-200 grid place-items-center shrink-0"><Clock className="h-4 w-4 text-zinc-600"/></div>
        <div className="flex-1">
          <div className="text-sm font-medium text-zinc-900">Quick setup — 4 steps</div>
          <div className="text-xs text-zinc-500">Profile • Workspace • Preferences • Done</div>
        </div>
        <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-zinc-700">~2 min</div>
      </div>
    </div>
  );
}
