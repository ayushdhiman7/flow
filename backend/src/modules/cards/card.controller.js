import * as svc from './card.service.js';
import { CARD_ACTIONS } from '../../utils/constants.js';

export async function createCard(req, res, next) {
  try {
    const card = await svc.createCard(req.params.listId, req.user.id, req.body);
    res.status(201).json({ card });
  } catch (err) { next(err); }
}

export async function getCards(req, res, next) {
  try {
    const cursor = req.query.cursor;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const data = await svc.getCards(req.params.listId, req.user.id, cursor, limit);
    res.json(data);
  } catch (err) { next(err); }
}

export async function getCard(req, res, next) {
  try {
    const card = await svc.getCardById(req.params.id, req.user.id);
    res.json({ card });
  } catch (err) { next(err); }
}

export async function updateCard(req, res, next) {
  try {
    const card = await svc.updateCard(req.params.id, req.user.id, req.body);
    res.json({ card });
  } catch (err) { next(err); }
}

export async function moveCard(req, res, next) {
  try {
    const card = await svc.moveCard(req.params.id, req.user.id, req.body);
    res.json({ card });
  } catch (err) { next(err); }
}

export async function deleteCard(req, res, next) {
  try {
    await svc.deleteCard(req.params.id, req.user.id);
    res.json({ message: 'Card deleted' });
  } catch (err) { next(err); }
}

export async function addAssignees(req, res, next) {
  try {
    const card = await svc.addAssignees(req.params.id, req.user.id, req.body.userIds);
    res.json({ card });
  } catch (err) { next(err); }
}

export async function removeAssignee(req, res, next) {
  try {
    const card = await svc.removeAssignee(req.params.id, req.user.id, req.params.assigneeId);
    res.json({ card });
  } catch (err) { next(err); }
}