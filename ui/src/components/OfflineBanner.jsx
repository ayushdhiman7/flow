import { useEffect, useState } from "react";
import { WifiOff, CloudUpload } from "lucide-react";
import { getQueue, replayQueue } from "@/app/offlineQueue";
import { apiFetch } from "@/api/client";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [queued, setQueued] = useState(() => getQueue().length);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    const onQueue = (e) => setQueued(e.detail ?? getQueue().length);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("flow:queueChanged", onQueue);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("flow:queueChanged", onQueue);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const res = await replayQueue(apiFetch);
    setSyncing(false);
    setQueued(res.failed);
  };

  if (!isOffline && queued === 0) return null;

  return (
    <div className={`flex items-center justify-center gap-3 px-4 py-2 text-sm ${isOffline ? "bg-amber-500 text-white" : "bg-sky-600 text-white"}`}>
      {isOffline ? <WifiOff className="h-4 w-4" /> : <CloudUpload className="h-4 w-4" />}
      <span>
        {isOffline ? "You are offline" : "Back online"}
        {queued > 0 && ` — ${queued} request${queued>1?"s":""} queued`}
      </span>
      {!isOffline && queued > 0 && (
        <button onClick={handleSync} disabled={syncing} className="ml-2 px-3 py-1 rounded-full bg-white text-sky-700 text-xs font-medium hover:bg-zinc-100 disabled:opacity-50">
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      )}
    </div>
  );
}
