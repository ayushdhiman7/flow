import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskCard from "./TaskCard";

const accent = {
  "To Do": "from-zinc-900 to-zinc-700",
  "In Progress": "from-blue-600 to-indigo-600",
  "Done": "from-emerald-600 to-teal-600",
};

export default function BoardColumn({ list, onAddTask, onEditCard, onDeleteCard }) {
  const { setNodeRef, isOver } = useDroppable({ id: list._id });
  const bar = accent[list.name] || "from-zinc-700 to-zinc-600";
  const count = list.cards?.length || 0;

  return (
    <div
      className={`w-[320px] shrink-0 rounded-2xl border flex flex-col max-h-[calc(100vh-190px)] transition-all duration-200
        ${isOver ? "border-zinc-900 bg-white shadow-xl scale-[1.01] ring-1 ring-zinc-900/10" : "border-zinc-200 bg-[#fcfcfd] shadow-sm hover:shadow-md"}`}
    >
      <div className={`h-1.5 rounded-t-2xl bg-gradient-to-r ${bar} ${isOver ? "opacity-100" : "opacity-90"}`} />
      <div className="px-3.5 py-3 flex items-center justify-between sticky top-0 bg-[#fcfcfd] rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[13px] font-semibold tracking-tight text-zinc-900">{list.name}</h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shadow-sm transition-colors ${isOver ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 text-zinc-600"}`}>{count}</span>
        </div>
        <button className="h-7 w-7 rounded-lg hover:bg-white border border-transparent hover:border-zinc-200 grid place-items-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"><MoreHorizontal className="h-4 w-4"/></button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-auto px-2.5 pb-2 space-y-2.5 min-h-[160px] custom-scrollbar transition-colors duration-200 rounded-b-xl
          ${isOver ? "bg-zinc-50/80" : ""}`}
      >
        {count === 0 ? (
          <div className={`rounded-xl border-2 border-dashed py-10 text-center transition-all duration-200 ${isOver ? "border-zinc-900 bg-blue-50/50 scale-[1.01]" : "border-zinc-200 bg-white/60 hover:bg-white hover:border-zinc-300"}`}>
            <div className={`mx-auto h-8 w-8 rounded-xl grid place-items-center mb-2 transition-colors ${isOver ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}>
              <Plus className="h-4 w-4" />
            </div>
            <p className={`text-xs font-semibold ${isOver ? "text-zinc-900" : "text-zinc-600"}`}>{isOver ? "Drop here" : "No tasks"}</p>
            <p className="text-[11px] text-zinc-400 mt-1">{isOver ? "Release to add" : "Drag here or create one"}</p>
          </div>
        ) : (
          <SortableContext id={list._id} items={(list.cards||[]).map(c=>c._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5 py-1">
              {list.cards.map(card => (
                <TaskCard key={card._id} card={card} onEdit={onEditCard} onDelete={onDeleteCard} />
              ))}
            </div>
          </SortableContext>
        )}

        {isOver && count > 0 && (
          <div className="h-2 rounded-full bg-zinc-900/10 animate-pulse mt-1" />
        )}
      </div>

      <div className="p-2.5 border-t border-zinc-100 bg-white/70 backdrop-blur rounded-b-2xl">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-xl text-zinc-600 hover:bg-zinc-900 hover:text-white h-9 transition-colors cursor-pointer" onClick={()=>onAddTask(list)}><Plus className="h-4 w-4"/> Add task</Button>
      </div>
    </div>
  );
}
