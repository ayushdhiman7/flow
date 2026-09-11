import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header, Sidebar, RightSidebar } from './components/layout';
import { Login, Register, ProtectedRoute } from './features/auth';
import { WorkspaceList } from './features/workspace';
import { BoardView } from './features/board';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { authApi } from './api/endpoints';

function PublicLayout() {
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-900"><Outlet /></div>;
}

function AppLayout() {
  const { sidebarOpen } = useUIStore();

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
        <div className="flex-1 flex flex-col overflow-hidden"><Outlet /></div>
      </main>
      <RightSidebar />
    </div>
  );
}

function HomePage() {
  const { isLoading } = useAuthStore();

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

        <WorkspaceList />
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
  const { user, setUser, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');

  const handleSave = async () => {
    try {
      const res = await authApi.updateProfile({ name });
      setUser(res.data.user);
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