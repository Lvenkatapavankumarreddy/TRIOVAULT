import multer from 'multer';

// Use memory storage for direct upload stream to Supabase or local writer
const storage = multer.memoryStorage();

// Max file size in bytes (default: 500MB)
const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '500', 10);
const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

export const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
    files: 10, // Max 10 files per batch upload
  },
  fileFilter: (req, file, cb) => {
    // Basic sanity check - reject executable scripts if necessary
    const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs'];
    const lowerName = file.originalname.toLowerCase();
    const isBlocked = blockedExtensions.some(ext => lowerName.endsWith(ext));

    if (isBlocked) {
      return cb(new Error('Executable file types are restricted for security reasons.'));
    }
    cb(null, true);
  },
});

