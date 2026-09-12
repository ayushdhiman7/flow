import * as svc from './note.service.js';

export async function createNote(req, res, next) {
  try {
    const note = await svc.createNote(req.params.workspaceId, req.user.id, req.body);
    res.status(201).json({ note });
  } catch (err) { next(err); }
}

export async function getNotes(req, res, next) {
  try {
    const notes = await svc.getNotes(req.params.workspaceId, req.user.id, req.query);
    res.json({ notes });
  } catch (err) { next(err); }
}

export async function getNote(req, res, next) {
  try {
    const note = await svc.getNoteById(req.params.workspaceId, req.params.id, req.user.id);
    res.json({ note });
  } catch (err) { next(err); }
}

export async function updateNote(req, res, next) {
  try {
    const note = await svc.updateNote(req.params.workspaceId, req.params.id, req.user.id, req.body);
    res.json({ note });
  } catch (err) { next(err); }
}

export async function deleteNote(req, res, next) {
  try {
    await svc.deleteNote(req.params.workspaceId, req.params.id, req.user.id);
    res.json({ message: 'Note deleted' });
  } catch (err) { next(err); }
}
