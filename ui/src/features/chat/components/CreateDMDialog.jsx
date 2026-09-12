import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";

export default function CreateDMDialog({ open, onOpenChange, workspaceId, onCreate, onCreateByCode }) {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState("");
  const [chatCode, setChatCode] = useState("");
  const [lookupUser, setLookupUser] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("member"); // member | code

  useEffect(()=>{
    if(!open || !workspaceId) return;
    api.get(`/workspaces/${workspaceId}`).then(d=>{
      const ws = d.workspace || d;
      setMembers(ws.members?.map(m=> m.user || m) || []);
    }).catch(()=> setMembers([]));
  },[open, workspaceId]);

  const handleLookup = async ()=>{
    setLookupError(""); setLookupUser(null);
    if(!chatCode.trim()) return;
    try{
      const data = await api.get(`/auth/by-code/${chatCode.trim().toUpperCase()}`);
      setLookupUser(data.user);
    }catch(e){ setLookupError(e.message); }
  };

  const handleSubmitMember = async (e)=>{
    e.preventDefault();
    if(!selected) return;
    setLoading(true);
    try {
      await onCreate(selected);
      setSelected("");
      onOpenChange(false);
    } finally { setLoading(false); }
  };

  const handleSubmitCode = async (e)=>{
    e.preventDefault();
    if(!chatCode.trim()) return;
    setLoading(true);
    try{
      if(onCreateByCode) await onCreateByCode(chatCode.trim().toUpperCase());
      else {
        // fallback: lookup then create DM
        const data = await api.get(`/auth/by-code/${chatCode.trim().toUpperCase()}`);
        await onCreate(data.user._id);
      }
      setChatCode(""); setLookupUser(null); setLookupError("");
      onOpenChange(false);
    }catch(e){ setLookupError(e.message); }
    finally{ setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={()=>onOpenChange(false)} className="rounded-2xl max-w-md">
        <DialogHeader><DialogTitle>New direct message</DialogTitle></DialogHeader>
        <div className="flex gap-2 mb-2">
          <Button type="button" variant={mode==="member"?"default":"outline"} size="sm" onClick={()=>setMode("member")} className="flex-1 rounded-xl">Workspace member</Button>
          <Button type="button" variant={mode==="code"?"default":"outline"} size="sm" onClick={()=>setMode("code")} className="flex-1 rounded-xl">By chat code</Button>
        </div>
        {mode==="member" ? (
          <form onSubmit={handleSubmitMember} className="space-y-4">
            <div className="space-y-2">
              <Label>Select member</Label>
              <select value={selected} onChange={e=>setSelected(e.target.value)} className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm">
                <option value="">Choose a member</option>
                {members.map(m=>{
                  const id = m._id || m;
                  return <option key={id} value={id}>{m.name || m.email} — {m.email}</option>;
                })}
              </select>
              {members.length===0 && <p className="text-xs text-zinc-500">No other members in this workspace. Invite someone first.</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>onOpenChange(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={loading || !selected} className="rounded-xl bg-zinc-900 hover:bg-zinc-800">{loading?"Opening...":"Open DM"}</Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleSubmitCode} className="space-y-4">
            <div className="space-y-2">
              <Label>Enter chat code</Label>
              <div className="flex gap-2">
                <Input value={chatCode} onChange={e=>setChatCode(e.target.value.toUpperCase())} placeholder="e.g. AB12CD34" maxLength={8} className="h-11 rounded-xl font-mono tracking-widest flex-1" />
                <Button type="button" variant="outline" onClick={handleLookup} className="rounded-xl">Find</Button>
              </div>
              {lookupError && <p className="text-xs text-red-600">{lookupError}</p>}
              {lookupUser && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm"><div className="font-medium">{lookupUser.name}</div><div className="text-xs text-zinc-600">{lookupUser.email} • {lookupUser.chatCode}</div></div>}
              <p className="text-xs text-zinc-500">Chat code is 8 chars, case-insensitive. Works across workspaces — DM will be created in current workspace.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>onOpenChange(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={loading || !chatCode.trim()} className="rounded-xl bg-zinc-900 hover:bg-zinc-800">{loading?"Opening...":"Chat via code"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
