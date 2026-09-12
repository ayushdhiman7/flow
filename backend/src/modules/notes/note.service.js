import { Note } from './note.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { AppError } from '../../middleware/error.js';
import { getMemberRole } from '../workspaces/workspace.service.js';

export async function createNote(workspaceId, userId, data) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);
  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);
  const note = await Note.create({ ...data, workspace: workspaceId, author: userId });
  const populated = await Note.findById(note._id).populate('author', 'name email avatar');
  return populated;
}

export async function getNotes(workspaceId, userId, query = {}) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);
  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  const filter = { workspace: workspaceId, isArchived: false };
  if (query.isPinned !== undefined) filter.isPinned = query.isPinned === 'true';
  if (query.isArchived !== undefined) filter.isArchived = query.isArchived === 'true';
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const notes = await Note.find(filter)
    .populate('author', 'name email avatar')
    .sort(query.search ? { score: { $meta: 'textScore' }, updatedAt: -1 } : { isPinned: -1, updatedAt: -1 })
    .limit(query.limit || 50);

  return notes;
}

export async function getNoteById(workspaceId, noteId, userId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);
  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);
  const note = await Note.findOne({ _id: noteId, workspace: workspaceId }).populate('author', 'name email avatar');
  if (!note) throw new AppError('Note not found', 404);
  return note;
}

export async function updateNote(workspaceId, noteId, userId, data) {
  const note = await Note.findOne({ _id: noteId, workspace: workspaceId });
  if (!note) throw new AppError('Note not found', 404);
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);
  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);
  // author or owner/admin can update
  if (note.author.toString() !== userId && !['owner','admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  Object.assign(note, data);
  await note.save();
  const populated = await Note.findById(note._id).populate('author', 'name email avatar');
  return populated;
}

export async function deleteNote(workspaceId, noteId, userId) {
  const note = await Note.findOne({ _id: noteId, workspace: workspaceId });
  if (!note) throw new AppError('Note not found', 404);
  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);
  if (note.author.toString() !== userId && !['owner','admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  await note.deleteOne();
}
