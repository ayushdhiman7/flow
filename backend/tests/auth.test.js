import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/modules/auth/user.model.js';

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
});

describe('Auth API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  };

  test('POST /api/auth/register - should register new user', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.user).toMatchObject({
      email: testUser.email,
      name: testUser.name,
    });
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/register - should fail with duplicate email', async () => {
    await request(server).post('/api/auth/register').send(testUser);
    const res = await request(server)
      .post('/api/auth/register')
      .send(testUser)
      .expect(409);

    expect(res.body.error).toBe('Email already registered');
  });

  test('POST /api/auth/login - should login with correct credentials', async () => {
    await request(server).post('/api/auth/register').send(testUser);

    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.accessToken).toBeDefined();
  });

  test('POST /api/auth/login - should fail with wrong password', async () => {
    await request(server).post('/api/auth/register').send(testUser);

    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);

    expect(res.body.error).toBe('Invalid credentials');
  });

  test('GET /api/auth/me - should return current user', async () => {
    const registerRes = await request(server)
      .post('/api/auth/register')
      .send(testUser);

    const cookie = registerRes.headers['set-cookie'];

    const res = await request(server)
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.user.email).toBe(testUser.email);
  });

  test('POST /api/auth/refresh - should refresh access token', async () => {
    const registerRes = await request(server)
      .post('/api/auth/register')
      .send(testUser);

    const cookie = registerRes.headers['set-cookie'];

    const res = await request(server)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
  });

  test('POST /api/auth/logout - should logout and clear cookies', async () => {
    const registerRes = await request(server)
      .post('/api/auth/register')
      .send(testUser);

    const cookie = registerRes.headers['set-cookie'];

    const res = await request(server)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.message).toBe('Logged out');
  });
});