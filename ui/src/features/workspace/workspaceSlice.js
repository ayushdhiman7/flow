/* eslint-disable no-empty */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { workspaceService } from "./workspaceService";

const STORAGE_KEY = "flow_selected_workspace";

function getErr(err, fallback) {
  return err?.message || err?.data?.error || fallback;
}

export const fetchWorkspaces = createAsyncThunk("workspace/fetchWorkspaces", async (_, { rejectWithValue }) => {
  try {
    const workspaces = await workspaceService.getWorkspaces();
    return { workspaces };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to fetch workspaces"), status: err.status });
  }
});

export const createWorkspace = createAsyncThunk("workspace/createWorkspace", async ({ name }, { rejectWithValue }) => {
  try {
    const workspace = await workspaceService.createWorkspace({ name });
    return { workspace };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to create workspace"), status: err.status, data: err.data });
  }
});

export const joinWorkspace = createAsyncThunk("workspace/joinWorkspace", async ({ code }, { rejectWithValue }) => {
  try {
    const data = await workspaceService.joinByCode(code);
    return { data };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to join workspace"), status: err.status, data: err.data });
  }
});

export const fetchJoinRequests = createAsyncThunk("workspace/fetchJoinRequests", async (workspaceId, { rejectWithValue }) => {
  try {
    const requests = await workspaceService.getJoinRequests(workspaceId);
    return { workspaceId, requests };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to fetch requests"), status: err.status });
  }
});

export const handleJoinRequest = createAsyncThunk("workspace/handleJoinRequest", async ({ workspaceId, requestId, action }, { rejectWithValue }) => {
  try {
    const workspace = await workspaceService.handleJoinRequest(workspaceId, requestId, action);
    return { workspace, workspaceId, requestId, action };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, `Failed to ${action}`), status: err.status });
  }
});

const initialState = {
  workspaces: [],
  selectedId: localStorage.getItem(STORAGE_KEY) || null,
  loading: false,
  error: null,
  initialized: false,
  joinRequests: [],
  joinMessage: null,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    selectWorkspace(state, action) {
      state.selectedId = action.payload;
      try { localStorage.setItem(STORAGE_KEY, action.payload); } catch {}
    },
    clearSelected(state) {
      state.selectedId = null;
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    },
    clearError(state) { state.error = null; },
    clearWorkspaces(state) {
      state.workspaces = [];
      state.selectedId = null;
      state.initialized = false;
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    },
  },
  extraReducers: (builder) => {
    builder
      // clear stale workspaces on logout to prevent cross-user leak via Redux state
      .addCase("auth/logout/fulfilled", (state) => {
        state.workspaces = [];
        state.selectedId = null;
        state.initialized = false;
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
      })
      .addCase("auth/logout/rejected", (state) => {
        state.workspaces = [];
        state.selectedId = null;
        state.initialized = false;
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
      })
      .addCase(fetchWorkspaces.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = action.payload.workspaces;
        state.initialized = true;
        // auto-select if none selected and list non-empty
        if (!state.selectedId && state.workspaces.length > 0) {
          state.selectedId = state.workspaces[0]._id;
          try { localStorage.setItem(STORAGE_KEY, state.selectedId); } catch {}
        }
        // if selected not in list anymore, reset to first
        if (state.selectedId && !state.workspaces.find(w => w._id === state.selectedId)) {
          if (state.workspaces.length > 0) {
            state.selectedId = state.workspaces[0]._id;
            try { localStorage.setItem(STORAGE_KEY, state.selectedId); } catch {}
          } else {
            state.selectedId = null;
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
          }
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; state.initialized = true; })

      .addCase(createWorkspace.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces.unshift(action.payload.workspace);
        state.selectedId = action.payload.workspace._id;
        try { localStorage.setItem(STORAGE_KEY, state.selectedId); } catch {}
      })
      .addCase(createWorkspace.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })

      .addCase(joinWorkspace.pending, (state) => { state.loading = true; state.error = null; state.joinMessage = null; })
      .addCase(joinWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data; // { message, workspace, status }
        state.joinMessage = data?.message || null;
        // Only auto-add if already member or directly joined (legacy). Pending stays out until approved.
        if (data?.workspace && data?.status !== 'pending') {
          const ws = data.workspace;
          const idx = state.workspaces.findIndex(w => w._id === ws._id);
          if (idx >= 0) state.workspaces[idx] = ws;
          else state.workspaces.unshift(ws);
          state.selectedId = ws._id;
          try { localStorage.setItem(STORAGE_KEY, state.selectedId); } catch {}
        }
      })
      .addCase(joinWorkspace.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })

      .addCase(fetchJoinRequests.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchJoinRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.joinRequests = action.payload.requests;
      })
      .addCase(fetchJoinRequests.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })

      .addCase(handleJoinRequest.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(handleJoinRequest.fulfilled, (state, action) => {
        state.loading = false;
        // remove handled request from pending list
        state.joinRequests = state.joinRequests.filter(r => r._id !== action.payload.requestId);
        // if approved, workspace will be refetched via fetchWorkspaces, but also update
        if (action.payload.action === 'approve' && action.payload.workspace) {
          // owner already has workspace, no need
        }
      })
      .addCase(handleJoinRequest.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; });
  },
});

export const { selectWorkspace, clearSelected, clearError, clearWorkspaces } = workspaceSlice.actions;
export default workspaceSlice.reducer;
