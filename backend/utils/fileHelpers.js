import path from 'path';

/**
 * Categorize MIME types and extensions into: image, document, video, archive, other
 */
export const getFileCategory = (filename, mimeType = '') => {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  const lowerMime = mimeType.toLowerCase();

  // Images
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tiff'];
  if (lowerMime.startsWith('image/') || imageExts.includes(ext)) {
    return 'image';
  }

  // Videos
  const videoExts = ['mp4', 'mov', 'webm', 'mkv', 'avi', 'wmv', 'flv'];
  if (lowerMime.startsWith('video/') || videoExts.includes(ext)) {
    return 'video';
  }

  // Documents
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'rtf', 'odt', 'ods', 'odp', 'md'];
  if (
    lowerMime.includes('pdf') ||
    lowerMime.includes('word') ||
    lowerMime.includes('excel') ||
    lowerMime.includes('spreadsheet') ||
    lowerMime.includes('presentation') ||
    lowerMime.includes('powerpoint') ||
    lowerMime.startsWith('text/') ||
    docExts.includes(ext)
  ) {
    return 'document';
  }

  // Archives
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
  if (
    lowerMime.includes('zip') ||
    lowerMime.includes('tar') ||
    lowerMime.includes('compressed') ||
    archiveExts.includes(ext)
  ) {
    return 'archive';
  }

  return 'other';
};

/**
 * Format bytes to readable string (B, KB, MB, GB)
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Sanitize filename to prevent directory traversal and special character issues
 */
export const sanitizeFileName = (fileName) => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

