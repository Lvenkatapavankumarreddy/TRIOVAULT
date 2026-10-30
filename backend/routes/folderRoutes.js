import { Router } from 'express';
import { getFolders, getFolderById, getFolderStats } from '../controllers/folderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All folder routes require valid unlocked session
router.use(requireAuth);

router.get('/', getFolders);
router.get('/:folderId', getFolderById);
router.get('/:folderId/stats', getFolderStats);

export default router;

