import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { boardService } from "./boardService";

function getErr(err, fb) { return err?.message || err?.data?.error || fb; }

export const fetchBoards = createAsyncThunk("board/fetchBoards", async (workspaceId, { rejectWithValue }) => {
  try {
    const boards = await boardService.getBoards(workspaceId);
    return { boards, workspaceId };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to fetch boards"), status: err.status });
  }
});

export const createBoard = createAsyncThunk("board/createBoard", async ({ workspaceId, name, description }, { rejectWithValue }) => {
  try {
    const board = await boardService.createBoard(workspaceId, { name, description, visibility: "workspace" });
    return { board };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to create board"), status: err.status, data: err.data });
  }
});

export const fetchBoardFull = createAsyncThunk("board/fetchBoardFull", async ({ workspaceId, boardId }, { rejectWithValue }) => {
  try {
    const data = await boardService.getBoardFull(workspaceId, boardId);
    return data; // { board, lists: [{_id,name,cards[]}] }
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to fetch board"), status: err.status });
  }
});

export const createList = createAsyncThunk("board/createList", async ({ boardId, name }, { rejectWithValue }) => {
  try {
    const list = await boardService.createList(boardId, { name });
    return { list };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to create list"), status: err.status });
  }
});

export const createCard = createAsyncThunk("board/createCard", async ({ listId, title, description }, { rejectWithValue }) => {
  try {
    const payload = { title };
    if (description) payload.description = description;
    const card = await boardService.createCard(listId, payload);
    return { card, listId };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to create task"), status: err.status });
  }
});

export const updateCard = createAsyncThunk("board/updateCard", async ({ listId, cardId, patch }, { rejectWithValue }) => {
  try {
    const card = await boardService.updateCard(listId, cardId, patch);
    return { card, listId, cardId };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to update task"), status: err.status });
  }
});

export const deleteCard = createAsyncThunk("board/deleteCard", async ({ listId, cardId }, { rejectWithValue }) => {
  try {
    await boardService.deleteCard(listId, cardId);
    return { cardId, listId };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to delete task"), status: err.status });
  }
});

export const moveCard = createAsyncThunk("board/moveCard", async ({ cardId, fromListId, toListId, position }, { rejectWithValue }) => {
  try {
    await boardService.moveCard({ cardId, fromListId, toListId, position });
    return { cardId, fromListId, toListId, position };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to move task"), status: err.status, cardId, fromListId, toListId });
  }
});

const initialState = {
  boards: [],
  currentBoardId: null,
  currentBoard: null,
  lists: [], // each { _id, name, position, cards: [] }
  loading: false,
  error: null,
  initialized: false,
  // optimistic rollback snapshot
  _snapshot: null,
};

const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    selectBoard(state, action) { state.currentBoardId = action.payload; },
    clearError(state) { state.error = null; },
    optimisticMove(state, action) {
      const { cardId, toListId, position } = action.payload;
      state._snapshot = JSON.parse(JSON.stringify(state.lists));
      let cardToMove = null;
      for (const list of state.lists) {
        const idx = list.cards.findIndex(c => c._id === cardId);
        if (idx !== -1) { cardToMove = list.cards.splice(idx, 1)[0]; break; }
      }
      if (!cardToMove) return;
      cardToMove.list = toListId;
      cardToMove.position = position;
      const target = state.lists.find(l => l._id === toListId);
      if (target) {
        // insert roughly ordered by position
        target.cards.push(cardToMove);
        target.cards.sort((a,b) => a.position - b.position);
      }
    },
    rollbackMove(state) {
      if (state._snapshot) { state.lists = state._snapshot; state._snapshot = null; }
    },
    clearSnapshot(state) { state._snapshot = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (s) => { s.loading = true; s.error = null; s.boards = []; s.currentBoard = null; s.lists = []; s.currentBoardId = null; })
      .addCase(fetchBoards.fulfilled, (s, a) => {
        s.loading = false; s.boards = a.payload.boards; s.initialized = true;
        // reset selection on workspace change or if previous id missing
        if (!a.payload.boards.find(b => b._id === s.currentBoardId)) {
          s.currentBoardId = a.payload.boards[0]?._id || null;
        }
      })
      .addCase(fetchBoards.rejected, (s,a) => { s.loading = false; s.error = a.payload?.message; s.initialized = true; })

      .addCase(createBoard.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(createBoard.fulfilled, (s,a) => { s.loading = false; s.boards.unshift(a.payload.board); s.currentBoardId = a.payload.board._id; })
      .addCase(createBoard.rejected, (s,a) => { s.loading = false; s.error = a.payload?.message; })

      .addCase(fetchBoardFull.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchBoardFull.fulfilled, (s,a) => {
        s.loading = false; s.currentBoard = a.payload.board; s.lists = a.payload.lists || []; s.error = null;
      })
      .addCase(fetchBoardFull.rejected, (s,a) => { s.loading = false; s.error = a.payload?.message; })

      .addCase(createList.fulfilled, (s,a) => { s.lists.push({ ...a.payload.list, cards: [] }); })
      .addCase(createList.rejected, (s,a) => { s.error = a.payload?.message; })

      .addCase(createCard.fulfilled, (s,a) => {
        const list = s.lists.find(l => l._id === a.payload.listId);
        if (list) list.cards.push(a.payload.card);
      })
      .addCase(createCard.rejected, (s,a) => { s.error = a.payload?.message; })

      .addCase(updateCard.fulfilled, (s,a) => {
        for (const list of s.lists) {
          const idx = list.cards.findIndex(c => c._id === a.payload.cardId);
          if (idx !== -1) { list.cards[idx] = { ...list.cards[idx], ...a.payload.card }; break; }
        }
      })
      .addCase(updateCard.rejected, (s,a) => { s.error = a.payload?.message; })

      .addCase(deleteCard.fulfilled, (s,a) => {
        for (const list of s.lists) list.cards = list.cards.filter(c => c._id !== a.payload.cardId);
      })
      .addCase(deleteCard.rejected, (s,a) => { s.error = a.payload?.message; })

      .addCase(moveCard.pending, (s) => { s.error = null; })
      .addCase(moveCard.fulfilled, (s) => { s._snapshot = null; })
      .addCase(moveCard.rejected, (s,a) => { s.error = a.payload?.message; if (s._snapshot) { s.lists = s._snapshot; s._snapshot = null; } });
  },
});

export const { selectBoard, clearError, optimisticMove, rollbackMove, clearSnapshot } = boardSlice.actions;
export default boardSlice.reducer;
