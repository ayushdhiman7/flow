/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { selectIsAuthenticated } from "@/features/auth/authSelectors";
import { selectSelectedWorkspaceId } from "@/features/workspace/workspaceSelectors";
import { selectCurrentChannelId, selectAllChannels } from "@/features/chat/chatSelectors";
import { appendMessage } from "@/features/chat/chatSlice";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/api\/?$/, "");

export default function useSocket() {
  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuthenticated);
  const accessToken = useSelector((s) => s.auth?.accessToken);
  const workspaceId = useSelector(selectSelectedWorkspaceId);
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
      // message.channel may be string or populated object
      const raw = message.channel;
      const cid = raw && typeof raw === "object" && raw._id ? raw._id.toString() : String(raw || currentChannelId || "");
      const channelId = cid || message.channelId || currentChannelId;
      if (channelId) dispatch(appendMessage({ channelId, message }));
      else dispatch(appendMessage({ channelId: message.channel, message }));
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
