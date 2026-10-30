import { Router } from 'express';
import {
  uploadFiles,
  getFilesByFolder,
  getFileById,
  downloadFile,
  previewFile,
  renameFile,
  deleteFile,
} from '../controllers/fileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// All file routes require authenticated session
router.use(requireAuth);

router.post('/upload', upload.array('files', 10), uploadFiles);
router.get('/:folderId', getFilesByFolder);
router.get('/file/:fileId', getFileById);
router.get('/:fileId/download', downloadFile);
router.get('/:fileId/preview', previewFile);
router.put('/:fileId/rename', renameFile);
router.delete('/:fileId', deleteFile);

export default router;
