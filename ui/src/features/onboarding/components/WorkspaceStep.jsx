import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/slug";

export default function WorkspaceStep({ data, onChange, fieldError }) {
  const name = data.workspace.name;
  const slugPreview = name ? slugify(name) : "your-workspace";
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-[22px] font-semibold tracking-tight">Create your workspace</h2>
        <p className="text-sm leading-relaxed text-zinc-600">A workspace is where your boards and teammates live. You can create more later.</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="workspace-name" className="text-[13px] font-medium">Workspace name</Label>
          <Input
            id="workspace-name"
            value={name}
            onChange={(e) => onChange({ workspace: { name: e.target.value } })}
            placeholder="Acme Inc."
            maxLength={50}
            className="h-11 rounded-xl border-zinc-200 focus-visible:border-zinc-900 focus-visible:ring-zinc-900/10"
          />
          {fieldError?.name ? (
            <p className="text-sm text-red-600">{fieldError.name}</p>
          ) : (
            <p className="text-xs text-zinc-500">1–50 characters. Example: “Acme Design” or “Personal”.</p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-zinc-700">Workspace URL preview</div>
            <div className="text-xs text-zinc-500">Auto-generated from your name</div>
          </div>
          <span className="font-mono text-sm font-medium px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-zinc-900">/w/{slugPreview}</span>
        </div>
      </div>
    </div>
  );
}
