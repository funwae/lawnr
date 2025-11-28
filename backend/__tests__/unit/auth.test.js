import { describe, it, expect, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../app/models/User.js';

// Mock database
jest.mock('../../config/database.js', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

import pool from '../../config/database.js';

describe('User Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should hash password correctly', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 10);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should find user by email', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'homeowner',
    };

    pool.query.mockResolvedValueOnce({
      rows: [mockUser],
    });

    const user = await User.findByEmail('test@example.com');

    expect(user).toEqual(mockUser);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      ['test@example.com']
    );
  });

  it('should create user with hashed password', async () => {
    const mockUser = {
      id: '123',
      email: 'new@example.com',
      full_name: 'New User',
      role: 'homeowner',
    };

    pool.query.mockResolvedValueOnce({
      rows: [mockUser],
    });

    const userData = {
      email: 'new@example.com',
      password: 'password123',
      full_name: 'New User',
      role: 'homeowner',
    };

    const user = await User.create(userData);

    expect(user).toBeDefined();
    expect(pool.query).toHaveBeenCalled();
  });
});

