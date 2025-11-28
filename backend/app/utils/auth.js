import pool from '../../config/database.js';
import { demoAuthenticate, demoAuthorize as demoAuthorizeFn } from './demo-auth.js';

const isDemoMode = process.env.DEMO_MODE === 'true';

// Only import these if not in demo mode
let bcrypt, jwt;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Lazy load bcrypt and jwt
const getBcrypt = async () => {
  if (!bcrypt) {
    bcrypt = (await import('bcryptjs')).default;
  }
  return bcrypt;
};

const getJwt = async () => {
  if (!jwt && !isDemoMode) {
    jwt = (await import('jsonwebtoken')).default;
  }
  return jwt;
};

export const hashPassword = async (password) => {
  const bcryptLib = await getBcrypt();
  const saltRounds = 10;
  return await bcryptLib.hash(password, saltRounds);
};

export const comparePassword = async (password, hash) => {
  const bcryptLib = await getBcrypt();
  return await bcryptLib.compare(password, hash);
};

export const generateToken = async (user) => {
  if (isDemoMode) {
    // In demo mode, return a simple mock token
    return `demo-token-${user.id}-${Date.now()}`;
  }
  const jwtLib = await getJwt();
  return jwtLib.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = async (token) => {
  if (isDemoMode) {
    throw new Error('verifyToken not available in demo mode');
  }
  try {
    const jwtLib = await getJwt();
    return jwtLib.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const authenticate = isDemoMode ? demoAuthenticate : async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { message: 'No token provided' } });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    // Fetch user from database to ensure they still exist
    const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: { message: 'User not found' } });
    }

    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: { message: 'Invalid token' } });
  }
};

export const authorize = isDemoMode ? demoAuthorizeFn : (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    next();
  };
};
