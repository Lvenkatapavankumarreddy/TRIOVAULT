import { Folder } from '../models/Folder.js';
import { FileModel } from '../models/File.js';
import { Activity } from '../models/Activity.js';
import { getDBStatus } from '../config/db.js';

// In-memory fallback stores
const memoryStore = {
  folders: new Map(),
  files: new Map(),
  activities: [],
};

export const PREDEFINED_FOLDERS = [
  {
    folderId: 'folder-pavan',
    folderName: 'L.V.pavan kumar reddy',
    description: 'Personal secure cloud storage',
    avatar: 'LV',
    themeColor: 'blue',
  },
  {
    folderId: 'folder-haricharan',
    folderName: 'D.hari charan sai vagnash',
    description: 'Personal secure cloud storage',
    avatar: 'DH',
    themeColor: 'emerald',
  },
  {
    folderId: 'folder-deepak',
    folderName: 'K.deepak kumar',
    description: 'Personal secure cloud storage',
    avatar: 'KD',
    themeColor: 'amber',
  },
];

export const dbService = {
  // Folder Operations
  async getFolders() {
    if (getDBStatus()) {
      try {
        return await Folder.find({}).sort({ createdAt: 1 }).lean();
      } catch (e) {
        console.error('MongoDB query error:', e.message);
      }
    }
    return Array.from(memoryStore.folders.values());
  },

  async getFolderById(folderId) {
    if (getDBStatus()) {
      try {
        return await Folder.findOne({ folderId }).lean();
      } catch (e) {
        console.error('MongoDB query error:', e.message);
      }
    }
    return memoryStore.folders.get(folderId) || null;
  },

  async seedPredefinedFolders() {
    for (const item of PREDEFINED_FOLDERS) {
      if (getDBStatus()) {
        try {
          const exists = await Folder.findOne({ folderId: item.folderId });
          if (!exists) {
            await Folder.create(item);
            console.log(`[TrioVault] Initialized folder: ${item.folderName} (${item.folderId})`);
          }
        } catch (e) {
          console.error(`Error checking/creating folder ${item.folderId} in MongoDB:`, e.message);
        }
      }
      if (!memoryStore.folders.has(item.folderId)) {
        memoryStore.folders.set(item.folderId, {
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  },

  // File Operations
  async createFile(fileData) {
    if (getDBStatus()) {
      try {
        const fileDoc = await FileModel.create(fileData);
        // Also keep memory sync
        memoryStore.files.set(fileData.fileId, fileDoc.toObject());
        return fileDoc.toObject();
      } catch (e) {
        console.error('MongoDB createFile error:', e.message);
      }
    }
    const record = { ...fileData, createdAt: new Date(), updatedAt: new Date() };
    memoryStore.files.set(fileData.fileId, record);
    return record;
  },

  async getFilesByFolder(folderId) {
    if (getDBStatus()) {
      try {
        return await FileModel.find({ folderId }).sort({ uploadedAt: -1 }).lean();
      } catch (e) {
        console.error('MongoDB getFilesByFolder error:', e.message);
      }
    }
    return Array.from(memoryStore.files.values())
      .filter(f => f.folderId === folderId)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  },

  async getFileById(fileId) {
    if (getDBStatus()) {
      try {
        return await FileModel.findOne({ fileId }).lean();
      } catch (e) {
        console.error('MongoDB getFileById error:', e.message);
      }
    }
    return memoryStore.files.get(fileId) || null;
  },

  async getAllFiles() {
    if (getDBStatus()) {
      try {
        return await FileModel.find({}).lean();
      } catch (e) {
        console.error('MongoDB getAllFiles error:', e.message);
      }
    }
    return Array.from(memoryStore.files.values());
  },

  async renameFile(fileId, newName) {
    if (getDBStatus()) {
      try {
        const updated = await FileModel.findOneAndUpdate(
          { fileId },
          { originalName: newName, updatedAt: new Date() },
          { new: true }
        ).lean();
        if (updated) {
          memoryStore.files.set(fileId, updated);
          return updated;
        }
      } catch (e) {
        console.error('MongoDB renameFile error:', e.message);
      }
    }
    const existing = memoryStore.files.get(fileId);
    if (!existing) return null;
    existing.originalName = newName;
    existing.updatedAt = new Date();
    memoryStore.files.set(fileId, existing);
    return existing;
  },

  async deleteFile(fileId) {
    if (getDBStatus()) {
      try {
        await FileModel.findOneAndDelete({ fileId });
      } catch (e) {
        console.error('MongoDB deleteFile error:', e.message);
      }
    }
    const existed = memoryStore.files.has(fileId);
    memoryStore.files.delete(fileId);
    return existed;
  },

  // Activity Operations
  async logActivity(data) {
    const activityRecord = {
      ...data,
      timestamp: data.timestamp || new Date(),
    };

    if (getDBStatus()) {
      try {
        await Activity.create(activityRecord);
      } catch (e) {
        console.error('MongoDB logActivity error:', e.message);
      }
    }
    memoryStore.activities.unshift(activityRecord);
    if (memoryStore.activities.length > 200) {
      memoryStore.activities.pop();
    }
    return activityRecord;
  },

  async getActivities(folderId = null, limit = 50) {
    if (getDBStatus()) {
      try {
        const query = folderId ? { folderId } : {};
        return await Activity.find(query).sort({ timestamp: -1 }).limit(limit).lean();
      } catch (e) {
        console.error('MongoDB getActivities error:', e.message);
      }
    }
    let list = memoryStore.activities;
    if (folderId) {
      list = list.filter(a => a.folderId === folderId);
    }
    return list.slice(0, limit);
  },
};
