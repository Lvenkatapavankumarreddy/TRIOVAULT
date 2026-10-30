import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSupabaseClient, isSupabaseConfigured, SUPABASE_BUCKET } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

export const storageService = {
  /**
   * Upload file to Supabase Storage (or fallback to local disk)
   */
  async uploadFile({ folderId, storedFileName, buffer, mimeType }) {
    const storagePath = `${folderId}/${storedFileName}`;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error('[TrioVault Storage] Supabase upload failed:', error.message);
        throw new Error(`Cloud storage upload failed: ${error.message}`);
      }

      return {
        storageProvider: 'supabase',
        storagePath: data.path,
      };
    } else {
      // Local fallback
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
    }
  },

  /**
   * Delete file from Supabase Storage (or local disk)
   */
  async deleteFile(storagePath, storageProvider = 'supabase') {
    if (storageProvider === 'supabase' && isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      const { error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .remove([storagePath]);

      if (error) {
        console.warn(`[TrioVault Storage] Cloud delete error for ${storagePath}:`, error.message);
      }
    } else {
      const localFilePath = path.join(LOCAL_UPLOADS_DIR, storagePath);
      if (fs.existsSync(localFilePath)) {
        try {
          await fs.promises.unlink(localFilePath);
        } catch (e) {
          console.warn(`[TrioVault Storage] Local file delete error: ${e.message}`);
        }
      }
    }
  },

  /**
   * Generate short-lived signed URL or streaming resource for file download/preview
   */
  async getFileAccessUrl(storagePath, originalName, storageProvider = 'supabase') {
    if (storageProvider === 'supabase' && isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      // 5-minute signed URL
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

    // Local fallback route
    return null;
  },

  /**
   * For local fallback: get the absolute path on disk
   */
  getLocalFilePath(storagePath) {
    return path.join(LOCAL_UPLOADS_DIR, storagePath);
  }
};

