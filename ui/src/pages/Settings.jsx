import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/features/auth/authSelectors";
import { setUser } from "@/features/auth/authSlice";
import { authService } from "@/features/auth/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, User, Mail, Hash, Shield } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function avatarSrc(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  const base = API_URL.replace(/\/$/, "").replace(/\/api$/, "");
  return `${base}${avatar}`;
}

export default function Settings() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(avatarSrc(user?.avatar));

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setMsg("");
    // preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setAvatarUploading(true);
    try {
      const updated = await authService.uploadAvatar(file);
      dispatch(setUser(updated));
      setPreview(avatarSrc(updated.avatar));
      setMsg("Avatar uploaded");
    } catch (e2) {
      setErr(e2.message || "Failed to upload avatar");
      setPreview(avatarSrc(user?.avatar));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setSaving(true);
    try {
      if (!name.trim()) throw new Error("Name is required");
      const updated = await authService.updateProfile({ name: name.trim() });
      dispatch(setUser(updated));
      setMsg("Profile updated");
    } catch (e2) {
      setErr(e2.message || "Failed to update");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500">Manage your profile and workspace preferences.</p>
      </div>

      {msg && <Alert className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800 py-3"><AlertDescription>{msg}</AlertDescription></Alert>}
      {err && <Alert variant="destructive" className="rounded-xl py-3"><AlertDescription>{err}</AlertDescription></Alert>}

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="rounded-2xl md:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden grid place-items-center">
              {preview ? <img src={preview} alt="avatar" className="h-full w-full object-cover" /> : <User className="h-10 w-10 text-zinc-400" />}
            </div>
            <CardTitle className="text-base mt-3">{user?.name}</CardTitle>
            <CardDescription className="font-mono text-xs">{user?.email}</CardDescription>
            {user?.chatCode && <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-zinc-900 text-white"><Hash className="h-3 w-3"/> {user.chatCode}</div>}
          </CardHeader>
          <CardContent className="space-y-3">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarChange} />
            <Button variant="outline" className="w-full rounded-xl" onClick={()=>fileRef.current?.click()} disabled={avatarUploading}>
              {avatarUploading ? <><Loader2 className="h-4 w-4 animate-spin"/> Uploading…</> : <><Upload className="h-4 w-4"/> Upload avatar</>}
            </Button>
            <p className="text-xs text-zinc-500 text-center">JPEG, PNG, GIF, WEBP — max 5MB</p>
          </CardContent>
        </Card>

        <div className="space-y-6 md:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4"/> Profile</CardTitle>
              <CardDescription>Update your display name. Email cannot be changed.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" maxLength={50} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input id="email" value={user?.email || ""} disabled className="h-11 rounded-xl pl-9 bg-zinc-50" />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="rounded-xl bg-zinc-900 hover:bg-zinc-800">
                  {saving && <Loader2 className="h-4 w-4 animate-spin"/>} Save changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4"/> Workspace invite</CardTitle>
              <CardDescription>Share your workspace slug as invite code. New members request to join — owner approves via notification bell or workspace dropdown.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              <p>Go to workspace switcher → invite code is shown per workspace. Others use <span className="font-mono font-bold">Join by code</span> and wait for approval.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
