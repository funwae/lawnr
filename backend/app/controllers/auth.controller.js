import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { sendPasswordResetEmail } from '../services/email.service.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone_number, role } = req.body;

    // Validation
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        error: { message: 'Missing required fields: email, password, full_name, role' }
      });
    }

    if (!['homeowner', 'contractor', 'admin'].includes(role)) {
      return res.status(400).json({
        error: { message: 'Invalid role. Must be homeowner, contractor, or admin' }
      });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: { message: 'User with this email already exists' }
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password_hash,
      full_name,
      phone_number,
      role
    });

    // Generate token
    const token = await generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Remove password hash from response
    const { password_hash: _, ...userResponse } = user;

    res.status(201).json({
      user: userResponse,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required' }
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // Generate token
    const token = await generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Remove password hash from response
    const { password_hash: _, ...userResponse } = user;

    res.json({
      user: userResponse,
      token
    });
  } catch (error) {
    next(error);
  }
};

