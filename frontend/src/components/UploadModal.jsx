import React, { useState, useRef } from 'react';
import { UploadCloud, X, File, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { fileApi } from '../services/api';
import { formatBytes } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export const UploadModal = ({ isOpen, onClose, folderId, folderName, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const toast = useToast();

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    setErrorMsg('');
    // Max 10 files
    const combined = [...selectedFiles, ...newFiles];
    if (combined.length > 10) {
      setErrorMsg('You can upload a maximum of 10 files in one batch.');
      setSelectedFiles(combined.slice(0, 10));
    } else {
      setSelectedFiles(combined);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one file to upload.');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('folderId', folderId);
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fileApi.uploadFiles(formData, (percent) => {
        setProgress(percent);
      });

      if (response.data?.success) {
        toast.success(`Successfully uploaded ${selectedFiles.length} file(s) to ${folderName}`);
        setSelectedFiles([]);
        setProgress(100);
        setTimeout(() => {
          onUploadSuccess();
          onClose();
        }, 500);
      }
    } catch (err) {
      console.error('Upload failure:', err);
      const msg = err.response?.data?.message || 'File upload failed. Check connection or size.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Files</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uploading to vault: <span className="font-semibold text-blue-600 dark:text-blue-400">{folderName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Drag & drop files here, or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports Images, Documents, Videos, Archives (up to 50MB per file)
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 rounded-lg border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selected Files Queue */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Selected Files ({selectedFiles.length})</span>
                <span>Total: {formatBytes(totalSize)}</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                      <File className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                        ({formatBytes(file.size)})
                      </span>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  Uploading to Supabase Cloud Storage...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

