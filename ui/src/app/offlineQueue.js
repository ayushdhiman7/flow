const QUEUE_KEY = "flow_offline_queue";

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}
function saveQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function enqueueOfflineRequest(path, opts) {
  const q = loadQueue();
  q.push({ path, opts, ts: Date.now(), id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}` });
  saveQueue(q);
  window.dispatchEvent(new CustomEvent("flow:queueChanged", { detail: q.length }));
}

export function getQueue() { return loadQueue(); }

export function clearQueue() { saveQueue([]); window.dispatchEvent(new CustomEvent("flow:queueChanged", { detail: 0 })); }

export async function replayQueue(apiFetch) {
  const q = loadQueue();
  if (!q.length || !navigator.onLine) return { replayed: 0, failed: q.length };
  const remaining = [];
  let replayed = 0;
  for (const item of q) {
    try {
      await apiFetch(item.path, item.opts);
      replayed++;
    } catch {
      remaining.push(item);
    }
  }
  saveQueue(remaining);
  window.dispatchEvent(new CustomEvent("flow:queueChanged", { detail: remaining.length }));
  return { replayed, failed: remaining.length };
}

export function setupOfflineSync(apiFetch) {
  window.addEventListener("online", () => {
    replayQueue(apiFetch);
  });
}

// Simple hook for offline status
export function isOffline() { return typeof navigator !== "undefined" && !navigator.onLine; }
