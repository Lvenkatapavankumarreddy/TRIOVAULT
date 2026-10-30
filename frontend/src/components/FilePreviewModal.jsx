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
} from 'lucide-react';
import { fileApi } from '../services/api';
import { formatBytes, formatDate, getFileIcon } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export const FilePreviewModal = ({ isOpen, onClose, file }) => {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!isOpen || !file) {
      setPreviewData(null);
      setTextContent('');
      setErrorMsg('');
      setLoading(true);
      return;
    }

    const loadPreview = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fileApi.previewFile(file.fileId);
        if (res.data?.previewUrl) {
          setPreviewData(res.data);
          // If text file, fetch text directly for syntax highlighting display
          if (file.fileType === 'document' && (file.mimeType.startsWith('text/') || file.originalName.endsWith('.txt') || file.originalName.endsWith('.md'))) {
            try {
              const textRes = await fetch(res.data.previewUrl);
              const text = await textRes.text();
              setTextContent(text);
            } catch (err) {
              console.warn('Could not parse text stream:', err);
            }
          }
        }
      } catch (err) {
        console.error('Preview error:', err);
        setErrorMsg('In-browser preview is not available or timed out.');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const handleDownload = async () => {
    try {
      const res = await fileApi.downloadFile(file.fileId);
      if (res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank');
      } else {
        // Direct stream
        window.location.href = `/api/files/${file.fileId}/download`;
      }
      toast.success(`Starting download for ${file.originalName}`);
    } catch (err) {
      toast.error('Failed to trigger file download.');
    }
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

    if (errorMsg || !previewData?.previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {getFileIcon(file.fileType, file.mimeType, 'w-8 h-8')}
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Preview not available for this file type
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              This file format cannot be rendered directly in the browser. You can download the file to inspect its contents.
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

    const { previewUrl } = previewData;

    // 1. Image Preview
    if (file.fileType === 'image') {
      return (
        <div className="flex items-center justify-center p-4 max-h-[70vh] overflow-auto">
          <img
            src={previewUrl}
            alt={file.originalName}
            className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md transition-transform"
          />
        </div>
      );
    }

    // 2. Video Preview
    if (file.fileType === 'video') {
      return (
        <div className="flex items-center justify-center p-4 max-h-[70vh]">
          <video
            controls
            autoPlay
            src={previewUrl}
            className="max-h-[65vh] max-w-full rounded-lg shadow-lg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // 3. PDF Preview
    if (file.mimeType.includes('pdf') || file.originalName.toLowerCase().endsWith('.pdf')) {
      return (
        <div className="w-full h-[70vh] bg-slate-100 dark:bg-slate-800 rounded-b-xl overflow-hidden">
          <iframe
            src={`${previewUrl}#toolbar=1`}
            title={file.originalName}
            className="w-full h-full border-0"
          />
        </div>
      );
    }

    // 4. Text Preview
    if (textContent) {
      return (
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <pre className="font-mono text-xs sm:text-sm bg-slate-100 dark:bg-slate-950 p-4 rounded-xl text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed border border-slate-200 dark:border-slate-800">
            {textContent}
          </pre>
        </div>
      );
    }

    // Unsupported fallback
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          {getFileIcon(file.fileType, file.mimeType, 'w-8 h-8')}
        </div>
        <div>
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {file.originalName}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Size: {formatBytes(file.fileSize)} • Type: {file.fileType}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Download to View</span>
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
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

