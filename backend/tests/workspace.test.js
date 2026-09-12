import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/modules/auth/user.model.js';
import { Workspace } from '../src/modules/workspaces/workspace.model.js';

let mongoServer;
let server;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-32-chars';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-32-chars';
  await mongoose.connect(uri);
  server = app.listen(0);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Workspace.deleteMany({});
});

async function registerAndLogin(email = 'ws@example.com', name = 'Ws User') {
  const reg = await request(server).post('/api/auth/register').send({ email, password: 'password123', name });
  return reg.headers['set-cookie'];
}

describe('Workspace API', () => {
  test('POST /api/workspaces - create workspace', async () => {
    const cookie = await registerAndLogin();
    const res = await request(server).post('/api/workspaces').set('Cookie', cookie).send({ name: 'My Workspace', slug: 'my-workspace' }).expect(201);
    expect(res.body.workspace.name).toBe('My Workspace');
    expect(res.body.workspace.slug).toBe('my-workspace');
  });

  test('GET /api/workspaces - list workspaces (cached)', async () => {
    const cookie = await registerAndLogin();
    await request(server).post('/api/workspaces').set('Cookie', cookie).send({ name: 'Ws 1', slug: 'ws-1' });
    await request(server).post('/api/workspaces').set('Cookie', cookie).send({ name: 'Ws 2', slug: 'ws-2' });
    const res = await request(server).get('/api/workspaces').set('Cookie', cookie).expect(200);
    expect(res.body.workspaces.length).toBe(2);
    // second call hits cache
    const res2 = await request(server).get('/api/workspaces').set('Cookie', cookie).expect(200);
    expect(res2.body.workspaces.length).toBe(2);
  });

  test('PUT /api/workspaces/:id - owner can update', async () => {
    const cookie = await registerAndLogin();
    const created = await request(server).post('/api/workspaces').set('Cookie', cookie).send({ name: 'To Update', slug: 'to-update' });
    const id = created.body.workspace._id;
    const res = await request(server).put(`/api/workspaces/${id}`).set('Cookie', cookie).send({ name: 'Updated Name' }).expect(200);
    expect(res.body.workspace.name).toBe('Updated Name');
  });

  test('POST /api/workspaces/:id/members - invite member requires admin', async () => {
    const ownerCookie = await registerAndLogin('owner@example.com', 'Owner');
    const ws = await request(server).post('/api/workspaces').set('Cookie', ownerCookie).send({ name: 'Team', slug: 'team' });
    const wsId = ws.body.workspace._id;
    // register second user
    await request(server).post('/api/auth/register').send({ email: 'member@example.com', password: 'password123', name: 'Member' });
    const res = await request(server).post(`/api/workspaces/${wsId}/members`).set('Cookie', ownerCookie).send({ email: 'member@example.com', role: 'member' }).expect(200);
    expect(res.body.workspace.members.length).toBe(2);
  });
});
