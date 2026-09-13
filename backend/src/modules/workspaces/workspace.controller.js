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

export async function joinByCode(req, res, next) {
  try {
    const code = req.body.code || req.body.slug;
    const result = await svc.joinWorkspaceByCode(req.user.id, code);
    if (result.status === 'pending') return res.status(202).json({ message: 'Join request sent — awaiting owner approval', workspace: result.workspace });
    if (result.status === 'already_member') return res.json({ message: 'Already a member', workspace: result.workspace });
    res.json({ workspace: result.workspace });
  } catch (err) { next(err); }
}

export async function getJoinRequests(req, res, next) {
  try {
    const requests = await svc.getJoinRequests(req.params.id, req.user.id);
    res.json({ requests });
  } catch (err) { next(err); }
}

export async function handleJoinRequest(req, res, next) {
  try {
    const { id, requestId } = req.params;
    const { action } = req.body; // approve | reject
    const workspace = await svc.handleJoinRequest(id, requestId, req.user.id, action);
    res.json({ workspace });
  } catch (err) { next(err); }
}