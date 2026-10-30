import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Upload,
  Download,
  Trash2,
  Edit2,
  FolderOpen,
  Lock,
  Unlock,
  ArrowLeft,
  Loader2,
  Filter,
  Calendar,
  File,
} from 'lucide-react';
import { activityApi, folderApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import { formatDate } from '../utils/formatters';

export const ActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [actRes, foldRes] = await Promise.all([
          activityApi.getActivities(100),
          folderApi.getFolders(),
        ]);

        if (actRes.data?.success) {
          setActivities(actRes.data.data);
        }
        if (foldRes.data?.success) {
          setFolders(foldRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching activity history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getActionBadge = (action) => {
    switch (action) {
      case 'upload':
        return {
          icon: <Upload className="w-4 h-4 text-blue-500" />,
          bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
          label: 'Upload',
        };
      case 'download':
        return {
          icon: <Download className="w-4 h-4 text-emerald-500" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
          label: 'Download',
        };
      case 'delete':
        return {
          icon: <Trash2 className="w-4 h-4 text-rose-500" />,
          bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
          label: 'Deletion',
        };
      case 'rename':
        return {
          icon: <Edit2 className="w-4 h-4 text-amber-500" />,
          bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
          label: 'Rename',
        };
      case 'folder_select':
        return {
          icon: <FolderOpen className="w-4 h-4 text-indigo-500" />,
          bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900',
          label: 'Folder Access',
        };
      case 'unlock':
        return {
          icon: <Unlock className="w-4 h-4 text-emerald-500" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
          label: 'Session Unlock',
        };
      case 'lock':
        return {
          icon: <Lock className="w-4 h-4 text-slate-500" />,
          bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          label: 'Session Lock',
        };
      default:
        return {
          icon: <History className="w-4 h-4 text-slate-400" />,
          bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          label: 'Event',
        };
    }
  };

  const filteredActivities = activities.filter((item) => {
    const matchesFolder =
      selectedFolder === 'all' || item.folderId === selectedFolder;
    const matchesAction =
      selectedAction === 'all' || item.action === selectedAction;
    return matchesFolder && matchesAction;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span>Security</span>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400">Activity History</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <History className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              <span>Vault Audit Trail</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Complete chronological audit trail identified by target workspace folder.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Vaults</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6 flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by:</span>
          </div>

          {/* Folder filter */}
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Vault Folders</option>
            {folders.map((f) => (
              <option key={f.folderId} value={f.folderId}>
                {f.folderName}
              </option>
            ))}
          </select>

          {/* Action filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="upload">Uploads</option>
            <option value="download">Downloads</option>
            <option value="rename">Renames</option>
            <option value="delete">Deletions</option>
            <option value="folder_select">Folder Visits</option>
            <option value="unlock">Vault Unlocks</option>
            <option value="lock">Vault Locks</option>
          </select>

          <span className="text-xs text-slate-400 ml-auto">
            Showing {filteredActivities.length} event(s)
          </span>
        </div>

        {/* Audit Trail List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading audit history...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <History className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No matching activities logged.</p>
            <p className="text-xs text-slate-500 mt-1">Activities will appear automatically as files are managed.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredActivities.map((act) => {
                const badge = getActionBadge(act.action);

                return (
                  <div
                    key={act.activityId || act._id}
                    className="p-4 sm:px-6 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${badge.bg} flex-shrink-0 mt-0.5 sm:mt-0`}>
                        {badge.icon}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {act.description}
                          </span>
                          {act.folderName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                              {act.folderName}
                            </span>
                          )}
                        </div>

                        {act.fileName && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <File className="w-3 h-3 text-slate-400" />
                            <span className="font-mono">{act.fileName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                        {formatDate(act.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

