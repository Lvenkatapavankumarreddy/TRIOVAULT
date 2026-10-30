import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  folderId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  folderName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: 'Personal Vault',
  },
  avatar: {
    type: String,
    default: '',
  },
  themeColor: {
    type: String,
    default: 'blue',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export const Folder = mongoose.model('Folder', folderSchema);
