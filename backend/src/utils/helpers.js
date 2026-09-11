export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateSlug(base, existing) {
  let slug = slugify(base);
  let counter = 1;
  while (existing.includes(slug)) {
    slug = `${slugify(base)}-${counter}`;
    counter++;
  }
  return slug;
}

export function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});
}

export function omit(obj, keys) {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

export function paginate(page = 1, limit = 20) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  return {
    skip: (safePage - 1) * safeLimit,
    limit: safeLimit,
    page: safePage,
  };
}

export function buildCursorQuery(cursor, field = '_id') {
  if (!cursor) return {};
  return { [field]: { $gt: cursor } };
}

export function formatCursor(docs, field = '_id') {
  if (!docs.length) return null;
  return docs[docs.length - 1][field].toString();
}

export function sanitizeUser(user) {
  const { password, refreshToken, ...safe } = user.toObject ? user.toObject() : user;
  return safe;
}

export function getNested(obj, path, defaultValue = undefined) {
  return path.split('.').reduce((o, k) => (o ? o[k] : defaultValue), obj);
}