import { verifySessionToken, SESSION_COOKIE_NAME } from '../services/authService.js';

export const requireAuth = (req, res, next) => {
  // Check cookie first
  let token = req.cookies?.[SESSION_COOKIE_NAME];

  // Optional Authorization header fallback
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please unlock TrioVault to continue.',
      code: 'AUTH_REQUIRED',
    });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Session has expired or is invalid. Please unlock again.',
      code: 'SESSION_EXPIRED',
    });
  }

  req.sessionUser = payload;
  next();
};
