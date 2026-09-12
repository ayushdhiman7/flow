import * as svc from './board.service.js';

export async function createBoard(req, res, next) {
  try {
    const board = await svc.createBoard(req.params.workspaceId, req.user.id, req.body);
    res.status(201).json({ board });
  } catch (err) { next(err); }
}

export async function getBoards(req, res, next) {
  try {
    const boards = await svc.getBoards(req.params.workspaceId, req.user.id);
    res.json({ boards });
  } catch (err) { next(err); }
}

export async function getBoard(req, res, next) {
  try {
    const board = await svc.getBoardById(req.params.id, req.user.id);
    res.json({ board });
  } catch (err) { next(err); }
}

export async function getBoardFull(req, res, next) {
  try {
    const data = await svc.getBoardFull(req.params.id, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
}

export async function updateBoard(req, res, next) {
  try {
    const board = await svc.updateBoard(req.params.id, req.user.id, req.body);
    res.json({ board });
  } catch (err) { next(err); }
}

export async function deleteBoard(req, res, next) {
  try {
    await svc.deleteBoard(req.params.id, req.user.id);
    res.json({ message: 'Board deleted' });
  } catch (err) { next(err); }
}

export async function addMember(req, res, next) {
  try {
    const board = await svc.addMember(req.params.id, req.user.id, req.body.userId);
    res.json({ board });
  } catch (err) { next(err); }
}

export async function removeMember(req, res, next) {
  try {
    const board = await svc.removeMember(req.params.id, req.user.id, req.params.userId);
    res.json({ board });
  } catch (err) { next(err); }
}

export async function getBoardStats(req, res, next) {
  try {
    const stats = await svc.getBoardStats(req.params.id, req.user.id);
    res.json({ stats });
  } catch (err) { next(err); }
}