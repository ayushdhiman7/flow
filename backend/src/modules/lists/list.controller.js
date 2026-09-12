import * as svc from './list.service.js';

export async function createList(req, res, next) {
  try {
    const list = await svc.createList(req.params.boardId, req.user.id, req.body);
    res.status(201).json({ list });
  } catch (err) { next(err); }
}

export async function getLists(req, res, next) {
  try {
    const lists = await svc.getLists(req.params.boardId, req.user.id);
    res.json({ lists });
  } catch (err) { next(err); }
}

export async function getList(req, res, next) {
  try {
    const list = await svc.getListById(req.params.id, req.user.id);
    res.json({ list });
  } catch (err) { next(err); }
}

export async function updateList(req, res, next) {
  try {
    const list = await svc.updateList(req.params.id, req.user.id, req.body);
    res.json({ list });
  } catch (err) { next(err); }
}

export async function deleteList(req, res, next) {
  try {
    await svc.deleteList(req.params.id, req.user.id);
    res.json({ message: 'List deleted' });
  } catch (err) { next(err); }
}

export async function reorderLists(req, res, next) {
  try {
    const lists = await svc.reorderLists(req.params.boardId, req.user.id, req.body.listIds);
    res.json({ lists });
  } catch (err) { next(err); }
}