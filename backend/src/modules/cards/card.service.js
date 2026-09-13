import mongoose from 'mongoose';
import { Card } from './card.model.js';
import { List } from '../lists/list.model.js';
import { Board } from '../boards/board.model.js';
import { AppError } from '../../middleware/error.js';
import { getMemberRole } from '../workspaces/workspace.service.js';
import { CARD_ACTIONS } from '../../utils/constants.js';
import { addNotificationJob } from '../../config/queue.js';
import { emitToBoard } from '../../socket/socket.js';
import { cacheKey, delCache } from '../../config/redis.js';

export async function createCard(listId, userId, data) {
  const list = await List.findById(listId).populate('board', 'workspace');
  if (!list) throw new AppError('List not found', 404);

  const role = await getMemberRole(list.board.workspace, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  const maxPos = await Card.findOne({ list: listId }).sort({ position: -1 }).select('position');
  const position = data.position ?? (maxPos?.position ?? 0) + 1000;

  const card = await Card.create({
    ...data,
    list: listId,
    board: list.board._id,
    position,
    createdBy: userId,
  });

  await delCache(cacheKey('board', list.board._id.toString(), '*'));
  await emitToBoard(list.board._id.toString(), CARD_ACTIONS.CREATED, { card });
  await notifyAssignees(card, userId, 'assigned to card');

  return card;
}

export async function getCards(listId, userId, cursor, limit, search) {
  const list = await List.findById(listId).populate('board', 'workspace');
  if (!list) throw new AppError('List not found', 404);
  const role = await getMemberRole(list.board.workspace, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);
  const query = { list: listId, isArchived: false };
  if (cursor) query._id = { $gt: cursor };
  let sort = { position: 1 };
  let useTextSearch = false;
  if (search && search.trim().length >= 2) {
    const trimmed = search.trim();
    if (trimmed.length <= 100) {
      query.$text = { $search: trimmed };
      sort = { score: { $meta: 'textScore' }, position: 1 };
      useTextSearch = true;
    }
  }
  let findQuery = Card.find(query, useTextSearch ? { score: { $meta: 'textScore' } } : {});
  if (!useTextSearch && search && search.trim()) {
    findQuery = Card.find({ ...query, $or: [{ title: { $regex: search.trim(), $options: 'i' } }, { description: { $regex: search.trim(), $options: 'i' } }] });
    sort = { position: 1 };
  }
  const cards = await findQuery
    .populate('assignees', 'name email avatar')
    .sort(sort)
    .limit(limit + 1);
  // fallback regex if text search returned empty but search was provided
  if (useTextSearch && cards.length === 0 && search) {
    const fallback = await Card.find({ list: listId, isArchived: false, ...(cursor ? { _id: { $gt: cursor } } : {}), $or: [{ title: { $regex: search.trim(), $options: 'i' } }, { description: { $regex: search.trim(), $options: 'i' } }] })
      .populate('assignees', 'name email avatar')
      .sort({ position: 1 })
      .limit(limit + 1);
    const hasMoreF = fallback.length > limit;
    if (hasMoreF) fallback.pop();
    return { cards: fallback, hasMore: hasMoreF, nextCursor: fallback.length ? fallback[fallback.length - 1]._id.toString() : null };
  }
  const hasMore = cards.length > limit;
  if (hasMore) cards.pop();
  return { cards, hasMore, nextCursor: cards.length ? cards[cards.length - 1]._id.toString() : null };
}

export async function getCardById(cardId, userId) {
  const card = await Card.findById(cardId)
    .populate('assignees', 'name email avatar')
    .populate('list', 'board')
    .populate({ path: 'list', populate: { path: 'board', select: 'workspace' } });
  if (!card) throw new AppError('Card not found', 404);

  const role = await getMemberRole(card.list.board.workspace, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  return card;
}

export async function updateCard(cardId, userId, data) {
  const card = await getCardById(cardId, userId);

  const role = await getMemberRole(card.list.board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  const oldAssignees = card.assignees.map(a => a.toString());
  Object.assign(card, data);
  await card.save();
  await delCache(cacheKey('board', card.list.board._id.toString(), '*'));

  const newAssignees = card.assignees.map(a => a.toString());
  const added = newAssignees.filter(a => !oldAssignees.includes(a));
  if (added.length) await notifyAssignees(card, userId, 'assigned to card', added);

  await emitToBoard(card.list.board._id.toString(), CARD_ACTIONS.UPDATED, { card });
  return card;
}

export async function moveCard(cardId, userId, { listId, position }) {
  // Fail fast with a named 400 before any DB call: a Mongoose CastError
  // would otherwise surface as a generic "Invalid ID format".
  if (!mongoose.isValidObjectId(cardId)) throw new AppError('Invalid card ID', 400);
  if (!mongoose.isValidObjectId(listId)) throw new AppError('Invalid list ID', 400);
  const pos = Number(position);
  if (!Number.isFinite(pos)) throw new AppError('Invalid position', 400);

  const card = await getCardById(cardId, userId);
  const newList = await List.findById(listId).populate('board', 'workspace');
  if (!newList) throw new AppError('Target list not found', 404);
  const role = await getMemberRole(newList.board.workspace, userId);
  if (!role) {
    throw new AppError('Not a member of this workspace', 403);
  }
  // card.list may be a populated doc or an ObjectId — handle both.
  const originalListId = card.list?._id ? String(card.list._id) : String(card.list);
  if (originalListId !== listId) {
    await Card.updateMany(
      { list: listId, position: { $gte: pos } },
      { $inc: { position: 1000 } }
    );
    card.list = listId;
  } else if (pos !== card.position) {
    const isMovingDown = pos > card.position;
    await Card.updateMany(
      {
        list: listId,
        position: isMovingDown
          ? { $gt: card.position, $lte: pos }
          : { $gte: pos, $lt: card.position },
      },
      { $inc: { position: isMovingDown ? -1000 : 1000 } }
    );
  }
  card.position = pos;
  await card.save();
  await delCache(cacheKey('board', newList.board._id.toString(), '*'));
  if (originalListId !== listId) {
    const oldList = await List.findById(originalListId).select('board');
    if (oldList) await delCache(cacheKey('board', oldList.board.toString(), '*'));
  }
  await emitToBoard(newList.board._id.toString(), CARD_ACTIONS.MOVED, { card, fromList: originalListId });
  return card;
}

export async function deleteCard(cardId, userId) {
  const card = await getCardById(cardId, userId);

  const role = await getMemberRole(card.list.board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  await card.deleteOne();
  await delCache(cacheKey('board', card.list.board._id.toString(), '*'));
  await emitToBoard(card.list.board._id.toString(), CARD_ACTIONS.DELETED, { cardId });
}

export async function addAssignees(cardId, userId, userIds) {
  const card = await getCardById(cardId, userId);

  const role = await getMemberRole(card.list.board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  const newAssignees = userIds.filter(id => !card.assignees.some(a => a.toString() === id));
  if (newAssignees.length) {
    card.assignees.push(...newAssignees);
    await card.save();
    await delCache(cacheKey('board', card.list.board._id.toString(), '*'));
    await notifyAssignees(card, userId, 'assigned to card', newAssignees);
  }

  await emitToBoard(card.list.board._id.toString(), CARD_ACTIONS.ASSIGNED, { card, assignees: newAssignees });
  return card;
}

export async function removeAssignee(cardId, userId, assigneeId) {
  const card = await getCardById(cardId, userId);

  const role = await getMemberRole(card.list.board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  card.assignees = card.assignees.filter(a => a.toString() !== assigneeId);
  await card.save();
  await delCache(cacheKey('board', card.list.board._id.toString(), '*'));

  await emitToBoard(card.list.board._id.toString(), CARD_ACTIONS.UPDATED, { card });
  return card;
}

async function notifyAssignees(card, actorId, action, targetIds = null) {
  const assigneeIds = targetIds || card.assignees.map(a => a.toString());
  for (const assigneeId of assigneeIds) {
    if (assigneeId !== actorId) {
      await addNotificationJob('card-assigned', {
        userId: assigneeId,
        actorId,
        cardId: card._id,
        cardTitle: card.title,
        action,
      });
    }
  }
}