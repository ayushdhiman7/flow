import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSelectedWorkspaceId, selectSelectedWorkspace } from "@/features/workspace/workspaceSelectors";
import { fetchWorkspaces } from "@/features/workspace/workspaceSlice";
import { fetchNotes, createNote, updateNote, deleteNote } from "@/features/notes/notesSlice";
import { selectNotes, selectNotesLoading, selectNotesSaving, selectNotesError } from "@/features/notes/notesSelectors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, StickyNote, AlertCircle, Loader2, Pin } from "lucide-react";
import NoteCard from "@/features/notes/components/NoteCard";

export default function NotesPage() {
  const dispatch = useDispatch();
  const workspaceId = useSelector(selectSelectedWorkspaceId);
  const workspace = useSelector(selectSelectedWorkspace);
  const notes = useSelector(selectNotes);
  const loading = useSelector(selectNotesLoading);
  const saving = useSelector(selectNotesSaving);
  const error = useSelector(selectNotesError);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterPinned, setFilterPinned] = useState(false);

  useEffect(()=>{ dispatch(fetchWorkspaces()); },[dispatch]);
  useEffect(()=>{ if(workspaceId) dispatch(fetchNotes({workspaceId})); },[dispatch, workspaceId]);

  // client-side search (already fetched); if backend supports search we refetch on debounced search
  useEffect(()=>{
    if(!workspaceId) return;
    const t = setTimeout(()=>{
      if(search.trim()) dispatch(fetchNotes({workspaceId, search: search.trim()}));
      else dispatch(fetchNotes({workspaceId}));
    }, 400);
    return ()=>clearTimeout(t);
  },[search, workspaceId, dispatch]);

  const filtered = useMemo(()=>{
    let list = notes;
    if(filterPinned) list = list.filter(n=>n.isPinned);
    if(!search.trim()) return list;
    // if backend already filtered, return as is
    return list;
  },[notes, filterPinned, search]);

  const openCreate = () => { setEditing(null); setTitle(""); setContent(""); setDialogOpen(true); };
  const openEdit = (note) => { setEditing(note); setTitle(note.title); setContent(note.content||""); setDialogOpen(true); };
  const handleSave = async (e)=>{
    e.preventDefault();
    if(!title.trim()) return;
    if(editing){
      await dispatch(updateNote({workspaceId, id: editing._id, patch:{title:title.trim(), content}}));
    } else {
      await dispatch(createNote({workspaceId, title:title.trim(), content}));
    }
    setDialogOpen(false);
  };
  const handleDelete = async ()=>{
    await dispatch(deleteNote({workspaceId, id: deleteConfirm._id}));
    setDeleteConfirm(null);
  };
  const togglePin = async (note)=>{
    await dispatch(updateNote({workspaceId, id: note._id, patch:{isPinned: !note.isPinned}}));
  };

  if(!workspaceId){
    return <div className="max-w-5xl mx-auto p-8"><Card className="rounded-2xl border-zinc-200"><CardContent className="py-10 text-center text-sm text-zinc-500">Select a workspace to view notes.</CardContent></Card></div>
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight leading-none flex items-center gap-3"><StickyNote className="h-6 w-6"/>Notes</h1>
          <p className="text-sm text-zinc-500 mt-1">Keep important information for <span className="font-medium text-zinc-900">{workspace?.name}</span> • {notes.length} note{notes.length!==1&&"s"}</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 h-10 px-5"><Plus className="h-4 w-4"/> New Note</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"/>
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes..." className="pl-9 h-10 rounded-xl bg-white border-zinc-200"/>
        </div>
        <Button variant={filterPinned?"default":"outline"} onClick={()=>setFilterPinned(v=>!v)} className={`rounded-xl h-10 ${filterPinned?"bg-zinc-900 hover:bg-zinc-800":""}`}><Pin className={`h-4 w-4 ${filterPinned?"fill-white":""}`}/> Pinned only</Button>
      </div>

      {error && <Alert variant="destructive" className="rounded-xl"><AlertCircle className="h-4 w-4"/><AlertDescription className="ml-2">{error}</AlertDescription></Alert>}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i=> <Skeleton key={i} className="h-[160px] rounded-2xl"/>)}
        </div>
      ) : filtered.length===0 ? (
        <Card className="rounded-2xl border-dashed border-zinc-300 bg-white shadow-sm">
          <CardContent className="py-14 text-center">
            <div className="mx-auto max-w-md space-y-5">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-zinc-900 text-white grid place-items-center"><StickyNote className="h-7 w-7"/></div>
              <div className="space-y-2">
                <h3 className="text-[18px] font-semibold tracking-tight">No notes yet</h3>
                <p className="text-sm text-zinc-500">Create your first note to keep important information in one place.</p>
              </div>
              <Button onClick={openCreate} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 h-10 px-6">Create Note</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(note=>(
            <NoteCard key={note._id} note={note} onEdit={openEdit} onDelete={setDeleteConfirm} onTogglePin={togglePin}/>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={()=>setDialogOpen(false)} className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>{editing?"Edit note":"New note"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Meeting notes" maxLength={200} required className="h-11 rounded-xl"/></div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Write your note..." className="rounded-xl min-h-[140px]" maxLength={10000}/></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>setDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="rounded-xl bg-zinc-900 hover:bg-zinc-800">{saving && <Loader2 className="h-4 w-4 animate-spin"/>}{editing?"Save changes":"Create note"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(o)=>!o&&setDeleteConfirm(null)}>
        <DialogContent onClose={()=>setDeleteConfirm(null)} className="rounded-2xl"><DialogHeader><DialogTitle>Delete this note?</DialogTitle></DialogHeader>
        <p className="text-sm text-zinc-600">This action cannot be undone. Delete “<span className="font-medium text-zinc-900">{deleteConfirm?.title}</span>”?</p>
        <DialogFooter><Button variant="outline" onClick={()=>setDeleteConfirm(null)} className="rounded-xl">Cancel</Button><Button variant="destructive" onClick={handleDelete} className="rounded-xl">Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
