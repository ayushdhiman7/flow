// Shared Mongo ObjectId helpers: every drag/drop id sent to the API must pass.
export const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const isObjectId = (v) => typeof v === "string" && OBJECT_ID_RE.test(v);

// Normalize a value that should be an ObjectId string.
// Returns the 24-hex string, or null when it isn't one (never "undefined").
export const normId = (v) => {
  if (v == null) return null;
  if (typeof v === "object") {
    if (typeof v._id === "string" && OBJECT_ID_RE.test(v._id)) return v._id;
    if (typeof v.id === "string" && OBJECT_ID_RE.test(v.id)) return v.id;
    return null;
  }
  const s = String(v);
  return OBJECT_ID_RE.test(s) ? s : null;
};
