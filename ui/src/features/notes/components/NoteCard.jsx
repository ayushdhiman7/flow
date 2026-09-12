import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Pin } from "lucide-react";

export default function NoteCard({ note, onEdit, onDelete, onTogglePin }) {
  return (
    <Card className="rounded-2xl border-zinc-200 bg-white shadow-sm hover:shadow-md hover:border-zinc-300 transition-all group flex flex-col">
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-semibold leading-snug line-clamp-2 text-zinc-900 flex-1">{note.title}</h3>
          {note.isPinned && <span className="h-6 w-6 rounded-full bg-amber-100 text-amber-600 grid place-items-center shrink-0"><Pin className="h-3.5 w-3.5 fill-amber-600"/></span>}
        </div>
        {note.content && <p className="text-[13px] leading-relaxed text-zinc-600 line-clamp-3 whitespace-pre-wrap">{note.content}</p>}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-100">
          <span className="text-[11px] text-zinc-500">{new Date(note.updatedAt).toLocaleDateString(undefined,{month:"short",day:"numeric"})} • {note.author?.name || "You"}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-zinc-100 cursor-pointer" onClick={()=>onTogglePin(note)} title="Pin"><Pin className={`h-3.5 w-3.5 ${note.isPinned?"fill-zinc-900 text-zinc-900":""}`}/></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-zinc-100 cursor-pointer" onClick={()=>onEdit(note)}><Pencil className="h-3.5 w-3.5"/></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 cursor-pointer" onClick={()=>onDelete(note)}><Trash2 className="h-3.5 w-3.5"/></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
