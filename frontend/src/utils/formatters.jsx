import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Archive,
  FileCode,
  FileSpreadsheet,
  FileQuestion,
  FileCheck,
} from 'lucide-react';

export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'No activity';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return formatDate(dateStr);
};

export const getFileIcon = (fileType, mimeType = '', className = 'w-5 h-5') => {
  switch (fileType) {
    case 'image':
      return <ImageIcon className={`${className} text-sky-500`} />;
    case 'video':
      return <VideoIcon className={`${className} text-rose-500`} />;
    case 'document':
      if (mimeType.includes('pdf')) {
        return <FileText className={`${className} text-red-500`} />;
      }
      if (mimeType.includes('sheet') || mimeType.includes('excel')) {
        return <FileSpreadsheet className={`${className} text-emerald-500`} />;
      }
      return <FileText className={`${className} text-blue-500`} />;
    case 'archive':
      return <Archive className={`${className} text-amber-500`} />;
    default:
      return <FileQuestion className={`${className} text-slate-400`} />;
  }
};
