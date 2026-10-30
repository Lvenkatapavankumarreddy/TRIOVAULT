import { Router } from 'express';
import { getActivities, getFolderActivities } from '../controllers/activityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getActivities);
router.get('/:folderId', getFolderActivities);

export default router;
