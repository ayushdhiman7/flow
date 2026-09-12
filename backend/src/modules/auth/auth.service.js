import { User, Session } from './index.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, setTokenCookies, clearTokenCookies } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.js';

export async function register(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError('Email already registered', 409);

  const user = await User.create(data);
  const tokens = generateTokens(user);
  await createSession(user._id, tokens.refreshToken);
  return { user: sanitizeUser(user), ...tokens };
}

export async function login(credentials) {
  const user = await User.findOne({ email: credentials.email }).select('+password');
  if (!user || !await user.comparePassword(credentials.password)) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) throw new AppError('Account deactivated', 403);

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = generateTokens(user);
  await createSession(user._id, tokens.refreshToken);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refresh(refreshToken) {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const session = await Session.findOne({ refreshToken, revoked: false });
    if (!session || session.expiresAt < new Date()) {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) throw new AppError('User not found', 401);

    const tokens = generateTokens(user);
    await rotateSession(session, tokens.refreshToken);
    return { user: sanitizeUser(user), ...tokens };
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
}

export async function logout(userId, refreshToken) {
  await Session.findOneAndUpdate({ userId, refreshToken }, { revoked: true });
}

export async function logoutAll(userId) {
  await Session.updateMany({ userId }, { revoked: true });
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  // auto-generate chatCode for old users without it
  if (!user.chatCode) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    let exists = true;
    while (exists) {
      code = Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
      exists = await User.exists({ chatCode: code });
    }
    user.chatCode = code;
    await user.save();
  }
  return sanitizeUser(user);
}

export async function findByChatCode(code) {
  const user = await User.findOne({ chatCode: code.toUpperCase().trim() });
  if (!user) throw new AppError('User not found for this chat code', 404);
  const safe = sanitizeUser(user);
  return { _id: safe._id, name: safe.name, email: safe.email, avatar: safe.avatar, chatCode: safe.chatCode };
}

export async function updateProfile(userId, data) {
  const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  return sanitizeUser(user);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  if (!user || !await user.comparePassword(currentPassword)) {
    throw new AppError('Current password incorrect', 401);
  }
  user.password = newPassword;
  await user.save();
  await logoutAll(userId);
}

function generateTokens(user) {
  const payload = { id: user._id.toString(), email: user.email, role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

async function createSession(userId, refreshToken) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await Session.create({ userId, refreshToken, expiresAt });
}

async function rotateSession(oldSession, newRefreshToken) {
  oldSession.revoked = true;
  await oldSession.save();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await Session.create({ userId: oldSession.userId, refreshToken: newRefreshToken, expiresAt });
}

function sanitizeUser(user) {
  const { password, ...safe } = user.toObject();
  return safe;
}