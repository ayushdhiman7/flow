import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ClipboardList, Clock3, ListTodo, Plus, ArrowUpRight, Layers, TrendingUp, StickyNote, MessageSquare, Hash, Pin } from "lucide-react";
import { selectSelectedWorkspace, selectSelectedWorkspaceId } from "@/features/workspace/workspaceSelectors";
import { fetchWorkspaces } from "@/features/workspace/workspaceSlice";
import { fetchBoards, fetchBoardFull, createBoard } from "@/features/board/boardSlice";
import { selectBoards, selectTaskStats, selectBoardLoading } from "@/features/board/boardSelectors";
import { fetchNotes } from "@/features/notes/notesSlice";
import { selectNotes } from "@/features/notes/notesSelectors";
import { chatService } from "@/features/chat/chatService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const workspace = useSelector(selectSelectedWorkspace);
  const workspaceId = useSelector(selectSelectedWorkspaceId);
  const boards = useSelector(selectBoards);
  const stats = useSelector(selectTaskStats);
  const loading = useSelector(selectBoardLoading);
  const notes = useSelector(selectNotes);
  const [createOpen, setCreateOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);

  useEffect(() => { dispatch(fetchWorkspaces()); }, [dispatch]);
  useEffect(() => { if (workspaceId) dispatch(fetchBoards(workspaceId)); }, [dispatch, workspaceId]);
  useEffect(() => {
    if (workspaceId && boards.length > 0) {
      const first = boards[0]._id;
      dispatch(fetchBoardFull({ workspaceId, boardId: first }));
    }
  }, [dispatch, workspaceId, boards]);
  useEffect(() => { if (workspaceId) dispatch(fetchNotes({ workspaceId })); }, [dispatch, workspaceId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChannels([]); if (!workspaceId) return;
    let cancelled = false;
    setChannelsLoading(true);
    chatService.getChannels(workspaceId).then(list => { if (!cancelled) setChannels(list); }).catch(()=> !cancelled && setChannels([])).finally(()=> !cancelled && setChannelsLoading(false));
    return () => { cancelled = true; };
  }, [workspaceId]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!boardName.trim() || !workspaceId) return;
    const res = await dispatch(createBoard({ workspaceId, name: boardName.trim() }));
    if (createBoard.fulfilled.match(res)) {
      setBoardName(""); setCreateOpen(false);
      if (workspaceId) dispatch(fetchBoardFull({ workspaceId, boardId: res.payload.board._id }));
    }
  };

  if (!workspaceId) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-6 py-12">
        <Card className="max-w-lg mx-auto text-center rounded-2xl border-zinc-200">
          <CardHeader className="pb-4"><CardTitle>No workspace selected</CardTitle><CardDescription>Create or select a workspace to view dashboard.</CardDescription></CardHeader>
          <CardContent><Button onClick={()=>navigate("/board")} className="rounded-xl bg-zinc-900 hover:bg-zinc-800">Go to Boards</Button></CardContent>
        </Card>
      </div>
    );
  }

  const todo = stats.byList["To Do"] ?? 0;
  const inProgress = stats.byList["In Progress"] ?? 0;
  const done = stats.byList["Done"] ?? 0;
  const pinnedNotes = notes.filter(n=> n.isPinned).length;

  const statCards = [
    { label: "Total Tasks", value: stats.total, icon: ClipboardList, bg: "bg-zinc-900", fg: "text-white", sub: `${boards.length} board${boards.length!==1?"s":""}` },
    { label: "To Do", value: todo, icon: ListTodo, bg: "bg-amber-500", fg: "text-white", sub: "Awaiting start" },
    { label: "In Progress", value: inProgress, icon: Clock3, bg: "bg-blue-600", fg: "text-white", sub: "Active now" },
    { label: "Done", value: done, icon: CheckCircle2, bg: "bg-emerald-600", fg: "text-white", sub: "Completed" },
    { label: "Notes", value: notes.length, icon: StickyNote, bg: "bg-violet-600", fg: "text-white", sub: `${pinnedNotes} pinned` },
    { label: "Channels", value: channels.length, icon: MessageSquare, bg: "bg-teal-600", fg: "text-white", sub: "Chat" },
  ];

  const recentNotes = notes.slice(0,3);
  const recentChannels = channels.slice(0,4);
  const recentBoards = boards.slice(0,3);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-[28px] font-semibold tracking-tight leading-none">Dashboard</h1>
          <p className="text-sm text-zinc-500 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5"><span className="h-5 w-5 rounded-md bg-zinc-900 text-white grid place-items-center text-xs">{(workspace?.name?.[0]||"W").toUpperCase()}</span> {workspace?.name}</span>
            <span className="h-1 w-1 rounded-full bg-zinc-300 hidden sm:block" />
            <span className="hidden sm:inline">{boards.length} boards • {notes.length} notes • {channels.length} channels</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 font-medium"><TrendingUp className="h-3.5 w-3.5"/> Live</span>
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 h-10 px-5 shadow-sm"><Plus className="h-4 w-4"/> New board</Button>
      </div>

      {loading && boards.length===0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {[1,2,3,4,5,6].map(i=> <Skeleton key={i} className="h-[128px] rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {statCards.map(s=>(
            <Card key={s.label} className="rounded-2xl border-zinc-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-xl ${s.bg} ${s.fg} grid place-items-center shadow-sm`}><s.icon className="h-5 w-5"/></div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-600">{s.sub}</span>
                </div>
                <CardDescription className="text-xs font-medium tracking-wide text-zinc-500 mt-3">{s.label.toUpperCase()}</CardDescription>
                <CardTitle className="text-[32px] tracking-tight leading-none">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {stats.total === 0 && notes.length===0 && channels.length===0 && !loading ? (
        <Card className="rounded-2xl border-dashed border-zinc-300 bg-white shadow-sm">
          <CardContent className="py-14 text-center">
            <div className="mx-auto max-w-md space-y-5">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-zinc-900 text-white grid place-items-center shadow-sm"><Layers className="h-7 w-7"/></div>
              <div className="space-y-2">
                <h3 className="text-[18px] font-semibold tracking-tight">Your workspace is ready</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">Create your first task, note, or channel to start organizing your work.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button onClick={() => navigate("/board")} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 h-10 px-6">Create Task</Button>
                <Button variant="outline" onClick={()=> navigate("/notes")} className="rounded-xl h-10">New note</Button>
                <Button variant="outline" onClick={()=> setCreateOpen(true)} className="rounded-xl h-10">New board</Button>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 pt-2">
                <span className="h-px w-8 bg-zinc-200" /> Works with drag and drop <span className="h-px w-8 bg-zinc-200" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="rounded-2xl border-zinc-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-[15px] flex items-center gap-2"><Layers className="h-4 w-4"/> Boards</CardTitle>
                <CardDescription className="text-xs">{boards.length} board{boards.length!==1&&"s"}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl h-8" onClick={()=> navigate("/board")}><Plus className="h-4 w-4"/> New</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentBoards.length? recentBoards.map(b=>(
                <div key={b._id} className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer" onClick={()=>navigate("/board")}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-zinc-900 text-white grid place-items-center text-xs font-medium shrink-0">{b.name[0]?.toUpperCase()}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{b.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{todo+inProgress+done} tasks • {new Date(b.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900"/>
                </div>
              )) : <p className="text-sm text-zinc-500 text-center py-6">No boards yet.</p>}
              <Button variant="ghost" size="sm" className="w-full rounded-xl" onClick={()=> navigate("/board")}>View board <ArrowUpRight className="h-4 w-4"/></Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-[15px] flex items-center gap-2"><StickyNote className="h-4 w-4"/> Notes</CardTitle>
                <CardDescription className="text-xs">{notes.length} note{notes.length!==1&&"s"} • {pinnedNotes} pinned</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl h-8" onClick={()=> navigate("/notes")}><Plus className="h-4 w-4"/> New</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentNotes.length? recentNotes.map(n=>(
                <div key={n._id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer" onClick={()=> navigate("/notes")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold line-clamp-1">{n.title}</div>
                    {n.isPinned && <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0"/>}
                  </div>
                  <div className="text-xs text-zinc-500 line-clamp-2 mt-1">{n.content || "No content"}</div>
                  <div className="text-[11px] text-zinc-400 mt-2">{new Date(n.updatedAt).toLocaleDateString()} • {n.author?.name || "You"}</div>
                </div>
              )) : <p className="text-sm text-zinc-500 text-center py-6">No notes yet.<br/><span className="text-xs">Create your first note</span></p>}
              <Button variant="ghost" size="sm" className="w-full rounded-xl" onClick={()=> navigate("/notes")}>View notes <ArrowUpRight className="h-4 w-4"/></Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-[15px] flex items-center gap-2"><MessageSquare className="h-4 w-4"/> Chat</CardTitle>
                <CardDescription className="text-xs">{channels.length} channel{channels.length!==1&&"s"}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl h-8" disabled><Hash className="h-4 w-4"/> Soon</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {channelsLoading ? <Skeleton className="h-12 rounded-xl"/> : recentChannels.length? recentChannels.map(ch=>(
                <div key={ch._id} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <div className="h-8 w-8 rounded-lg bg-teal-600 text-white grid place-items-center"><Hash className="h-4 w-4"/></div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">#{ch.name || ch._id.slice(-4)}</div>
                    <div className="text-xs text-zinc-500 truncate">{ch.type || "channel"} • {ch.members?.length||0} members</div>
                  </div>
                </div>
              )) : <p className="text-sm text-zinc-500 text-center py-6">No channels yet.<br/><span className="text-xs">Channels will appear here</span></p>}
              <p className="text-[11px] text-zinc-400 text-center px-2">Chat management coming soon — channels are created via API.</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={()=>setCreateOpen(false)} className="rounded-2xl">
          <DialogHeader><DialogTitle>New board</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateBoard} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[13px]">Board name</Label>
              <Input value={boardName} onChange={e=>setBoardName(e.target.value)} placeholder="Product roadmap" maxLength={50} className="h-11 rounded-xl" />
              <p className="text-xs text-zinc-500">Boards start with To Do, In Progress and Done columns.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>setCreateOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-zinc-900 hover:bg-zinc-800">Create board</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
