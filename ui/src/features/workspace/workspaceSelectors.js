export const selectWorkspaces = (s) => s.workspace.workspaces;
export const selectSelectedWorkspaceId = (s) => s.workspace.selectedId;
export const selectSelectedWorkspace = (s) => s.workspace.workspaces.find(w => w._id === s.workspace.selectedId) || null;
export const selectWorkspaceLoading = (s) => s.workspace.loading;
export const selectWorkspaceError = (s) => s.workspace.error;
export const selectWorkspaceInitialized = (s) => s.workspace.initialized;
