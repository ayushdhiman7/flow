import { Card } from './card.model.js';
import { List } from '../lists/list.model.js';
import { Board } from '../boards/board.model.js';
import { AppError } from '../../middleware/error.js';
import { getMemberRole } from '../workspaces/workspace.service.js';
import { CARD_ACTIONS } from '../../utils/constants.js';
import { addNotificationJob } from '../../config/queue.js';
import { emitToBoard } from '../../socket/socket.js';

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

  await emitToBoard(list.board._id.toString(), CARD_ACTIONS.CREATED, { card });
  await notifyAssignees(card, userId, 'assigned to card');

  return card;
}

export async function getCards(listId, userId, cursor, limit) {
  const list = await List.findById(listId).populate('board', 'workspace');
  if (!list) throw new AppError('List not found', 404);

  const role = await getMemberRole(list.board.workspace, userId);
  if (!role) throw new AppError('Not a member of this workspace', 403);

  const query = { list: listId, isArchived: false };
  if (cursor) query._id = { $gt: cursor };

  const cards = await Card.find(query)
    .populate('assignees', 'name email avatar')
    .sort({ position: 1 })
    .limit(limit + 1);

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

  const newAssignees = card.assignees.map(a => a.toString());
  const added = newAssignees.filter(a => !oldAssignees.includes(a));
  if (added.length) await notifyAssignees(card, userId, 'assigned to card', added);

  await emitToBoard(card.list.board._id.toString(), CARD_ACTIONS.UPDATED, { card });
  return card;
}

export async function moveCard(cardId, userId, { listId, position }) {
  const card = await getCardById(cardId, userId);
  const newList = await List.findById(listId).populate('board', 'workspace');
  if (!newList) throw new AppError('Target list not found', 404);

  const role = await getMemberRole(newList.board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  if (card.list.toString() !== listId) {
    await Card.updateMany(
      { list: listId, position: { $gte: position } },
      { $inc: { position: 1000 } }
    );
    card.list = listId;
  } else {
    const isMovingDown = position > card.position;
    await Card.updateMany(
      {
        list: listId,
        position: isMovingDown
          ? { $gt: card.position, $lte: position }
          : { $gte: position, $lt: card.position },
      },
      { $inc: { position: isMovingDown ? -1000 : 1000 } }
    );
  }

  card.position = position;
  await card.save();

  await emitToBoard(newList.board._id.toString(), CARD_ACTIONS.MOVED, { card, fromList: card.list });
  return card;
}

export async function deleteCard(cardId, userId) {
  const card = await getCardById(cardId, userId);

  const role = await getMemberRole(card.list.board.workspace, userId);
  if (!role || !['owner', 'admin'].includes(role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  await card.deleteOne();
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