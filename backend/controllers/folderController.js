import { dbService } from '../services/dbStore.js';
import { v4 as uuidv4 } from 'uuid';

export const getFolders = async (req, res) => {
  try {
    const folders = await dbService.getFolders();
    const allFiles = await dbService.getAllFiles();

    // Map stats to each folder
    const foldersWithStats = folders.map(folder => {
      const folderFiles = allFiles.filter(f => f.folderId === folder.folderId);
      const totalFiles = folderFiles.length;
      const totalSize = folderFiles.reduce((acc, f) => acc + (f.fileSize || 0), 0);

      // Find latest uploaded file date
      let lastUploadedAt = null;
      if (folderFiles.length > 0) {
        const sorted = [...folderFiles].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        lastUploadedAt = sorted[0].uploadedAt;
      }

      const imagesCount = folderFiles.filter(f => f.fileType === 'image').length;
      const docsCount = folderFiles.filter(f => f.fileType === 'document').length;
      const videosCount = folderFiles.filter(f => f.fileType === 'video').length;
      const archivesCount = folderFiles.filter(f => f.fileType === 'archive').length;
      const othersCount = folderFiles.filter(f => f.fileType === 'other').length;

      return {
        ...folder,
        stats: {
          totalFiles,
          totalSize,
          lastUploadedAt,
          counts: {
            images: imagesCount,
            documents: docsCount,
            videos: videosCount,
            archives: archivesCount,
            others: othersCount,
          }
        }
      };
    });

    return res.status(200).json({
      success: true,
      data: foldersWithStats,
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve folders.',
    });
  }
};

export const getFolderById = async (req, res) => {
  try {
    const { folderId } = req.params;
    const folder = await dbService.getFolderById(folderId);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.',
      });
    }

    // Also log folder selection activity if query param log=true
    if (req.query.logActivity === 'true') {
      await dbService.logActivity({
        activityId: uuidv4(),
        action: 'folder_select',
        folderId: folder.folderId,
        folderName: folder.folderName,
        description: `Accessed folder: ${folder.folderName}`,
        timestamp: new Date(),
      });
    }

    const files = await dbService.getFilesByFolder(folderId);
    const totalSize = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        ...folder,
        stats: {
          totalFiles: files.length,
          totalSize,
          counts: {
            images: files.filter(f => f.fileType === 'image').length,
            documents: files.filter(f => f.fileType === 'document').length,
            videos: files.filter(f => f.fileType === 'video').length,
            archives: files.filter(f => f.fileType === 'archive').length,
            others: files.filter(f => f.fileType === 'other').length,
          }
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving folder details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve folder details.',
    });
  }
};

export const getFolderStats = async (req, res) => {
  try {
    const { folderId } = req.params;
    const folder = await dbService.getFolderById(folderId);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.',
      });
    }

    const files = await dbService.getFilesByFolder(folderId);
    const totalSize = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        folderId,
        folderName: folder.folderName,
        totalFiles: files.length,
        totalSize,
        fileTypeBreakdown: {
          images: files.filter(f => f.fileType === 'image').length,
          documents: files.filter(f => f.fileType === 'document').length,
          videos: files.filter(f => f.fileType === 'video').length,
          archives: files.filter(f => f.fileType === 'archive').length,
          others: files.filter(f => f.fileType === 'other').length,
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving folder stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate folder stats.',
    });
  }
};

