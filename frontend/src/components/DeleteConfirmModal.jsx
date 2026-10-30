import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';
import { fileApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export const DeleteConfirmModal = ({ isOpen, onClose, file, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  if (!isOpen || !file) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fileApi.deleteFile(file.fileId);
      toast.success(`Deleted "${file.originalName}" permanently`);
      onDeleteSuccess(file.fileId);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete file from cloud storage.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete File Permanently?</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{file.originalName}"</span>?
          </p>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
            This action cannot be undone. The file will be immediately purged from Supabase Storage and database records.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

