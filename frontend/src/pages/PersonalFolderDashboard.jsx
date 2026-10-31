import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Search,
  Grid,
  List,
  SlidersHorizontal,
  HardDrive,
  Files,
  Image as ImageIcon,
  FileText,
  Video,
  Archive,
  MoreVertical,
  Download,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  Calendar,
  Sparkles,
  RefreshCw,
  FolderSync,
} from 'lucide-react';
import { folderApi, fileApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import { UploadModal } from '../components/UploadModal';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { RenameModal } from '../components/RenameModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { formatBytes, formatDate, getFileIcon } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export const PersonalFolderDashboard = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [folder, setFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'name' | 'size'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [renamingFile, setRenamingFile] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const [activeMenuFileId, setActiveMenuFileId] = useState(null);

  const loadFolderData = async () => {
    try {
      setLoading(true);
      const [folderRes, filesRes] = await Promise.all([
        folderApi.getFolderById(folderId, true),
        fileApi.getFilesByFolder(folderId),
      ]);

      if (folderRes.data?.success) {
        setFolder(folderRes.data.data);
      }
      if (filesRes.data?.success) {
        setFiles(filesRes.data.data);
      }
    } catch (err) {
      console.error('Error loading folder dashboard:', err);
      toast.error('Failed to load folder data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolderData();
  }, [folderId]);

  // Close open dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuFileId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Filtered and sorted files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesSearch = file.originalName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesType =
          selectedType === 'all' || file.fileType === selectedType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') {
          comp = a.originalName.localeCompare(b.originalName);
        } else if (sortBy === 'size') {
          comp = a.fileSize - b.fileSize;
        } else {
          comp = new Date(a.uploadedAt) - new Date(b.uploadedAt);
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [files, searchQuery, selectedType, sortBy, sortOrder]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const totalSize = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
    const imagesCount = files.filter((f) => f.fileType === 'image').length;
    const docsCount = files.filter((f) => f.fileType === 'document').length;
    const videosCount = files.filter((f) => f.fileType === 'video').length;
    const archivesCount = files.filter((f) => f.fileType === 'archive').length;

    return {
      totalFiles: files.length,
      totalSize,
      imagesCount,
      docsCount,
      videosCount,
      archivesCount,
    };
  }, [files]);

  const handleDownload = async (file) => {
    try {
      const res = await fileApi.downloadFile(file.fileId);
      if (res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank');
      } else {
        const token = sessionStorage.getItem('triovault_token');
        const apiBase = import.meta.env.VITE_API_URL || '/api';
        const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
        window.location.href = `${cleanBase}/files/${file.fileId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      }
      toast.success(`Downloading ${file.originalName}`);
    } catch (err) {
      toast.error('Download error. Please check storage connection.');
    }
  };

  const handleRenameSuccess = (updatedFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.fileId === updatedFile.fileId ? { ...f, originalName: updatedFile.originalName } : f))
    );
  };

  const handleDeleteSuccess = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar currentFolderName={folder?.folderName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Breadcrumb & Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                All Vaults
              </Link>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400">{folder?.avatar || 'Vault'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <span>{folder?.folderName || 'Loading Vault...'}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Folders</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Files</span>
            </button>
          </div>
        </div>

        {/* 4 Storage Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Files className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Files</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.totalFiles}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Storage Used</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{formatBytes(stats.totalSize)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Images</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.imagesCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Documents</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.docsCount}</p>
            </div>
          </div>

        </div>

        {/* File Management Controls: Search, Filter, Sort, View */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files in this vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Sort & View Mode Controls */}
            <div className="flex items-center gap-2">
              
              {/* Sort by dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSort, newOrder] = e.target.value.split('-');
                    setSortBy(newSort);
                    setSortOrder(newOrder);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="name-asc">Name (A - Z)</option>
                  <option value="name-desc">Name (Z - A)</option>
                  <option value="size-desc">Largest Size</option>
                  <option value="size-asc">Smallest Size</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Files', count: files.length },
              { id: 'image', label: 'Images', count: stats.imagesCount },
              { id: 'document', label: 'Documents', count: stats.docsCount },
              { id: 'video', label: 'Videos', count: stats.videosCount },
              { id: 'archive', label: 'Archives', count: stats.archivesCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedType === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedType === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

        </div>

        {/* Files Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Files className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {searchQuery ? 'No matching files found' : 'No files in this vault yet'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms or filter settings.'
                : 'Start storing your documents, images, and videos safely in this personal space.'}
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Your First File</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.fileId}
                onClick={() => setPreviewFile(file)}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                {/* File Thumbnail / Icon */}
                <div className="w-full h-36 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center mb-3 relative overflow-hidden group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition">
                  {file.fileType === 'image' && file.storagePath ? (
                    <div className="flex items-center justify-center w-full h-full text-blue-500">
                      {getFileIcon(file.fileType, file.mimeType, 'w-12 h-12')}
                    </div>
                  ) : (
                    getFileIcon(file.fileType, file.mimeType, 'w-12 h-12')
                  )}

                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(file);
                      }}
                      className="p-2 rounded-lg bg-white/90 text-slate-800 hover:bg-white shadow transition"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}
                      className="p-2 rounded-lg bg-white/90 text-slate-800 hover:bg-white shadow transition"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* File Details */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex-1" title={file.originalName}>
                      {file.originalName}
                    </p>

                    {/* Action Dropdown Menu */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() =>
                          setActiveMenuFileId(activeMenuFileId === file.fileId ? null : file.fileId)
                        }
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuFileId === file.fileId && (
                        <div className="absolute right-0 top-6 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-20 text-xs font-medium">
                          <button
                            onClick={() => {
                              setActiveMenuFileId(null);
                              setPreviewFile(file);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuFileId(null);
                              handleDownload(file);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuFileId(null);
                              setRenamingFile(file);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                            <span>Rename</span>
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                          <button
                            onClick={() => {
                              setActiveMenuFileId(null);
                              setDeletingFile(file);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span>{formatBytes(file.fileSize)}</span>
                    <span>{formatDate(file.uploadedAt).split(',')[0]}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="py-3.5 pl-6 pr-3">Name</th>
                    <th className="py-3.5 px-3">Type</th>
                    <th className="py-3.5 px-3">Size</th>
                    <th className="py-3.5 px-3">Date Uploaded</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.fileId}
                      onClick={() => setPreviewFile(file)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 pl-6 pr-3">
                        <div className="flex items-center gap-3 truncate max-w-sm sm:max-w-md">
                          {getFileIcon(file.fileType, file.mimeType, 'w-5 h-5 flex-shrink-0')}
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {file.originalName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {file.fileType}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-300">
                        {formatBytes(file.fileSize)}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(file.uploadedAt)}
                      </td>
                      <td className="py-3 pl-3 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRenamingFile(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Rename"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingFile(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        folderId={folderId}
        folderName={folder?.folderName || ''}
        onUploadSuccess={loadFolderData}
      />

      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      <RenameModal
        isOpen={Boolean(renamingFile)}
        onClose={() => setRenamingFile(null)}
        file={renamingFile}
        onRenameSuccess={handleRenameSuccess}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingFile)}
        onClose={() => setDeletingFile(null)}
        file={deletingFile}
        onDeleteSuccess={handleDeleteSuccess}
      />

    </div>
  );
};

