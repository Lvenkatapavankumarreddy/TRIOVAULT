import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/dbStore.js';
import { storageService } from '../services/storageService.js';
import { getFileCategory, sanitizeFileName } from '../utils/fileHelpers.js';

export const uploadFiles = async (req, res) => {
  try {
    const folderId = req.body.folderId || req.query.folderId;

    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: 'Folder ID is required for file uploads.',
      });
    }

    const folder = await dbService.getFolderById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: `Target folder '${folderId}' does not exist.`,
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were provided for upload.',
      });
    }

    const uploadedRecords = [];

    for (const file of req.files) {
      const fileId = uuidv4();
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const cleanBaseName = sanitizeFileName(baseName);
      const storedFileName = `${cleanBaseName}_${fileId.slice(0, 8)}${ext}`;
      const fileType = getFileCategory(file.originalname, file.mimetype);

      // Upload to Supabase Storage (or fallback)
      const uploadResult = await storageService.uploadFile({
        folderId,
        storedFileName,
        buffer: file.buffer,
        mimeType: file.mimetype,
      });

      // Save file metadata
      const fileDoc = await dbService.createFile({
        fileId,
        originalName: file.originalname,
        storedFileName,
        storagePath: uploadResult.storagePath,
        storageProvider: uploadResult.storageProvider,
        mimeType: file.mimetype,
        fileType,
        fileSize: file.size,
        folderId,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      });

      // Log upload activity
      await dbService.logActivity({
        activityId: uuidv4(),
        action: 'upload',
        fileName: file.originalname,
        fileId,
        folderId,
        folderName: folder.folderName,
        description: `Uploaded file: ${file.originalname}`,
        timestamp: new Date(),
      });

      uploadedRecords.push(fileDoc);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully uploaded ${uploadedRecords.length} file(s).`,
      data: uploadedRecords,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'File upload failed.',
    });
  }
};

export const getFilesByFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { search, type, sortBy = 'date', order = 'desc' } = req.query;

    const folder = await dbService.getFolderById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.',
      });
    }

    let files = await dbService.getFilesByFolder(folderId);

    // Filter by search query
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      files = files.filter(f => f.originalName.toLowerCase().includes(q));
    }

    // Filter by fileType
    if (type && type !== 'all') {
      files = files.filter(f => f.fileType === type);
    }

    // Sort files
    files.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.originalName.localeCompare(b.originalName);
      } else if (sortBy === 'size') {
        comparison = a.fileSize - b.fileSize;
      } else {
        // default date
        comparison = new Date(a.uploadedAt) - new Date(b.uploadedAt);
      }
      return order === 'asc' ? comparison : -comparison;
    });

    return res.status(200).json({
      success: true,
      folder,
      count: files.length,
      data: files,
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve files.',
    });
  }
};

export const getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await dbService.getFileById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error('Error getting file details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve file.',
    });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await dbService.getFileById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
      });
    }

    const folder = await dbService.getFolderById(file.folderId);

    // Audit download activity
    await dbService.logActivity({
      activityId: uuidv4(),
      action: 'download',
      fileName: file.originalName,
      fileId: file.fileId,
      folderId: file.folderId,
      folderName: folder?.folderName || '',
      description: `Downloaded file: ${file.originalName}`,
      timestamp: new Date(),
    });

    // Check if cloud signed URL is available
    if (file.storageProvider === 'supabase') {
      try {
        const signedUrl = await storageService.getFileAccessUrl(
          file.storagePath,
          file.originalName,
          'supabase'
        );
        if (signedUrl) {
          return res.status(200).json({
            success: true,
            downloadUrl: signedUrl,
            directRedirect: false,
          });
        }
      } catch (cloudErr) {
        console.warn('Cloud signed URL generation error, attempting fallback:', cloudErr.message);
      }
    }

    // Local file stream fallback
    const localPath = storageService.getLocalFilePath(file.storagePath);
    if (fs.existsSync(localPath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      return fs.createReadStream(localPath).pipe(res);
    }

    return res.status(404).json({
      success: false,
      message: 'Physical file not located on storage backend.',
    });
  } catch (error) {
    console.error('File download error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download file.',
    });
  }
};

export const previewFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await dbService.getFileById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
      });
    }

    // Supabase signed preview URL
    if (file.storageProvider === 'supabase') {
      try {
        const signedUrl = await storageService.getFileAccessUrl(
          file.storagePath,
          null, // null download param so it renders inline
          'supabase'
        );
        if (signedUrl) {
          if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(200).json({
              success: true,
              previewUrl: signedUrl,
              mimeType: file.mimeType,
              fileType: file.fileType,
              originalName: file.originalName,
            });
          }
          return res.redirect(signedUrl);
        }
      } catch (e) {
        console.warn('Supabase preview URL generation error:', e.message);
      }
    }

    // Local stream inline preview
    const localPath = storageService.getLocalFilePath(file.storagePath);
    if (fs.existsSync(localPath)) {
      // Determine content type
      let contentType = file.mimeType || 'application/octet-stream';
      const lowerName = file.originalName.toLowerCase();
      if (lowerName.endsWith('.pdf')) contentType = 'application/pdf';
      else if (lowerName.endsWith('.png')) contentType = 'image/png';
      else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (lowerName.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (lowerName.endsWith('.webp')) contentType = 'image/webp';
      else if (lowerName.endsWith('.gif')) contentType = 'image/gif';
      else if (lowerName.endsWith('.mp4')) contentType = 'video/mp4';
      else if (lowerName.endsWith('.webm')) contentType = 'video/webm';
      else if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.log')) contentType = 'text/plain; charset=utf-8';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
      return fs.createReadStream(localPath).pipe(res);
    }

    return res.status(404).json({
      success: false,
      message: 'Physical file preview not available.',
    });
  } catch (error) {
    console.error('File preview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate preview.',
    });
  }
};

export const renameFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newName } = req.body;

    if (!newName || newName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A valid new file name is required.',
      });
    }

    const file = await dbService.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
      });
    }

    const oldName = file.originalName;
    // Retain extension if user omitted it
    let cleanNewName = newName.trim();
    const originalExt = path.extname(oldName);
    if (!path.extname(cleanNewName) && originalExt) {
      cleanNewName += originalExt;
    }

    const updated = await dbService.renameFile(fileId, cleanNewName);
    const folder = await dbService.getFolderById(file.folderId);

    // Audit log
    await dbService.logActivity({
      activityId: uuidv4(),
      action: 'rename',
      fileName: cleanNewName,
      fileId,
      folderId: file.folderId,
      folderName: folder?.folderName || '',
      description: `Renamed '${oldName}' to '${cleanNewName}'`,
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'File renamed successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Rename file error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to rename file.',
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await dbService.getFileById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
      });
    }

    const folder = await dbService.getFolderById(file.folderId);

    // 1. Delete from cloud storage / local storage
    await storageService.deleteFile(file.storagePath, file.storageProvider);

    // 2. Delete from database
    await dbService.deleteFile(fileId);

    // 3. Log delete activity
    await dbService.logActivity({
      activityId: uuidv4(),
      action: 'delete',
      fileName: file.originalName,
      fileId,
      folderId: file.folderId,
      folderName: folder?.folderName || '',
      description: `Deleted file: ${file.originalName}`,
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'File deleted permanently.',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file.',
    });
  }
};

