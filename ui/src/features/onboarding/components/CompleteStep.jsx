import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

export default function CompleteStep({ workspace, preferences }) {
  return (
    <div className="space-y-7 text-center">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-200 grid place-items-center text-emerald-600 shadow-sm">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <div className="space-y-3">
        <h2 className="text-[26px] font-semibold tracking-tight">You&apos;re all set!</h2>
        <p className="text-sm leading-relaxed text-zinc-600 max-w-md mx-auto">
          Your workspace <span className="font-semibold text-zinc-900">{workspace?.name ? `“${workspace.name}”` : ""}</span> is ready. Jump into your dashboard to create boards and invite teammates.
        </p>
      </div>

      {(preferences.useCase || preferences.teamSize) && (
        <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-left shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Your setup</div>
          <div className="mt-2 space-y-1 text-sm">
            {preferences.useCase && <div className="text-zinc-600">Use case: <span className="font-medium text-zinc-900 capitalize">{preferences.useCase}</span></div>}
            {preferences.teamSize && <div className="text-zinc-600">Team size: <span className="font-medium text-zinc-900">{preferences.teamSize}</span></div>}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-zinc-900 text-white px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium">
        <span>Next: your dashboard awaits</span> <ArrowRight className="h-4 w-4" />
      </div>

      <p className="text-xs text-zinc-500">You can change workspace name and preferences later in Settings.</p>
    </div>
  );
}
