import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Avatar, Dropdown } from '../../components/ui';
import { workspaceApi } from '../../api/endpoints';
import { useAuthStore } from '../../store';
import { classNames } from '../../utils';

export function WorkspaceSwitcher() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const res = await workspaceApi.list();
        setWorkspaces(res.data.workspaces);
        const pathMatch = location.pathname.match(/\/w\/([^/]+)/);
        const workspaceId = pathMatch?.[1] || res.data.workspaces[0]?.id;
        if (workspaceId) setCurrentWorkspace(workspaceId);
      } catch (err) {
        console.error('Failed to load workspaces:', err);
      }
    };
    loadWorkspaces();
  }, [location.pathname]);

  const currentWs = workspaces.find(w => w.id === currentWorkspace);

  const items = workspaces.map((ws) => ({
    label: ws.name,
    onClick: () => {
      setCurrentWorkspace(ws.id);
      navigate(`/w/${ws.id}`);
    },
    icon: currentWorkspace === ws.id ? (
      <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ) : undefined,
  }));

  if (workspaces.length === 0) return null;

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" className="gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {currentWs && <span className="hidden sm:block truncate max-w-[150px]">{currentWs.name}</span>}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      }
      items={items}
      align="right"
    />
  );
}