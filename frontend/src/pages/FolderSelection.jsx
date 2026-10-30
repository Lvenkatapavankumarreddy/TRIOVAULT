import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  FolderOpen,
  ArrowRight,
  HardDrive,
  Files,
  Clock,
  Sparkles,
  PieChart,
  History,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { folderApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import { formatBytes, formatRelativeTime } from '../utils/formatters';

export const FolderSelection = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadFolders = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await folderApi.getFolders();
      if (res.data?.success) {
        setFolders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const getThemeStyling = (color) => {
    switch (color) {
      case 'emerald':
        return {
          gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
          border: 'hover:border-emerald-500/60 dark:hover:border-emerald-500/60',
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
          iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
          button: 'hover:bg-emerald-600 dark:hover:bg-emerald-500',
        };
      case 'amber':
        return {
          gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
          border: 'hover:border-amber-500/60 dark:hover:border-amber-500/60',
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
          iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
          button: 'hover:bg-amber-600 dark:hover:bg-amber-500',
        };
      default: // blue
        return {
          gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
          border: 'hover:border-blue-500/60 dark:hover:border-blue-500/60',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
          iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
          button: 'hover:bg-blue-600 dark:hover:bg-blue-500',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-4 border border-blue-200 dark:border-blue-900">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Private Personal Spaces</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome to TrioVault
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3 font-normal">
            Choose your personal storage space.
          </p>

          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => loadFolders(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
              title="Refresh folder storage statistics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>

        {/* 3 Predefined Folder Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading your vaults...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {folders.map((f) => {
              const styles = getThemeStyling(f.themeColor);
              const stats = f.stats || { totalFiles: 0, totalSize: 0, lastUploadedAt: null };

              return (
                <div
                  key={f.folderId}
                  onClick={() => navigate(`/folder/${f.folderId}`)}
                  className={`group relative rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-7 sm:p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden transform hover:-translate-y-1.5 ${styles.border}`}
                >
                  {/* Subtle top gradient accent */}
                  <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${styles.gradient} pointer-events-none`} />

                  <div>
                    {/* Top row: Folder Icon & Avatar Tag */}
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl ${styles.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                        <Folder className="w-7 h-7" />
                      </div>
                      
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${styles.badge}`}>
                        {f.avatar || 'VAULT'}
                      </span>
                    </div>

                    {/* Friend's Name */}
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {f.folderName}
                    </h2>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                      Permanent Storage ID: <span className="font-mono">{f.folderId}</span>
                    </p>

                    {/* Statistics Row */}
                    <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-100 dark:border-slate-800/80 mb-6 text-sm">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Files className="w-3.5 h-3.5" /> Files
                        </span>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                          {stats.totalFiles}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5" /> Storage
                        </span>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                          {formatBytes(stats.totalSize)}
                        </p>
                      </div>
                    </div>

                    {/* Last Upload Date */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Last upload:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatRelativeTime(stats.lastUploadedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Open Folder CTA Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/folder/${f.folderId}`);
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 dark:bg-slate-800 ${styles.button} shadow-md transition-all duration-200 group-hover:shadow-lg`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Open Folder</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>

                </div>
              );
            })}
          </div>
        )}

        {/* Quick Cross-Vault Navigation Banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/5 via-indigo-900/5 to-slate-900/5 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cross-Vault Storage Overview & Audit
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Inspect total storage consumption by friend or view complete tamper-evident audit history logs.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/analytics')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <PieChart className="w-4 h-4 text-blue-500" />
              <span>Storage Analytics</span>
            </button>

            <button
              onClick={() => navigate('/activity')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <History className="w-4 h-4 text-emerald-500" />
              <span>Activity History</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};
