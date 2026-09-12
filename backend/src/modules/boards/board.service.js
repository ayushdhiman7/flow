import { Board } from './board.model.js';
import { List } from '../lists/list.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { AppError } from '../../middleware/error.js';
import { getMemberRole } from '../workspaces/workspace.service.js';

const DEFAULT_LISTS = ['To Do', 'In Progress', 'Done'];

export async function createBoard(workspaceId, userId, data) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  // Transaction for atomic board + default lists creation
  const session = await Workspace.db.startSession();
  session.startTransaction();
  try {
    const [board] = await Board.create([{
      ...data,
      workspace: workspaceId,
      createdBy: userId,
      members: [userId],
    }], { session });

    const lists = await List.insertMany(DEFAULT_LISTS.map((name, index) => ({
      board: board._id,
      name,
      position: index * 1000,
    })), { session });

    board.lists = lists.map(l => l._id);
    await board.save({ session });
    await session.commitTransaction();
    return board;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

export async function getBoards(workspaceId, userId) {
  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  const query = { workspace: workspaceId };
  if (role === 'member') {
    query.$or = [
      { visibility: 'workspace' },
      { members: userId },
      { createdBy: userId },
    ];
  }

  return Board.find(query)
    .populate('createdBy', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort({ updatedAt: -1 });
}

export async function getBoardById(boardId, userId) {
  const board = await Board.findById(boardId)
    .populate('createdBy', 'name email avatar')
    .populate('members', 'name email avatar')
    .populate('workspace', 'name slug');
  if (!board) throw new AppError('Board not found', 404);

  const role = await getMemberRole(board.workspace._id, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  if (board.visibility === 'private' && !board.members.some(m => m._id.toString() === userId) && board.createdBy._id.toString() !== userId) {
    throw new AppError('Board is private', 403);
  }

  return board;
}

export async function getBoardFull(boardId, userId) {
  const board = await getBoardById(boardId, userId);

  const lists = await List.find({ board: boardId, isArchived: false })
    .sort({ position: 1 });

  const cards = await List.aggregate([
    { $match: { board: board._id, isArchived: false } },
    {
      $lookup: {
        from: 'cards',
        localField: '_id',
        foreignField: 'list',
        as: 'cards',
        pipeline: [
          { $match: { isArchived: false } },
          { $sort: { position: 1 } },
          {
            $lookup: {
              from: 'users',
              localField: 'assignees',
              foreignField: '_id',
              as: 'assignees',
              pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
            },
          },
        ],
      },
    },
    { $project: { name: 1, position: 1, cards: 1 } },
  ]);

  return { board, lists: cards };
}

export async function updateBoard(boardId, userId, data) {
  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);

  const role = await getMemberRole(board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  Object.assign(board, data);
  await board.save();
  return board;
}

export async function deleteBoard(boardId, userId) {
  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);

  const role = await getMemberRole(board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  await List.deleteMany({ board: boardId });
  await board.deleteOne();
}

export async function addMember(boardId, userId, memberId) {
  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);

  const role = await getMemberRole(board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  if (!board.members.some(m => m.toString() === memberId)) {
    board.members.push(memberId);
    await board.save();
  }
  return board;
}

export async function removeMember(boardId, userId, memberId) {
  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);

  const role = await getMemberRole(board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  if (memberId === board.createdBy.toString()) {
    throw new AppError('Cannot remove board creator', 403);
  }

  board.members = board.members.filter(m => m.toString() !== memberId);
  await board.save();
  return board;
}

export async function getBoardStats(boardId, userId) {
  await getBoardById(boardId, userId);

  const stats = await List.aggregate([
    { $match: { board: boardId, isArchived: false } },
    {
      $lookup: {
        from: 'cards',
        localField: '_id',
        foreignField: 'list',
        as: 'cards',
        pipeline: [
          { $match: { isArchived: false } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              overdue: { $sum: { $cond: [{ $lt: ['$dueDate', new Date()] }, 1, 0] } },
              assignedToMe: { $sum: { $cond: [{ $in: [userId, '$assignees'] }, 1, 0] } },
            },
          },
        ],
      },
    },
    { $project: { name: 1, position: 1, stats: { $arrayElemAt: ['$cards', 0] } } },
  ]);

  return stats;
}