const request = require('supertest');
const app = require('../server');
const { sequelize, User, Todo } = require('../models');
const jwt = require('jsonwebtoken');
const config = require('../config');

describe('API Tests', () => {
  let authToken;
  let testUser;

  // Setup before all tests
  beforeAll(async () => {
    // Sync database in test mode
    await sequelize.sync({ force: true });

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test@123456'
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  // Cleanup after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  // Authentication Tests
  describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', async () => {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'New User',
            email: 'newuser@example.com',
            password: 'NewUser@123'
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('email', 'newuser@example.com');
      });

      it('should fail with invalid data', async () => {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'A', // Too short
            email: 'invalid-email',
            password: '123' // Too short
          });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login successfully', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'Test@123456'
          });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('email', 'test@example.com');
      });

      it('should fail with invalid credentials', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrong-password'
          });

        expect(res.status).toBe(401);
      });
    });
  });

  // Todo Tests
  describe('Todos', () => {
    let testTodo;

    describe('POST /api/todo', () => {
      it('should create a new todo', async () => {
        const res = await request(app)
          .post('/api/todo')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Todo',
            description: 'Test Description',
            dueDate: new Date().toISOString(),
            priority: 'high'
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('title', 'Test Todo');
        testTodo = res.body;
      });

      it('should fail without authentication', async () => {
        const res = await request(app)
          .post('/api/todo')
          .send({
            title: 'Test Todo'
          });

        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/todo', () => {
      it('should get user todos', async () => {
        const res = await request(app)
          .get('/api/todo')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.todos)).toBe(true);
      });

      it('should filter by status', async () => {
        const res = await request(app)
          .get('/api/todo?status=pending')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.todos)).toBe(true);
        res.body.todos.forEach(todo => {
          expect(todo.status).toBe('pending');
        });
      });
    });

    describe('PUT /api/todo/:id', () => {
      it('should update a todo', async () => {
        const res = await request(app)
          .put(`/api/todo/${testTodo.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Updated Todo',
            status: 'done'
          });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('title', 'Updated Todo');
        expect(res.body).toHaveProperty('status', 'done');
      });

      it('should fail with invalid id', async () => {
        const res = await request(app)
          .put('/api/todo/invalid-id')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Updated Todo'
          });

        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/todo/:id', () => {
      it('should delete a todo', async () => {
        const res = await request(app)
          .delete(`/api/todo/${testTodo.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);

        // Verify deletion
        const checkRes = await request(app)
          .get(`/api/todo/${testTodo.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(checkRes.status).toBe(404);
      });
    });
  });



  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle 404 routes', async () => {
      const res = await request(app)
        .get('/api/non-existent-route')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('status', 'error');
    });

    it('should handle validation errors', async () => {
      const res = await request(app)
        .post('/api/todo')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required title
          description: 'Test Description'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should handle invalid tokens', async () => {
      const res = await request(app)
        .get('/api/todo')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  // Rate Limiting Tests
  describe('Rate Limiting', () => {
    it('should limit requests', async () => {
      const promises = Array(150).fill().map(() =>
        request(app)
          .get('/api/todo')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const results = await Promise.all(promises);
      const tooManyRequests = results.some(res => res.status === 429);
      expect(tooManyRequests).toBe(true);
    });
  });
}); 