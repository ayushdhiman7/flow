const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export function getAvatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  if (avatar.startsWith("blob:")) return avatar;
  const base = API_URL.replace(/\/$/, "").replace(/\/api$/, "");
  return `${base}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
}
