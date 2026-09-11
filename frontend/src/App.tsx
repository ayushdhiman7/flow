import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header, Sidebar, RightSidebar } from './components/layout';
import { Login, Register, ProtectedRoute } from './features/auth';
import { WorkspaceList } from './features/workspace';
import { BoardView } from './features/board';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { useEffect } from 'react';
import { authApi } from './api/endpoints';

function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-900">{children}</div>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, rightSidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <Header />
      <Sidebar />
      <main className={`
        flex-1 flex flex-col
        ml-64 lg:ml-64
        transition-all duration-200
        ${sidebarOpen ? 'ml-64' : 'ml-16'}
      `}>
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      </main>
      <RightSidebar />
    </div>
  );
}

function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const loadWorkspaces = async () => {
        try {
          const res = await import('./api/endpoints').then(m => m.workspaceApi.list());
          setWorkspaces(res.data.workspaces);
        } catch (err) {
          console.error('Failed to load workspaces:', err);
        }
      };
      loadWorkspaces();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Welcome to Flow</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">Your workspace for boards, tasks, and team chat</p>
        </div>

        <WorkspaceList workspaces={workspaces} />
      </div>
    </div>
  );
}

function WorkspacePage() {
  return (
    <div className="flex-1 flex flex-col">
      <BoardView />
    </div>
  );
}

function SettingsPage() {
  const { user, updateProfile, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = async () => {
    try {
      await updateProfile({ name, avatar: user?.avatar });
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Settings</h1>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="input bg-slate-100 dark:bg-slate-800"
            />
          </div>
          <button onClick={handleSave} className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Account</h2>
        <button onClick={logout} className="btn-danger">Logout</button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { workspaceApi } from './api/endpoints';

function WorkspaceList({ workspaces }: { workspaces: Array<{ id: string; name: string; slug: string }> }) {
  const navigate = useNavigate();

  const handleCreateWorkspace = async () => {
    const name = prompt('Workspace name:');
    if (!name) return;
    try {
      const res = await workspaceApi.create({ name });
      setWorkspaces([...workspaces, res.data.workspace]);
      navigate(`/w/${res.data.workspace.id}`);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          onClick={() => navigate(`/w/${workspace.id}`)}
          className="card p-6 text-left hover:shadow-md transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{workspace.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{workspace.slug}</p>
        </button>
      ))}
      <button onClick={handleCreateWorkspace} className="card p-6 text-left border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">New Workspace</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Create a new workspace</p>
      </button>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';

export function App() {
  const { isLoading, setLoading } = useAuthStore();
  const { theme } = useUIStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authApi.me();
        useAuthStore.getState().setAuth(res.data.user, '');
      } catch {
        useAuthStore.getState().logout();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [setLoading]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/w/:workspaceId/*" element={<WorkspacePage />} />
            <Route path="/settings/*" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}