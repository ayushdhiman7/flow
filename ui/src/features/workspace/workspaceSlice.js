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

const initialState = {
  workspaces: [],
  selectedId: localStorage.getItem(STORAGE_KEY) || null,
  loading: false,
  error: null,
  initialized: false,
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
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(createWorkspace.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; });
  },
});

export const { selectWorkspace, clearSelected, clearError } = workspaceSlice.actions;
export default workspaceSlice.reducer;
