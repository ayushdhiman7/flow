import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfileStep({ user, data, onChange, fieldError }) {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-[22px] font-semibold tracking-tight">About you</h2>
        <p className="text-sm leading-relaxed text-zinc-600">Confirm your profile details. This is how teammates will see you.</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="profile-name" className="text-[13px] font-medium">Full name</Label>
          <Input
            id="profile-name"
            value={data.profile.name}
            onChange={(e) => onChange({ profile: { name: e.target.value } })}
            placeholder="Jane Doe"
            autoComplete="name"
            className="h-11 rounded-xl border-zinc-200 focus-visible:border-zinc-900 focus-visible:ring-zinc-900/10"
          />
          {fieldError?.name ? (
            <p className="text-sm text-red-600 flex items-center gap-1">{fieldError.name}</p>
          ) : (
            <p className="text-xs text-zinc-500">2–50 characters. Visible to workspace members.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email" className="text-[13px] font-medium">Email</Label>
          <Input id="profile-email" value={user?.email || ""} disabled className="h-11 rounded-xl bg-zinc-50 border-zinc-200 text-zinc-600" />
          <p className="text-xs text-zinc-500">Email is managed in authentication and cannot be changed here.</p>
        </div>
      </div>
    </div>
  );
}
