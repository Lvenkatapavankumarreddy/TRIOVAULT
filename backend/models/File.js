import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  storedFileName: {
    type: String,
    required: true,
  },
  storagePath: {
    type: String,
    required: true,
  },
  storageProvider: {
    type: String,
    enum: ['supabase', 'local'],
    default: 'supabase',
  },
  mimeType: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
    enum: ['image', 'document', 'video', 'archive', 'other'],
    index: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  folderId: {
    type: String,
    required: true,
    index: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export const FileModel = mongoose.model('File', fileSchema);

