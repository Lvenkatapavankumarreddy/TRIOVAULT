import { Router } from 'express';
import { getAnalyticsOverview } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/overview', getAnalyticsOverview);

export default router;

