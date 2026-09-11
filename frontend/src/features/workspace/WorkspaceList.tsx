import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal, Input, Avatar } from '../../components/ui';
import { workspaceApi } from '../../api/endpoints';
import { useAuthStore } from '../../store';
import { classNames } from '../../utils';

export function WorkspaceList() {
  const { user } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; slug: string; avatar?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState('');

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const res = await workspaceApi.list();
        setWorkspaces(res.data.workspaces);
      } catch (err) {
        console.error('Failed to load workspaces:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadWorkspaces();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      const res = await workspaceApi.create({ name: newWorkspaceName, slug: newWorkspaceSlug || undefined });
      setWorkspaces([...workspaces, res.data.workspace]);
      setShowCreate(false);
      setNewWorkspaceName('');
      setNewWorkspaceSlug('');
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Workspaces</h2>
        <Button onClick={() => setShowCreate(true)}>New Workspace</Button>
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No workspaces yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Create your first workspace to get started</p>
          <Button onClick={() => setShowCreate(true)}>Create Workspace</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              to={`/w/${workspace.id}`}
              className={classNames(
                'card p-4 flex items-center gap-4 transition-all hover:shadow-md',
                'dark:hover:bg-slate-700/50'
              )}
            >
              <div className={classNames('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                'bg-primary-100 dark:bg-primary-900/30'
              )}>
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{workspace.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{workspace.slug}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Workspace">
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <Input
            label="Name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="My Team"
            autoFocus
          />
          <Input
            label="Slug (optional)"
            value={newWorkspaceSlug}
            onChange={(e) => setNewWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="my-team"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}