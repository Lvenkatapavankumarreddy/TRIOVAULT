import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { unlockVault, lockVault, getSessionStatus } from '../controllers/authController.js';

const router = Router();

// Rate limiter for unlock attempts to prevent brute force
const unlockLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 unlock attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many unlock attempts. Please wait 15 minutes before trying again.',
  },
});

router.post('/unlock', unlockLimiter, unlockVault);
router.post('/lock', lockVault);
router.get('/session', getSessionStatus);

export default router;

