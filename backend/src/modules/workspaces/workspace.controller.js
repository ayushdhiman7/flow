import * as svc from './workspace.service.js';
import { AppError } from '../../middleware/error.js';

export async function createWorkspace(req, res, next) {
  try {
    const workspace = await svc.createWorkspace(req.user.id, req.body);
    res.status(201).json({ workspace });
  } catch (err) { next(err); }
}

export async function getWorkspaces(req, res, next) {
  try {
    const workspaces = await svc.getWorkspaces(req.user.id);
    res.json({ workspaces });
  } catch (err) { next(err); }
}

export async function getWorkspace(req, res, next) {
  try {
    const workspace = await svc.getWorkspaceById(req.params.id, req.user.id);
    res.json({ workspace });
  } catch (err) { next(err); }
}

export async function updateWorkspace(req, res, next) {
  try {
    const workspace = await svc.updateWorkspace(req.params.id, req.user.id, req.body);
    res.json({ workspace });
  } catch (err) { next(err); }
}

export async function deleteWorkspace(req, res, next) {
  try {
    await svc.deleteWorkspace(req.params.id, req.user.id);
    res.json({ message: 'Workspace deleted' });
  } catch (err) { next(err); }
}

export async function inviteMember(req, res, next) {
  try {
    const workspace = await svc.inviteMember(req.params.id, req.user.id, req.body);
    res.json({ workspace });
  } catch (err) { next(err); }
}

export async function updateMember(req, res, next) {
  try {
    const workspace = await svc.updateMember(req.params.id, req.user.id, req.params.userId, req.body.role);
    res.json({ workspace });
  } catch (err) { next(err); }
}

export async function removeMember(req, res, next) {
  try {
    const workspace = await svc.removeMember(req.params.id, req.user.id, req.params.userId);
    res.json({ workspace });
  } catch (err) { next(err); }
}