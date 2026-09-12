import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { chatService } from "./chatService";

function getErr(err, fb) { return err?.message || err?.data?.error || fb; }

export const fetchChannels = createAsyncThunk("chat/fetchChannels", async (workspaceId, { rejectWithValue }) => {
  try {
    const channels = await chatService.getChannels(workspaceId);
    return { channels, workspaceId };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to fetch channels"), status: err.status });
  }
});

export const fetchGlobalDMs = createAsyncThunk("chat/fetchGlobalDMs", async (workspaces, { rejectWithValue }) => {
  try {
    const dms = await chatService.getAllDMs(workspaces);
    return { dms };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to fetch DMs"), status: err.status });
  }
});

export const createChannel = createAsyncThunk("chat/createChannel", async ({ workspaceId, name, memberIds }, { rejectWithValue }) => {
  try {
    const channel = await chatService.createChannel(workspaceId, { name, type: "channel", memberIds });
    return { channel };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to create channel"), status: err.status });
  }
});

export const createDM = createAsyncThunk("chat/createDM", async ({ workspaceId, userId }, { rejectWithValue }) => {
  try {
    const channel = await chatService.createDM(workspaceId, userId);
    return { channel };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to create DM"), status: err.status });
  }
});

export const createDMByCode = createAsyncThunk("chat/createDMByCode", async ({ workspaceId, chatCode }, { rejectWithValue }) => {
  try {
    const channel = await chatService.createDMByCode(workspaceId, chatCode);
    return { channel };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to create DM by code"), status: err.status });
  }
});

export const fetchMessages = createAsyncThunk("chat/fetchMessages", async ({ workspaceId, channelId, cursor, limit = 50 }, { rejectWithValue }) => {
  try {
    const data = await chatService.getMessages(workspaceId, channelId, { cursor, limit });
    return { channelId, ...data };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to fetch messages"), status: err.status, channelId });
  }
});

export const sendMessage = createAsyncThunk("chat/sendMessage", async ({ workspaceId, channelId, content, replyTo }, { rejectWithValue }) => {
  try {
    const payload = { content };
    if (replyTo) payload.replyTo = replyTo;
    const message = await chatService.sendMessage(workspaceId, channelId, payload);
    return { channelId, message };
  } catch (err) {
    return rejectWithValue({ message: getErr(err, "Failed to send message"), status: err.status });
  }
});

const initialState = {
  channels: [],
  dms: [],
  currentChannelId: null,
  messagesByChannel: {}, // [id]: {items, hasMore, nextCursor, loading}
  loading: false,
  sending: false,
  error: null,
  initialized: false,
  workspaceId: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    selectChannel(state, action) { state.currentChannelId = action.payload; },
    clearError(state) { state.error = null; },
    appendMessage(state, action) {
      const { channelId, message } = action.payload;
      if (!state.messagesByChannel[channelId]) state.messagesByChannel[channelId] = { items: [], hasMore: false, nextCursor: null, loading: false };
      const exists = state.messagesByChannel[channelId].items.some(m => m._id === message._id);
      if (!exists) state.messagesByChannel[channelId].items.push(message);
    },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchChannels.pending, (s) => { s.loading = true; s.error = null; s.channels = []; /* keep dms global */ })
      .addCase(fetchChannels.fulfilled, (s, a) => {
        s.loading = false; 
        // keep channels workspace-specific (exclude DMs, DMs are global)
        s.channels = a.payload.channels.filter(c=>c.type !== 'dm');
        s.workspaceId = a.payload.workspaceId; s.initialized = true;
        const allVisible = [...s.channels, ...s.dms];
        if (!s.currentChannelId && allVisible.length) s.currentChannelId = allVisible[0]._id;
        if (s.currentChannelId && !allVisible.find(c=>c._id===s.currentChannelId)) s.currentChannelId = allVisible[0]?._id || null;
      })
      .addCase(fetchChannels.rejected, (s,a)=>{ s.loading=false; s.error=a.payload?.message; s.initialized=true; })

      .addCase(fetchGlobalDMs.fulfilled,(s,a)=>{
        s.dms = a.payload.dms;
        // if current is DM and was cleared, try restore
        if (!s.currentChannelId && s.dms.length) {
          // don't auto-select DM if no current, keep as is
        }
      })

      .addCase(createChannel.pending,(s)=>{ s.loading=true; s.error=null; })
      .addCase(createChannel.fulfilled,(s,a)=>{ s.loading=false; s.channels.unshift(a.payload.channel); s.currentChannelId=a.payload.channel._id; })
      .addCase(createChannel.rejected,(s,a)=>{ s.loading=false; s.error=a.payload?.message; })

      .addCase(createDM.fulfilled,(s,a)=>{
        const exists = s.dms.find(c=>c._id===a.payload.channel._id) || s.channels.find(c=>c._id===a.payload.channel._id);
        if(!exists) s.dms.unshift(a.payload.channel);
        s.currentChannelId=a.payload.channel._id;
      })
      .addCase(createDM.rejected,(s,a)=>{ s.error=a.payload?.message; })

      .addCase(createDMByCode.fulfilled,(s,a)=>{
        const exists = s.dms.find(c=>c._id===a.payload.channel._id) || s.channels.find(c=>c._id===a.payload.channel._id);
        if(!exists) s.dms.unshift(a.payload.channel);
        s.currentChannelId=a.payload.channel._id;
      })
      .addCase(createDMByCode.rejected,(s,a)=>{ s.error=a.payload?.message; })

      .addCase(fetchMessages.pending,(s,a)=>{
        const id=a.meta.arg.channelId;
        if(!s.messagesByChannel[id]) s.messagesByChannel[id]={items:[],hasMore:false,nextCursor:null,loading:false};
        s.messagesByChannel[id].loading=true;
      })
      .addCase(fetchMessages.fulfilled,(s,a)=>{
        const { channelId, messages, hasMore, nextCursor } = a.payload;
        if(!s.messagesByChannel[channelId]) s.messagesByChannel[channelId]={items:[],hasMore:false,nextCursor:null,loading:false};
        const state = s.messagesByChannel[channelId];
        const sorted = [...messages].sort((x,y)=> new Date(x.createdAt)-new Date(y.createdAt));
        if (!a.meta.arg.cursor) {
          state.items = sorted;
        } else {
          const existingIds = new Set(state.items.map(m=>m._id));
          const filtered = sorted.filter(m=>!existingIds.has(m._id));
          state.items = [...filtered, ...state.items].sort((x,y)=> new Date(x.createdAt)-new Date(y.createdAt));
        }
        state.hasMore = hasMore;
        state.nextCursor = nextCursor;
        state.loading = false;
      })
      .addCase(fetchMessages.rejected,(s,a)=>{
        const id=a.meta.arg.channelId;
        if(s.messagesByChannel[id]) s.messagesByChannel[id].loading=false;
        s.error=a.payload?.message;
      })

      .addCase(sendMessage.pending,(s)=>{ s.sending=true; s.error=null; })
      .addCase(sendMessage.fulfilled,(s,a)=>{
        s.sending=false;
        const { channelId, message } = a.payload;
        if(!s.messagesByChannel[channelId]) s.messagesByChannel[channelId]={items:[],hasMore:false,nextCursor:null,loading:false};
        const exists = s.messagesByChannel[channelId].items.some(m=>m._id===message._id);
        if(!exists) s.messagesByChannel[channelId].items.push(message);
      })
      .addCase(sendMessage.rejected,(s,a)=>{ s.sending=false; s.error=a.payload?.message; });
  }
});

export const { selectChannel, clearError, appendMessage } = chatSlice.actions;
export default chatSlice.reducer;
