import { List } from './list.model.js';
import { Board } from '../boards/board.model.js';
import { AppError } from '../../middleware/error.js';
import { getMemberRole } from '../workspaces/workspace.service.js';
import { cacheKey, delCache } from '../../config/redis.js';

export async function createList(boardId, userId, data) {
  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);

  const role = await getMemberRole(board.workspace, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  const maxPos = await List.findOne({ board: boardId }).sort({ position: -1 }).select('position');
  const position = data.position ?? (maxPos?.position ?? 0) + 1000;

  const list = await List.create({ ...data, board: boardId, position });
  await delCache(cacheKey('board', boardId, '*'));
  await delCache(cacheKey('boards', board.workspace, '*'));
  return list;
}

export async function getLists(boardId, userId) {
  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);

  const role = await getMemberRole(board.workspace, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  return List.find({ board: boardId, isArchived: false }).sort({ position: 1 });
}

export async function getListById(listId, userId) {
  const list = await List.findById(listId).populate('board', 'workspace');
  if (!list) throw new AppError('List not found', 404);

  const role = await getMemberRole(list.board.workspace, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  return list;
}

export async function updateList(listId, userId, data) {
  const list = await getListById(listId, userId);

  const role = await getMemberRole(list.board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  Object.assign(list, data);
  await list.save();
  await delCache(cacheKey('board', list.board.toString(), '*'));
  return list;
}

export async function deleteList(listId, userId) {
  const list = await getListById(listId, userId);

  const role = await getMemberRole(list.board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  await delCache(cacheKey('board', list.board.toString(), '*'));
  await list.deleteOne();
}

export async function reorderLists(boardId, userId, listIds) {
  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);
  const role = await getMemberRole(board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  const session = await List.db.startSession();
  session.startTransaction();
  try {
    const bulkOps = listIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, board: boardId },
        update: { $set: { position: index * 1000 } },
      },
    }));
    await List.bulkWrite(bulkOps, { session });
    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
  await delCache(cacheKey('board', boardId, '*'));
  await delCache(cacheKey('boards', board.workspace, '*'));
  return List.find({ board: boardId }).sort({ position: 1 });
}