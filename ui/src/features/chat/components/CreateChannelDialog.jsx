import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/api/client";

export default function CreateChannelDialog({ open, onOpenChange, workspaceId, onCreate }) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if(!open || !workspaceId) return;
    api.get(`/workspaces/${workspaceId}`).then(d=>{
      const ws = d.workspace || d;
      setMembers(ws.members?.map(m=> m.user || m) || []);
    }).catch(()=> setMembers([]));
  },[open, workspaceId]);

  const toggle = (id) => setSelected(s=> s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);

  const handleSubmit = async (e)=>{
    e.preventDefault();
    if(!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), memberIds: selected });
      setName(""); setSelected([]);
      onOpenChange(false);
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={()=>onOpenChange(false)} className="rounded-2xl max-w-md">
        <DialogHeader><DialogTitle>Create channel</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Channel name</Label>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="general" maxLength={50} required className="h-11 rounded-xl"/>
          </div>
          <div className="space-y-2">
            <Label>Members (select at least one)</Label>
            <div className="max-h-40 overflow-auto border border-zinc-200 rounded-xl divide-y divide-zinc-100">
              {members.length ? members.map(m=>{
                const id = m._id || m;
                const isSel = selected.includes(id);
                return (
                  <label key={id} className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50 ${isSel?"bg-zinc-50":""}`}>
                    <input type="checkbox" checked={isSel} onChange={()=>toggle(id)} className="rounded" />
                    <span className="flex-1 truncate">{m.name || m.email || id}</span>
                    <span className="text-xs text-zinc-500">{m.email}</span>
                  </label>
                );
              }) : <p className="text-xs text-zinc-500 p-3">No members found. Invite members to workspace first.</p>}
            </div>
            <p className="text-xs text-zinc-500">You will be added automatically.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={()=>onOpenChange(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={loading || !name.trim() || selected.length===0} className="rounded-xl bg-zinc-900 hover:bg-zinc-800">{loading?"Creating...":"Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
