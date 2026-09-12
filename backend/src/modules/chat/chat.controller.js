import * as svc from './chat.service.js';

export async function createChannel(req, res, next) {
  try {
    const channel = await svc.createChannel(req.params.workspaceId, req.user.id, req.body);
    res.status(201).json({ channel });
  } catch (err) { next(err); }
}

export async function getChannels(req, res, next) {
  try {
    const channels = await svc.getChannels(req.params.workspaceId, req.user.id);
    res.json({ channels });
  } catch (err) { next(err); }
}

export async function getChannel(req, res, next) {
  try {
    const channel = await svc.getChannelById(req.params.id, req.user.id);
    res.json({ channel });
  } catch (err) { next(err); }
}

export async function createDM(req, res, next) {
  try {
    const channel = await svc.createDM(req.params.workspaceId, req.user.id, req.body.userId);
    res.json({ channel });
  } catch (err) { next(err); }
}

export async function createDMByCode(req, res, next) {
  try {
    const channel = await svc.createDMByCode(req.params.workspaceId, req.user.id, req.body.chatCode);
    res.json({ channel });
  } catch (err) { next(err); }
}

export async function getMessages(req, res, next) {
  try {
    const cursor = req.query.cursor;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const data = await svc.getMessages(req.params.id, req.user.id, cursor, limit);
    res.json(data);
  } catch (err) { next(err); }
}

export async function sendMessage(req, res, next) {
  try {
    const message = await svc.sendMessage(req.params.id, req.user.id, req.body);
    res.status(201).json({ message });
  } catch (err) { next(err); }
}