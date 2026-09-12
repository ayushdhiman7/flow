import { Clock, Trash2, Pencil, GripVertical, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function TaskCard({ card, onEdit, onDelete, isOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: card._id, data: { card } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || "transform 220ms cubic-bezier(0.25, 1, 0.5, 1)",
  };

  const initials = (name) => (name?.[0] || "?").toUpperCase();

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/70 h-[96px] flex items-center justify-center"
      >
        <span className="text-xs font-medium text-zinc-400">Drop here</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "z-10" : ""} ${isOverlay ? "rotate-[2.5deg] scale-[1.02]" : ""}`}
    >
      <Card
        className={`rounded-xl border bg-white transition-all duration-200 group select-none
          ${isOverlay
            ? "shadow-2xl border-zinc-900/10 scale-[1.02]"
            : isOver
              ? "shadow-md border-zinc-900/20"
              : "shadow-sm border-zinc-200 hover:shadow-md hover:border-zinc-300 hover:-translate-y-px"
          }`}
      >
        <CardContent className="p-3.5 space-y-3">
          <div className="flex items-start gap-2">
            <button
              className={`mt-0.5 h-6 w-6 rounded-md grid place-items-center shrink-0 transition-colors cursor-grab active:cursor-grabbing
                ${isOverlay ? "bg-zinc-900 text-white" : "hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"}`}
              {...attributes}
              {...listeners}
              aria-label="Drag"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <h4 className="text-[13px] font-semibold leading-snug flex-1 line-clamp-2 text-zinc-900">{card.title}</h4>
          </div>
          {card.description && <p className="text-[12px] leading-relaxed text-zinc-600 line-clamp-2 pl-8">{card.description}</p>}
          {card.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1 pl-8">
              {card.labels.slice(0,3).map((l,i)=> <span key={i} className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded-md bg-zinc-900 text-white">{l}</span>)}
            </div>
          )}
          <div className="flex items-center justify-between pl-8 pt-1">
            <div className="flex items-center gap-2 text-xs">
              {card.dueDate ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"><CalendarDays className="h-3 w-3"/>{new Date(card.dueDate).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-zinc-500"><Clock className="h-3 w-3"/>No due date</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {card.assignees?.length>0 && (
                <div className="flex -space-x-1.5">
                  {card.assignees.slice(0,3).map((a,idx)=>(
                    <span key={idx} className="h-6 w-6 rounded-full bg-zinc-900 text-white grid place-items-center text-[10px] font-medium border-2 border-white shadow-sm">{initials(a.name || a.email || a)}</span>
                  ))}
                </div>
              )}
              <div className={`flex gap-0.5 transition-all duration-200 ml-1 ${isOverlay ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-zinc-100 cursor-pointer" onClick={(e)=>{e.stopPropagation(); onEdit(card)}}><Pencil className="h-3.5 w-3.5"/></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 cursor-pointer" onClick={(e)=>{e.stopPropagation(); onDelete(card)}}><Trash2 className="h-3.5 w-3.5"/></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
