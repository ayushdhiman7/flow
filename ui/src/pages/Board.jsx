import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import { selectSelectedWorkspaceId } from "@/features/workspace/workspaceSelectors";
import { fetchWorkspaces } from "@/features/workspace/workspaceSlice";
import { fetchBoards, fetchBoardFull, createBoard, createList, createCard, updateCard, deleteCard, moveCard, optimisticMove, selectBoard } from "@/features/board/boardSlice";
import { selectBoards, selectCurrentBoardId, selectLists, selectBoardLoading, selectBoardError, selectCurrentBoard } from "@/features/board/boardSelectors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertCircle, Loader2, Layers, Kanban } from "lucide-react";
import BoardColumn from "@/features/board/components/BoardColumn";
import TaskCard from "@/features/board/components/TaskCard";
import { isObjectId } from "@/lib/ids";

export default function BoardPage() {
  const dispatch = useDispatch();
  const workspaceId = useSelector(selectSelectedWorkspaceId);
  const boards = useSelector(selectBoards);
  const currentBoardId = useSelector(selectCurrentBoardId);
  const lists = useSelector(selectLists);
  const loading = useSelector(selectBoardLoading);
  const error = useSelector(selectBoardError);
  const currentBoard = useSelector(selectCurrentBoard);

  const [activeCard, setActiveCard] = useState(null);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [addListOpen, setAddListOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [taskDialog, setTaskDialog] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }),
    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
    duration: 220,
  };

  useEffect(()=>{ dispatch(fetchWorkspaces()); },[dispatch]);
  useEffect(()=>{ if(workspaceId) dispatch(fetchBoards(workspaceId)); },[dispatch, workspaceId]);
  useEffect(()=>{ if(workspaceId && currentBoardId) dispatch(fetchBoardFull({ workspaceId, boardId: currentBoardId})); },[dispatch, workspaceId, currentBoardId]);

  const handleCreateBoard = async (e) => {
    e.preventDefault(); if(!boardName.trim() || loading) return;
    const res = await dispatch(createBoard({ workspaceId, name: boardName.trim()}));
    if(createBoard.fulfilled.match(res)){ setBoardName(""); setCreateBoardOpen(false); dispatch(fetchBoardFull({workspaceId, boardId: res.payload.board._id})); }
  };
  const handleCreateList = async (e) => {
    e.preventDefault(); if(!listName.trim()) return;
    await dispatch(createList({ boardId: currentBoardId, name: listName.trim()}));
    setListName(""); setAddListOpen(false);
  };
  const openAddTask = (list) => { setTaskDialog({ list, card:null}); setTaskTitle(""); setTaskDesc(""); };
  const openEditTask = (card) => {
    const list = lists.find(l=> (l.cards||[]).some(c=>String(c._id)===String(card._id)));
    if(!list) return;
    setTaskDialog({ list, card}); setTaskTitle(card.title); setTaskDesc(card.description||"");
  };
  const handleSaveTask = async (e)=>{
    e.preventDefault(); if(!taskTitle.trim()) return;
    if(taskDialog.card){
      await dispatch(updateCard({ listId: taskDialog.list._id, cardId: taskDialog.card._id, patch: { title: taskTitle.trim(), description: taskDesc.trim() }}));
    } else {
      await dispatch(createCard({ listId: taskDialog.list._id, title: taskTitle.trim(), description: taskDesc.trim()}));
    }
    setTaskDialog(null);
  };
  const handleDeleteAsk = (card)=> setDeleteConfirm(card);
  const handleDeleteConfirm = async ()=>{
    const card = deleteConfirm;
    const list = lists.find(l=> (l.cards||[]).some(c=>String(c._id)===String(card._id)));
    if(!list) { setDeleteConfirm(null); return; }
    await dispatch(deleteCard({ listId: list._id, cardId: card._id}));
    setDeleteConfirm(null);
  };

  const handleDragStart = (e)=> {
    const fromData = e.active?.data?.current?.card;
    if (fromData) { setActiveCard(fromData); return; }
    const cardId = String(e.active.id);
    for(const l of lists){ const c = (l.cards||[]).find(x=> String(x._id)===cardId); if(c) { setActiveCard(c); break; } }
  };
  const handleDragEnd = async (e)=>{
    const { active, over } = e;
    setActiveCard(null);
    if(!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if(activeId===overId) return;

    // Index-based resolution: over is either a column (list id) or a card.
    const cardToList = new Map();
    const listIds = new Set();
    const listById = new Map();
    for(const l of lists){
      const lid = String(l._id);
      if(!isObjectId(lid)) continue;
      listIds.add(lid);
      listById.set(lid, l);
      for(const c of (l.cards||[])) cardToList.set(String(c._id), lid);
    }
    const fromListId = cardToList.get(activeId);
    if(!fromListId) return;
    let toListId;
    let overCard = null;
    if(listIds.has(overId)) {
      toListId = overId;
    } else if(cardToList.has(overId)) {
      toListId = cardToList.get(overId);
      overCard = (listById.get(toListId).cards||[]).find(c=>String(c._id)===overId) || null;
    } else {
      return;
    }
    const targetList = listById.get(toListId);
    if(!targetList) return;
    const sorted = [...(targetList.cards||[])].sort((a,b)=> (Number(a.position)||0)-(Number(b.position)||0));
    let position;
    if(sorted.length===0) {
      position = 1000;
    } else if(fromListId!==toListId) {
      // Cross-list: land on the hovered card's slot (server shifts room),
      // else append at the end.
      if(overCard) position = Number(overCard.position) || 1000;
      else { const last = sorted[sorted.length-1]; position = (Number(last?.position)||0)+1000; }
    } else {
      // Same-list reorder: midpoint between neighbours for a stable order.
      const overIdx = sorted.findIndex(c=>String(c._id)===(overCard ? String(overCard._id) : overId));
      const activeIdx = sorted.findIndex(c=>String(c._id)===activeId);
      if(overIdx===-1 || activeIdx===-1 || overIdx===activeIdx) return;
      if(activeIdx < overIdx) {
        const cur = Number(sorted[overIdx].position)||0;
        const nxt = sorted[overIdx+1] ? Number(sorted[overIdx+1].position) : null;
        position = nxt==null ? cur+500 : cur+(nxt-cur)/2;
      } else {
        const cur = Number(sorted[overIdx].position)||0;
        const prv = sorted[overIdx-1] ? Number(sorted[overIdx-1].position) : null;
        position = prv==null ? cur-500 : prv+(cur-prv)/2;
      }
      if(!Number.isFinite(position)) position = Number(sorted[overIdx].position)||1000;
    }
    if(!isObjectId(fromListId) || !isObjectId(toListId)) return;
    dispatch(optimisticMove({ cardId: activeId, fromListId, toListId, position }));
    const res = await dispatch(moveCard({ cardId: activeId, fromListId, toListId, position }));
    if (moveCard.rejected.match(res)) return;
    // Reconcile with server truth (positions of shifted siblings).
    if(workspaceId && currentBoardId) dispatch(fetchBoardFull({workspaceId, boardId: currentBoardId}));
  };

  if(!workspaceId){
    return <div className="max-w-5xl mx-auto p-8"><Card className="rounded-2xl border-zinc-200"><CardContent className="py-10 text-center text-sm text-zinc-500">Select a workspace to view boards.</CardContent></Card></div>
  }

  if(loading && boards.length===0){
    return <div className="p-6 flex gap-5 overflow-auto"><Skeleton className="w-[320px] h-[420px] rounded-2xl"/><Skeleton className="w-[320px] h-[420px] rounded-2xl"/><Skeleton className="w-[320px] h-[420px] rounded-2xl"/></div>
  }

  if(boards.length===0){
    return (
      <div className="max-w-2xl mx-auto px-4 py-14">
        <Card className="text-center rounded-2xl border-zinc-200 shadow-sm"><CardContent className="py-14 space-y-5">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-zinc-900 text-white grid place-items-center"><Layers className="h-7 w-7"/></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold tracking-tight">No boards yet</h3>
            <p className="text-sm text-zinc-500">Create your first board. It will start with To Do, In Progress and Done columns.</p>
          </div>
          <Button onClick={()=>setCreateBoardOpen(true)} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 h-10 px-6">Create board</Button>
        </CardContent></Card>
        <Dialog open={createBoardOpen} onOpenChange={setCreateBoardOpen}>
          <DialogContent onClose={()=>setCreateBoardOpen(false)} className="rounded-2xl"><DialogHeader><DialogTitle>New board</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateBoard} className="space-y-5"><div className="space-y-2"><Label>Board name</Label><Input value={boardName} onChange={e=>setBoardName(e.target.value)} placeholder="Product roadmap" maxLength={50} className="h-11 rounded-xl" disabled={loading} /></div><DialogFooter><Button type="button" variant="outline" onClick={()=>setCreateBoardOpen(false)} className="rounded-xl" disabled={loading}>Cancel</Button><Button type="submit" className="rounded-xl bg-zinc-900 hover:bg-zinc-800" disabled={loading || !boardName.trim()}>{loading && <Loader2 className="h-4 w-4 animate-spin"/>} Create</Button></DialogFooter></form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#fbfcfe]">
      <div className="px-4 lg:px-8 py-4 border-b border-zinc-200/60 bg-white flex flex-wrap items-center gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-zinc-900 text-white grid place-items-center"><Kanban className="h-4 w-4"/></div>
          <div>
            <h1 className="text-[16px] font-semibold leading-none flex items-center gap-2">{currentBoard?.name || boards.find(b=>b._id===currentBoardId)?.name || "Board"}
              <span className="hidden sm:inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600">{lists.length} columns • {lists.reduce((a,l)=>a+(l.cards?.length||0),0)} tasks</span>
            </h1>
            <p className="text-xs text-zinc-500 hidden sm:block">Drag tasks between columns • Changes save instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {boards.length > 1 && (
            <select value={currentBoardId || ""} onChange={e=> dispatch(selectBoard(e.target.value))} className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium min-w-[140px]">
              {boards.map(b=> <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={()=>setAddListOpen(true)} className="rounded-xl h-9"><Plus className="h-4 w-4"/> Add column</Button>
          <Button size="sm" onClick={()=>setCreateBoardOpen(true)} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 h-9"><Plus className="h-4 w-4"/> New board</Button>
        </div>
      </div>

      {error && <div className="px-4 lg:px-8 pt-4"><Alert variant="destructive" className="rounded-xl"><AlertCircle className="h-4 w-4"/><AlertDescription className="ml-2">{error}</AlertDescription></Alert></div>}
      {loading && <div className="px-4 lg:px-8 py-2 flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin"/> Loading board…</div>}

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 flex gap-5 min-w-max">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {lists.map(list=> (
              <BoardColumn key={list._id} list={list} onAddTask={openAddTask} onEditCard={openEditTask} onDeleteCard={handleDeleteAsk} />
            ))}
            <DragOverlay dropAnimation={dropAnimation}>{activeCard ? <div className="w-[320px]"><TaskCard card={activeCard} onEdit={()=>{}} onDelete={()=>{}} isOverlay /></div> : null}</DragOverlay>
          </DndContext>
          <button onClick={()=>setAddListOpen(true)} className="w-[200px] shrink-0 h-fit rounded-2xl border-2 border-dashed border-zinc-200 bg-white/50 hover:bg-white hover:border-zinc-300 py-8 grid place-items-center gap-2 text-sm font-medium text-zinc-600 transition-colors">
            <Plus className="h-5 w-5"/> Add another column
          </button>
        </div>
      </div>

      <Dialog open={createBoardOpen} onOpenChange={setCreateBoardOpen}>
        <DialogContent onClose={()=>setCreateBoardOpen(false)} className="rounded-2xl"><DialogHeader><DialogTitle>New board</DialogTitle></DialogHeader>
        <form onSubmit={handleCreateBoard} className="space-y-5"><div className="space-y-2"><Label>Board name</Label><Input value={boardName} onChange={e=>setBoardName(e.target.value)} placeholder="Product roadmap" maxLength={50} className="h-11 rounded-xl" disabled={loading} /></div><DialogFooter><Button type="button" variant="outline" onClick={()=>setCreateBoardOpen(false)} className="rounded-xl" disabled={loading}>Cancel</Button><Button type="submit" className="rounded-xl bg-zinc-900 hover:bg-zinc-800" disabled={loading || !boardName.trim()}>{loading && <Loader2 className="h-4 w-4 animate-spin"/>} Create</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>

      <Dialog open={addListOpen} onOpenChange={setAddListOpen}>
        <DialogContent onClose={()=>setAddListOpen(false)} className="rounded-2xl"><DialogHeader><DialogTitle>New column</DialogTitle></DialogHeader>
        <form onSubmit={handleCreateList} className="space-y-5"><div className="space-y-2"><Label>Column name</Label><Input value={listName} onChange={e=>setListName(e.target.value)} placeholder="Review" maxLength={50} className="h-11 rounded-xl"/></div><DialogFooter><Button type="button" variant="outline" onClick={()=>setAddListOpen(false)} className="rounded-xl">Cancel</Button><Button type="submit" className="rounded-xl bg-zinc-900 hover:bg-zinc-800">Create</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!taskDialog} onOpenChange={(o)=> !o && setTaskDialog(null)}>
        <DialogContent onClose={()=>setTaskDialog(null)} className="rounded-2xl"><DialogHeader><DialogTitle>{taskDialog?.card ? "Edit task" : "Create task"} {taskDialog?.list ? `• ${taskDialog.list.name}` : ""}</DialogTitle></DialogHeader>
        <form onSubmit={handleSaveTask} className="space-y-5">
          <div className="space-y-2"><Label>Title</Label><Input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Design new landing page" maxLength={200} required className="h-11 rounded-xl"/></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={taskDesc} onChange={e=>setTaskDesc(e.target.value)} placeholder="Add details…" className="rounded-xl min-h-[90px]" /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={()=>setTaskDialog(null)} className="rounded-xl">Cancel</Button><Button type="submit" className="rounded-xl bg-zinc-900 hover:bg-zinc-800">{taskDialog?.card ? "Save changes" : "Create task"}</Button></DialogFooter>
        </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(o)=> !o && setDeleteConfirm(null)}>
        <DialogContent onClose={()=>setDeleteConfirm(null)} className="rounded-2xl"><DialogHeader><DialogTitle>Delete task?</DialogTitle></DialogHeader>
        <p className="text-sm text-zinc-600">This will permanently delete “<span className="font-medium text-zinc-900">{deleteConfirm?.title}</span>”. You can’t undo this.</p>
        <DialogFooter><Button variant="outline" onClick={()=>setDeleteConfirm(null)} className="rounded-xl">Cancel</Button><Button variant="destructive" onClick={handleDeleteConfirm} className="rounded-xl">Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
