import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SESSION_COOKIE_NAME = 'triovault_session';
const JWT_SECRET = process.env.SESSION_SECRET || 'triovault_default_jwt_secret_998877';
const JWT_EXPIRES_IN = '24h';

let cachedPasswordHash = null;

// Initialize password hash from environment variable
export const initAuth = async () => {
  const plainPassword = process.env.APP_PASSWORD || 'TrioVault2025!';
  cachedPasswordHash = await bcrypt.hash(plainPassword, 10);
  console.log('[TrioVault Auth] Master password hash initialized securely.');
};

/**
 * Verifies entered password against the configured master password
 */
export const verifyPassword = async (inputPassword) => {
  if (!cachedPasswordHash) {
    await initAuth();
  }
  if (!inputPassword) return false;
  return await bcrypt.compare(inputPassword, cachedPasswordHash);
};

/**
 * Generates a signed session token
 */
export const createSessionToken = () => {
  return jwt.sign(
    {
      authenticated: true,
      timestamp: Date.now(),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verifies an incoming session token
 */
export const verifySessionToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  };
};

export { SESSION_COOKIE_NAME };
