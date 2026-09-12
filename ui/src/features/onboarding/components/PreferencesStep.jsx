import { cn } from "@/lib/utils";
import { Code2, Palette, Megaphone, Layers, GraduationCap, User } from "lucide-react";

const useCases = [
  { id: "engineering", label: "Engineering", desc: "Sprints, bugs, releases", icon: Code2 },
  { id: "design", label: "Design", desc: "Files & feedback loops", icon: Palette },
  { id: "marketing", label: "Marketing", desc: "Campaigns & content", icon: Megaphone },
  { id: "product", label: "Product", desc: "Roadmaps & prioritization", icon: Layers },
  { id: "education", label: "Education", desc: "Courses & assignments", icon: GraduationCap },
  { id: "personal", label: "Personal", desc: "Tasks & life organization", icon: User },
];

const teamSizes = [
  { id: "just-me", label: "Just me" },
  { id: "2-5", label: "2–5 people" },
  { id: "6-20", label: "6–20 people" },
  { id: "20+", label: "20+ people" },
];

export default function PreferencesStep({ data, onChange, fieldError }) {
  const { useCase, teamSize } = data.preferences;

  const selectUseCase = (id) => onChange({ preferences: { useCase: id } });
  const selectTeamSize = (id) => onChange({ preferences: { teamSize: id } });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">How will you use Flow?</h2>
        <p className="text-sm text-muted-foreground">Help us tailor your default boards. You can change this later in settings.</p>
      </div>

      <div className="space-y-3">
        <p className="text-[13px] font-medium">Primary use case</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {useCases.map(({ id, label, desc, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectUseCase(id)}
              className={cn(
                "text-left rounded-2xl border p-4 transition-all flex flex-col gap-2.5 shadow-sm",
                useCase === id ? "border-zinc-900 bg-zinc-900 text-white shadow-md" : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
              )}
            >
              <Icon className={cn("h-5 w-5", useCase === id ? "text-white" : "text-zinc-500")} />
              <div>
                <div className="text-sm font-semibold">{label}</div>
                <div className={cn("text-xs leading-relaxed", useCase === id ? "text-zinc-300" : "text-zinc-500")}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
        {fieldError?.useCase && <p className="text-sm text-red-600">{fieldError.useCase}</p>}
      </div>

      <div className="space-y-3">
        <p className="text-[13px] font-medium">Team size</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {teamSizes.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectTeamSize(id)}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm font-medium transition-all shadow-sm",
                teamSize === id ? "border-zinc-900 bg-zinc-900 text-white shadow-md" : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {fieldError?.teamSize && <p className="text-sm text-red-600">{fieldError.teamSize}</p>}
      </div>
    </div>
  );
}
