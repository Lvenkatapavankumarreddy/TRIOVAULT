import { verifySessionToken, SESSION_COOKIE_NAME } from '../services/authService.js';

export const requireAuth = (req, res, next) => {
  // 1. Check HTTP-only cookie
  let token = req.cookies?.[SESSION_COOKIE_NAME];

  // 2. Check Authorization header (Bearer token)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 3. Check query parameter token (for cross-domain <img>, <video>, <iframe>, downloads)
  if (!token && req.query.token) {
    token = req.query.token;
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

