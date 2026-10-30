import {
  verifyPassword,
  createSessionToken,
  getCookieOptions,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from '../services/authService.js';
import { dbService } from '../services/dbStore.js';
import { v4 as uuidv4 } from 'uuid';

export const unlockVault = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to unlock TrioVault.',
      });
    }

    const isValid = await verifyPassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Access denied.',
      });
    }

    const token = createSessionToken();
    const cookieOptions = getCookieOptions();

    res.cookie(SESSION_COOKIE_NAME, token, cookieOptions);

    // Audit log
    await dbService.logActivity({
      activityId: uuidv4(),
      action: 'unlock',
      description: 'Vault unlocked successfully',
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Vault unlocked successfully.',
    });
  } catch (error) {
    console.error('Unlock error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal error occurred during verification.',
    });
  }
};

export const lockVault = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });

    await dbService.logActivity({
      activityId: uuidv4(),
      action: 'lock',
      description: 'Vault locked manually',
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Vault locked successfully.',
    });
  } catch (error) {
    console.error('Lock error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to lock vault.',
    });
  }
};

export const getSessionStatus = async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(200).json({ authenticated: false });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(200).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    expiresAt: new Date(payload.exp * 1000),
  });
};

