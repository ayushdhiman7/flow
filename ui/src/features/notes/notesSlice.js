import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notesService } from "./notesService";

function getErr(err, fb) { return err?.message || err?.data?.error || fb; }

export const fetchNotes = createAsyncThunk("notes/fetchNotes", async ({ workspaceId, search }, { rejectWithValue }) => {
  try {
    const notes = await notesService.fetchNotes(workspaceId, { search });
    return { notes, workspaceId };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to fetch notes"), status: err.status });
  }
});

export const createNote = createAsyncThunk("notes/createNote", async ({ workspaceId, title, content }, { rejectWithValue }) => {
  try {
    const note = await notesService.createNote(workspaceId, { title, content });
    return { note };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to create note"), status: err.status });
  }
});

export const updateNote = createAsyncThunk("notes/updateNote", async ({ workspaceId, id, patch }, { rejectWithValue }) => {
  try {
    const note = await notesService.updateNote(workspaceId, id, patch);
    return { note };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to update note"), status: err.status });
  }
});

export const deleteNote = createAsyncThunk("notes/deleteNote", async ({ workspaceId, id }, { rejectWithValue }) => {
  try {
    await notesService.deleteNote(workspaceId, id);
    return { id };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to delete note"), status: err.status });
  }
});

const initialState = {
  items: [],
  selectedNote: null,
  loading: false,
  refreshing: false,
  saving: false,
  deleting: false,
  error: null,
  initialized: false,
  workspaceId: null,
  activeRequestId: null,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    selectNote(state, action) { state.selectedNote = action.payload; },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchNotes.pending, (s, a) => {
        s.error = null;
        s.activeRequestId = a.meta.requestId;
        // Skeleton only on first-ever load; refetches keep the list mounted.
        if (!s.initialized) { s.loading = true; s.items = []; }
        else { s.refreshing = true; }
      })
      .addCase(fetchNotes.fulfilled, (s, a) => {
        if (a.meta.requestId !== s.activeRequestId) return; // stale response
        s.loading = false; s.refreshing = false; s.items = a.payload.notes; s.workspaceId = a.payload.workspaceId; s.initialized = true;
      })
      .addCase(fetchNotes.rejected, (s, a) => {
        if (a.meta.requestId !== s.activeRequestId) return; // stale response
        s.loading = false; s.refreshing = false; s.error = a.payload?.message; s.initialized = true;
      })

      .addCase(createNote.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(createNote.fulfilled, (s, a) => { s.saving = false; s.items.unshift(a.payload.note); })
      .addCase(createNote.rejected, (s, a) => { s.saving = false; s.error = a.payload?.message; })

      .addCase(updateNote.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(updateNote.fulfilled, (s, a) => { s.saving = false; const idx = s.items.findIndex(n=>n._id===a.payload.note._id); if(idx!==-1) s.items[idx]=a.payload.note; if(s.selectedNote?._id===a.payload.note._id) s.selectedNote=a.payload.note; })
      .addCase(updateNote.rejected, (s, a) => { s.saving = false; s.error = a.payload?.message; })

      .addCase(deleteNote.pending, (s) => { s.deleting = true; s.error = null; })
      .addCase(deleteNote.fulfilled, (s, a) => { s.deleting = false; s.items = s.items.filter(n=>n._id!==a.payload.id); if(s.selectedNote?._id===a.payload.id) s.selectedNote=null; })
      .addCase(deleteNote.rejected, (s, a) => { s.deleting = false; s.error = a.payload?.message; });
  }
});

export const { clearError, selectNote } = notesSlice.actions;
export default notesSlice.reducer;
