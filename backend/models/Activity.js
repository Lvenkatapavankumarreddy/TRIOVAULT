import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  activityId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['upload', 'download', 'delete', 'rename', 'folder_select', 'unlock', 'lock'],
    index: true,
  },
  fileName: {
    type: String,
    default: '',
  },
  fileId: {
    type: String,
    default: '',
  },
  folderId: {
    type: String,
    default: '',
    index: true,
  },
  folderName: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: true });

export const Activity = mongoose.model('Activity', activitySchema);

