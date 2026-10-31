import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { getSupabaseClient, isSupabaseConfigured, SUPABASE_BUCKET } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

let gridFsBucket = null;

export const storageService = {
  /**
   * Returns active GridFSBucket instance if MongoDB is connected
   */
  getGridFSBucket() {
    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      if (!gridFsBucket) {
        gridFsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
          bucketName: 'vault_files',
        });
      }
      return gridFsBucket;
    }
    return null;
  },

  /**
   * Upload file to Supabase Storage, MongoDB GridFS, or local disk fallback
   */
  async uploadFile({ folderId, storedFileName, buffer, mimeType, originalName, fileId }) {
    const storagePath = `${folderId}/${storedFileName}`;

    // 1. Supabase Storage (if configured by user)
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (!error && data?.path) {
          return {
            storageProvider: 'supabase',
            storagePath: data.path,
          };
        }
        console.warn('[TrioVault Storage] Supabase upload failed, falling back to GridFS:', error?.message);
      } catch (err) {
        console.warn('[TrioVault Storage] Supabase exception, falling back to GridFS:', err.message);
      }
    }

    // 2. MongoDB GridFS Storage (Permanent cloud storage in Atlas cluster)
    const bucket = this.getGridFSBucket();
    if (bucket) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = bucket.openUploadStream(storedFileName, {
            contentType: mimeType,
            metadata: {
              folderId,
              originalName: originalName || storedFileName,
              fileId: fileId || '',
              storagePath,
            },
          });

          const streamId = uploadStream.id;

          uploadStream.on('error', (err) => {
            console.error('[TrioVault Storage] GridFS stream error:', err.message);
            reject(err);
          });

          uploadStream.on('finish', () => {
            resolve({
              storageProvider: 'gridfs',
              storagePath: storedFileName,
              gridFsId: streamId,
            });
          });

          uploadStream.end(buffer);
        });

        console.log(`[TrioVault Storage] Saved file permanently to MongoDB Atlas GridFS: ${storedFileName}`);
        return uploadResult;
      } catch (gridFsError) {
        console.warn('[TrioVault Storage] GridFS write failed, falling back to local storage:', gridFsError.message);
      }
    }

    // 3. Local disk fallback
    const targetDir = path.join(LOCAL_UPLOADS_DIR, folderId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const localFilePath = path.join(targetDir, storedFileName);
    await fs.promises.writeFile(localFilePath, buffer);

    return {
      storageProvider: 'local',
      storagePath,
    };
  },

  /**
   * Delete file from Supabase, GridFS, or local disk
   */
  async deleteFile(storagePath, storageProvider = 'gridfs', gridFsId = null) {
    if (storageProvider === 'supabase' && isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      const { error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .remove([storagePath]);

      if (error) {
        console.warn(`[TrioVault Storage] Cloud delete error for ${storagePath}:`, error.message);
      }
      return;
    }

    if (storageProvider === 'gridfs') {
      const bucket = this.getGridFSBucket();
      if (bucket) {
        try {
          if (gridFsId) {
            await bucket.delete(new mongoose.Types.ObjectId(gridFsId));
          } else {
            const files = await bucket.find({ filename: storagePath }).toArray();
            for (const f of files) {
              await bucket.delete(f._id);
            }
          }
        } catch (e) {
          console.warn(`[TrioVault Storage] GridFS delete error for ${storagePath}:`, e.message);
        }
      }
      return;
    }

    const localFilePath = path.join(LOCAL_UPLOADS_DIR, storagePath);
    if (fs.existsSync(localFilePath)) {
      try {
        await fs.promises.unlink(localFilePath);
      } catch (e) {
        console.warn(`[TrioVault Storage] Local file delete error: ${e.message}`);
      }
    }
  },

  /**
   * Generate short-lived signed URL for Supabase download
   */
  async getFileAccessUrl(storagePath, originalName, storageProvider = 'supabase') {
    if (storageProvider === 'supabase' && isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .createSignedUrl(storagePath, 300, {
          download: originalName || true,
        });

      if (error || !data?.signedUrl) {
        throw new Error(`Failed to generate signed download URL: ${error?.message}`);
      }
      return data.signedUrl;
    }
    return null;
  },

  /**
   * For local fallback: get the absolute path on disk
   */
  getLocalFilePath(storagePath) {
    return path.join(LOCAL_UPLOADS_DIR, storagePath);
  }
};
