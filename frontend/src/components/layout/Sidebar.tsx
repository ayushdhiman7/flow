import { Link, useLocation } from 'react-router-dom';
import { Button, Avatar } from '../ui';
import { useAuthStore, useUIStore } from '../../store';
import { workspaceApi } from '../../api/endpoints';
import { useEffect, useState } from 'react';
import { classNames } from '../../utils';

export function Sidebar() {
  const { theme, sidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const res = await workspaceApi.list();
        setWorkspaces(res.data.workspaces);
        if (res.data.workspaces.length > 0 && !currentWorkspace) {
          setCurrentWorkspace(res.data.workspaces[0].id);
        }
      } catch (err) {
        console.error('Failed to load workspaces:', err);
      }
    };
    loadWorkspaces();
  }, [currentWorkspace]);

  const handleCreateWorkspace = async () => {
    const name = prompt('Workspace name:');
    if (!name) return;
    try {
      const res = await workspaceApi.create({ name });
      setWorkspaces([...workspaces, res.data.workspace]);
      setCurrentWorkspace(res.data.workspace.id);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  };

  return (
    <aside
      className={classNames(
        'fixed left-0 top-16 bottom-0 z-30 bg-white dark:bg-slate-900 border-r dark:border-slate-700 transition-all duration-200',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <nav className="flex flex-col h-full p-2 space-y-1 overflow-y-auto">
        <Link
          to="/"
          className={classNames(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
            location.pathname === '/' && 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
          )}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
          </svg>
          {sidebarOpen && <span>Home</span>}
        </Link>

        {currentWorkspace && (
          <>
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                Workspace
              </p>
            </div>
            <Link
              to={`/w/${currentWorkspace}`}
              className={classNames(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
                location.pathname.startsWith(`/w/${currentWorkspace}`) && 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
              )}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {sidebarOpen && <span className="truncate">{workspaces.find(w => w.id === currentWorkspace)?.name}</span>}
            </Link>

            <div className="flex items-center gap-2 px-2">
              <Button variant="ghost" size="sm" onClick={handleCreateWorkspace} className="flex-1 justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {sidebarOpen && <span>New Workspace</span>}
              </Button>
            </div>
          </>
        )}
      </nav>

      <div className="p-2 border-t dark:border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar name={user?.name || 'User'} src={user?.avatar} size="sm" status="online" />
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}