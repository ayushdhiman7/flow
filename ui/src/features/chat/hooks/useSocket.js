/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { selectIsAuthenticated } from "@/features/auth/authSelectors";
import { selectSelectedWorkspaceId, selectWorkspaces } from "@/features/workspace/workspaceSelectors";
import { selectCurrentChannelId, selectAllChannels } from "@/features/chat/chatSelectors";
import { appendMessage, fetchChannels, fetchGlobalDMs } from "@/features/chat/chatSlice";
import { fetchWorkspaces, fetchJoinRequests } from "@/features/workspace/workspaceSlice";
import { store } from "@/app/store";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/api\/?$/, "");

export default function useSocket() {
  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuthenticated);
  const accessToken = useSelector((s) => s.auth?.accessToken);
  const workspaceId = useSelector(selectSelectedWorkspaceId);
  const workspaces = useSelector(selectWorkspaces);
  const currentChannelId = useSelector(selectCurrentChannelId);
  const channels = useSelector(selectAllChannels);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuth) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token: accessToken || "" },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      if (workspaceId) socket.emit("join:workspace", workspaceId);
      if (currentChannelId) socket.emit("join:channel", currentChannelId);
    });

    socket.on("connect_error", (err) => {
      console.debug("socket connect_error", err.message);
    });

    socket.on("message:new", ({ message }) => {
      const raw = message.channel;
      const cid = raw && typeof raw === "object" && raw._id ? raw._id.toString() : String(raw || currentChannelId || "");
      const channelId = cid || message.channelId || currentChannelId;
      if (channelId) {
        dispatch(appendMessage({ channelId, message }));
        // if channel not yet in list (cross-workspace DM), fetch DMs/channels to populate list
        const state = store.getState();
        const all = [...state.chat.channels, ...state.chat.dms];
        const known = all.find(c => c._id === channelId);
        if (!known) {
          const wss = state.workspace.workspaces || workspaces;
          const wsId = state.workspace.selectedWorkspaceId || workspaceId;
          if (wss.length) dispatch(fetchGlobalDMs(wss));
          if (wsId) dispatch(fetchChannels(wsId));
        }
      } else dispatch(appendMessage({ channelId: message.channel, message }));
    });

    socket.on("channel:new", ({ channel }) => {
      // auto-join new channel room
      if (channel?._id) socket.emit("join:channel", channel._id);
      // refresh workspaces (cross-workspace auto-add) and DMs/channels
      dispatch(fetchWorkspaces());
      const state = store.getState();
      const wss = state.workspace.workspaces || workspaces;
      const wsId = state.workspace.selectedWorkspaceId || workspaceId;
      // delay slightly to allow workspace fetch to complete
      setTimeout(() => {
        const s2 = store.getState();
        const wss2 = s2.workspace.workspaces;
        if (wss2.length) dispatch(fetchGlobalDMs(wss2));
        if (wss2.length && s2.workspace.selectedWorkspaceId) dispatch(fetchChannels(s2.workspace.selectedWorkspaceId));
        else {
          if (wss.length) dispatch(fetchGlobalDMs(wss));
          if (wsId) dispatch(fetchChannels(wsId));
        }
      }, 500);
    });

    socket.on("notification:new", (payload) => {
      if (payload?.type === "new-message") {
        const state = store.getState();
        const wss = state.workspace.workspaces || workspaces;
        const wsId = state.workspace.selectedWorkspaceId || workspaceId;
        if (wss.length) dispatch(fetchGlobalDMs(wss));
        if (wsId) dispatch(fetchChannels(wsId));
        // also fetch the specific channel's messages if currently open? message:new will handle
      }
      if (payload?.type === "workspace-join-request") {
        const wsId = payload.workspaceId;
        if (wsId) dispatch(fetchJoinRequests(wsId));
        // also refresh workspaces to show pending count
        dispatch(fetchWorkspaces());
      }
      if (payload?.type === "workspace-join-approved" || payload?.type === "workspace-join-rejected") {
        dispatch(fetchWorkspaces());
        if (payload?.workspaceId) dispatch(fetchJoinRequests(payload.workspaceId));
      }
    });

    // also handle generic fallback
    socket.on("card:created", () => {});
    
    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [isAuth, accessToken, dispatch]);

  // handle workspace join changes
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    if (workspaceId) s.emit("join:workspace", workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    // wait for connect then join
    const doJoin = () => { if (currentChannelId) s.emit("join:channel", currentChannelId); };
    if (s.connected) doJoin();
    else s.once("connect", doJoin);
    return () => {
      if (currentChannelId && s.connected) s.emit("leave:channel", currentChannelId);
    };
  }, [currentChannelId]);

  // join all channels for workspace so DMs via code are received even when not selected
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !s.connected || !channels.length) return;
    channels.forEach((ch) => s.emit("join:channel", ch._id));
  }, [channels]);

  return socketRef;
}
