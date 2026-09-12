import * as authService from './auth.service.js';
import { setTokenCookies, clearTokenCookies } from '../../utils/jwt.js';

export async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    setTokenCookies(res, accessToken, refreshToken);
    res.status(201).json({ user, accessToken });
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setTokenCookies(res, accessToken, refreshToken);
    res.json({ user, accessToken });
  } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    const { user, accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);
    setTokenCookies(res, accessToken, newRefreshToken);
    res.json({ user, accessToken });
  } catch (err) { next(err); }
}

export async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken && req.user?.id) {
      await authService.logout(req.user.id, refreshToken);
    }
    clearTokenCookies(res);
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ user });
  } catch (err) { next(err); }
}

export async function getByChatCode(req, res, next) {
  try {
    const user = await authService.findByChatCode(req.params.code);
    res.json({ user });
  } catch (err) { next(err); }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.json({ user });
  } catch (err) { next(err); }
}

export async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    clearTokenCookies(res);
    res.json({ message: 'Password changed, please login again' });
  } catch (err) { next(err); }
}