import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Loader2,
  FileQuestion,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
} from 'lucide-react';
import { fileApi } from '../services/api';
import { formatBytes, formatDate, getFileIcon } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export const FilePreviewModal = ({ isOpen, onClose, file }) => {
  const [loading, setLoading] = useState(true);
  const [textContent, setTextContent] = useState('');
  const [loadError, setLoadError] = useState(false);
  const toast = useToast();

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
  const token = sessionStorage.getItem('triovault_token');
  const previewUrl = file ? `${cleanBase}/files/${file.fileId}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}` : '';

  // Determine file type characteristics
  const lowerName = file?.originalName?.toLowerCase() || '';
  const isImage = file?.fileType === 'image' || ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'].some(ext => lowerName.endsWith(ext));
  const isVideo = file?.fileType === 'video' || ['.mp4', '.webm', '.mov', '.ogg', '.mkv'].some(ext => lowerName.endsWith(ext));
  const isAudio = ['.mp3', '.wav', '.ogg', '.aac', '.m4a'].some(ext => lowerName.endsWith(ext));
  const isPdf = file?.mimeType?.includes('pdf') || lowerName.endsWith('.pdf');
  const isText =
    file?.mimeType?.startsWith('text/') ||
    ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.csv', '.log', '.xml', '.yml', '.yaml', '.py', '.sql', '.env', '.sh'].some(ext => lowerName.endsWith(ext));

  useEffect(() => {
    if (!isOpen || !file) {
      setTextContent('');
      setLoadError(false);
      setLoading(true);
      return;
    }

    setLoading(true);
    setLoadError(false);

    if (isText) {
      // Fetch text content to render in syntax/text box
      fetch(previewUrl, { credentials: 'include' })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load text preview');
          return res.text();
        })
        .then((text) => {
          setTextContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.warn('Text preview fetch error:', err);
          setLoadError(true);
          setLoading(false);
        });
    } else {
      // For images, videos, and PDFs, they load via their HTML tags
      setLoading(false);
    }
  }, [isOpen, file, isText, previewUrl]);

  if (!isOpen || !file) return null;

  const handleDownload = () => {
    toast.success(`Starting download for ${file.originalName}`);
    const token = sessionStorage.getItem('triovault_token');
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    window.location.href = `${cleanBase}/files/${file.fileId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading secure preview...</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {getFileIcon(file.fileType, file.mimeType, 'w-8 h-8')}
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Preview Could Not Be Loaded
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              You can still download this file directly to view it on your device.
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Download File ({formatBytes(file.fileSize)})</span>
          </button>
        </div>
      );
    }

    // 1. Image Preview
    if (isImage) {
      return (
        <div className="flex items-center justify-center p-4 max-h-[72vh] overflow-auto">
          <img
            src={previewUrl}
            alt={file.originalName}
            onError={() => setLoadError(true)}
            className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-lg transition-transform select-none"
          />
        </div>
      );
    }

    // 2. Video Preview
    if (isVideo) {
      return (
        <div className="flex items-center justify-center p-4 max-h-[72vh] bg-black/10 rounded-xl">
          <video
            controls
            autoPlay
            playsInline
            src={previewUrl}
            onError={() => setLoadError(true)}
            className="max-h-[68vh] max-w-full rounded-xl shadow-xl"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // 3. Audio Preview
    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center p-12 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg">
            {getFileIcon(file.fileType, file.mimeType, 'w-10 h-10')}
          </div>
          <div className="text-center">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">{file.originalName}</h4>
            <p className="text-xs text-slate-500 mt-1">{formatBytes(file.fileSize)}</p>
          </div>
          <audio controls src={previewUrl} className="w-full max-w-md shadow-md rounded-full" />
        </div>
      );
    }

    // 4. PDF Preview
    if (isPdf) {
      return (
        <div className="w-full h-[75vh] bg-slate-100 dark:bg-slate-900 rounded-b-xl overflow-hidden">
          <iframe
            src={`${previewUrl}#toolbar=1`}
            title={file.originalName}
            className="w-full h-full border-0"
          />
        </div>
      );
    }

    // 5. Text Preview
    if (isText) {
      return (
        <div className="p-4 max-h-[72vh] overflow-y-auto">
          <pre className="font-mono text-xs sm:text-sm bg-slate-100 dark:bg-slate-950 p-5 rounded-xl text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed border border-slate-200 dark:border-slate-800">
            {textContent || '(Empty file)'}
          </pre>
        </div>
      );
    }

    // 6. Generic Fallback for Binary/Archives (ZIP, RAR, DOCX, XLSX, etc.)
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-md">
          {getFileIcon(file.fileType, file.mimeType, 'w-10 h-10')}
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
            {file.originalName}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Size: {formatBytes(file.fileSize)} • Type: <span className="uppercase">{file.fileType}</span>
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">
            This file type is stored securely. Click below to download and open it in your desktop application.
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition shadow-lg shadow-blue-500/25"
        >
          <Download className="w-4 h-4" />
          <span>Download to Open ({formatBytes(file.fileSize)})</span>
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 truncate max-w-[70%]">
            {getFileIcon(file.fileType, file.mimeType, 'w-5 h-5 flex-shrink-0')}
            <div className="truncate">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {file.originalName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatBytes(file.fileSize)} • Uploaded {formatDate(file.uploadedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-900/50 transition"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50">
          {renderContent()}
        </div>

      </div>
    </div>
  );
};
