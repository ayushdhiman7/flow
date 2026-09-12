import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LayoutDashboard, Kanban, StickyNote, Settings, Calendar, Menu, X, LogOut, Plus, ChevronsUpDown, Building2, Search, Bell, MessageSquare, Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/ThemeContext.jsx";
import { selectUser } from "@/features/auth/authSelectors";
import { logout } from "@/features/auth/authSlice";
import { selectWorkspaces, selectSelectedWorkspace, selectSelectedWorkspaceId } from "@/features/workspace/workspaceSelectors";
import { fetchWorkspaces, selectWorkspace, createWorkspace } from "@/features/workspace/workspaceSlice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", enabled: true },
  { to: "/board", icon: Kanban, label: "Board", enabled: true },
  { to: "/notes", icon: StickyNote, label: "Notes", enabled: true },
  { to: "/chat", icon: MessageSquare, label: "Chat", enabled: true },
  { to: "/calendar", icon: Calendar, label: "Calendar", enabled: false },
  { to: "/settings", icon: Settings, label: "Settings", enabled: false },
];

export default function AppLayout() {
  const user = useSelector(selectUser);
  const workspaces = useSelector(selectWorkspaces);
  const selected = useSelector(selectSelectedWorkspace);
  const selectedId = useSelector(selectSelectedWorkspaceId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => { dispatch(fetchWorkspaces()); }, [dispatch]);
  const handleLogout = async () => { await dispatch(logout()); navigate("/signin", { replace: true }); };
  const switchWs = (id) => { dispatch(selectWorkspace(id)); setWsOpen(false); setMobileOpen(false); };
  const handleCreateWs = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const res = await dispatch(createWorkspace({ name: newWsName.trim() }));
    if (createWorkspace.fulfilled.match(res)) { setNewWsName(""); setCreateOpen(false); }
  };

  return (
    <div className="min-h-screen bg-[#fbfcfe] dark:bg-zinc-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[280px] border-r border-zinc-200/70 bg-white flex-col shrink-0">
        <div className="h-[64px] px-5 flex items-center gap-3 border-b border-zinc-100">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 text-white grid place-items-center shadow-sm">
            <span className="text-[13px] font-semibold tracking-tight">◈</span>
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Flow</span>
          <span className="ml-auto text-[11px] font-medium px-1.5 py-0.5 rounded bg-zinc-900 text-white tracking-widest">BETA</span>
        </div>

        <div className="p-4 space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-widest text-zinc-400 px-2">WORKSPACE</p>
            <div className="relative">
              <button onClick={() => setWsOpen(v=>!v)} className="w-full flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors shadow-sm">
                <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white grid place-items-center text-xs font-medium shrink-0">{(selected?.name?.[0] || "W").toUpperCase()}</div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[13px] font-medium leading-none truncate">{selected?.name || "Select workspace"}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{workspaces.length} workspace{workspaces.length!==1&&"s"}</div>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-zinc-400" />
              </button>
              {wsOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-zinc-200 bg-white shadow-xl p-1.5 max-h-64 overflow-auto">
                  {workspaces.map(ws => (
                    <button key={ws._id} onClick={()=>switchWs(ws._id)} className={cn("w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-3 hover:bg-zinc-50 transition-colors", selectedId===ws._id && "bg-zinc-900 text-white hover:bg-zinc-900")}>
                      <span className={cn("h-7 w-7 rounded-md grid place-items-center text-xs font-medium shrink-0", selectedId===ws._id ? "bg-white text-zinc-900" : "bg-zinc-100 text-zinc-700")}>{ws.name[0]?.toUpperCase()}</span>
                      <span className="truncate flex-1 font-medium text-[13px]">{ws.name}</span>
                      {selectedId===ws._id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </button>
                  ))}
                  <div className="h-px bg-zinc-100 my-1.5" />
                  <button onClick={()=>{setWsOpen(false); setCreateOpen(true);}} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-50 text-zinc-600"><Plus className="h-4 w-4"/> New workspace</button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-widest text-zinc-400 px-2">MENU</p>
            <nav className="space-y-1">
              {navItems.map(item => (
                item.enabled ? (
                  <NavLink key={item.to} to={item.to} className={({isActive})=> cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors", isActive ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900")}>
                    <item.icon className="h-[18px] w-[18px]" /> {item.label}
                  </NavLink>
                ) : (
                  <div key={item.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-400 cursor-not-allowed">
                    <item.icon className="h-[18px] w-[18px]" /> {item.label} <span className="ml-auto text-[10px] font-semibold tracking-widest bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">SOON</span>
                  </div>
                )
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3 rounded-xl bg-white border border-zinc-200 px-3 py-3 shadow-sm">
            <div className="h-9 w-9 rounded-full bg-zinc-900 text-white grid place-items-center text-sm font-medium shrink-0">{user?.name?.[0]?.toUpperCase() || "U"}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold leading-none truncate">{user?.name}</div>
              <div className="text-[11px] text-zinc-500 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="h-8 w-8 rounded-lg hover:bg-zinc-100 grid place-items-center text-zinc-500 hover:text-zinc-900 transition-colors"><LogOut className="h-4 w-4"/></button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-sm lg:hidden" onClick={()=>setMobileOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-[300px] bg-white border-r border-zinc-200 flex flex-col lg:hidden transition-transform duration-300", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="h-[64px] px-5 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-3 font-semibold"><div className="h-9 w-9 rounded-xl bg-zinc-900 text-white grid place-items-center">◈</div> Flow</div>
          <button onClick={()=>setMobileOpen(false)} className="h-8 w-8 rounded-lg hover:bg-zinc-100 grid place-items-center"><X className="h-5 w-5"/></button>
        </div>
        <div className="p-4 space-y-5 flex-1 overflow-auto">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-widest text-zinc-400">WORKSPACE</p>
            <div className="grid gap-2">
              {workspaces.map(ws=>(
                <button key={ws._id} onClick={()=>switchWs(ws._id)} className={cn("w-full text-left px-3 py-2.5 rounded-xl text-sm border flex items-center gap-3", selectedId===ws._id ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200")}>
                  <span className={cn("h-7 w-7 rounded-md grid place-items-center text-xs font-medium", selectedId===ws._id ? "bg-white text-zinc-900" : "bg-zinc-100")}>{ws.name[0].toUpperCase()}</span>{ws.name}
                </button>
              ))}
              <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={()=>setCreateOpen(true)}><Plus className="h-4 w-4"/> New workspace</Button>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map(item=> item.enabled ? (
              <NavLink key={item.to} to={item.to} onClick={()=>setMobileOpen(false)} className={({isActive})=> cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", isActive?"bg-zinc-900 text-white":"hover:bg-zinc-50")}>
                <item.icon className="h-[18px] w-[18px]"/>{item.label}
              </NavLink>
            ) : (
              <div key={item.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400"><item.icon className="h-[18px] w-[18px]"/>{item.label} <span className="ml-auto text-[10px]">SOON</span></div>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-zinc-100">
          <div className="text-sm font-semibold truncate">{user?.name}</div>
          <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2 mt-3"><LogOut className="h-4 w-4"/> Logout</Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[64px] border-b border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60 flex items-center gap-4 px-4 lg:px-8 shrink-0 sticky top-0 z-20">
          <button className="lg:hidden h-9 w-9 rounded-xl border border-zinc-200 grid place-items-center" onClick={()=>setMobileOpen(true)}><Menu className="h-5 w-5"/></button>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline-flex items-center gap-2 text-zinc-500"><Building2 className="h-4 w-4"/> Workspace</span>
            <span className="hidden sm:inline text-zinc-300">/</span>
            <span className="inline-flex items-center gap-2 font-medium">
              <span className="h-6 w-6 rounded-md bg-zinc-900 text-white grid place-items-center text-xs">{(selected?.name?.[0]||"W").toUpperCase()}</span>
              <span className="truncate">{selected?.name || "—"}</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-6 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"/>
              <input placeholder="Search tasks, boards…" className="w-full h-9 rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-300" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} aria-label="Toggle theme" className="h-9 w-9 rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-700 grid place-items-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              {isDark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
            </button>
            <button className="h-9 w-9 rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-700 grid place-items-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50"><Bell className="h-4 w-4"/></button>
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-zinc-200">
              <div className="text-right hidden lg:block">
                <div className="text-sm font-medium leading-none">{user?.name}</div>
                <div className="text-xs text-zinc-500">{user?.email}</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-zinc-900 text-white grid place-items-center text-sm font-medium">{user?.name?.[0]?.toUpperCase()}</div>
            </div>
          </div>
        </header>
        <main className="flex-1 bg-[#fbfcfe] overflow-auto">
          <Outlet />
        </main>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={()=>setCreateOpen(false)} className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-[16px]">New workspace</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateWs} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[13px]">Workspace name</Label>
              <Input value={newWsName} onChange={e=>setNewWsName(e.target.value)} placeholder="Acme Inc." maxLength={50} autoFocus className="h-11 rounded-xl" />
              <p className="text-xs text-zinc-500">Use your company or team name. You can invite members later.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>setCreateOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-zinc-900 hover:bg-zinc-800">Create workspace</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
