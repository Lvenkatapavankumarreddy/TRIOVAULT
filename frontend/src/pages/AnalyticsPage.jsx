import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  HardDrive,
  Files,
  Image as ImageIcon,
  FileText,
  Video,
  Archive,
  Folder,
  ArrowLeft,
  Loader2,
  TrendingUp,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { analyticsApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import { formatBytes, formatDate } from '../utils/formatters';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsApi.getOverview();
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span>Overview</span>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400">Storage Insights</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <PieChart className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <span>Storage Analytics</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Combined real-time storage metrics across all three friend vaults.
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Calculating storage metrics...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-12 text-slate-500">Failed to load analytics.</div>
        ) : (
          <div className="space-y-8">
            
            {/* Top High-level Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <HardDrive className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Total Cloud Storage
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {data.summary.formattedTotalStorage}
                  </h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {data.summary.totalStorageBytes.toLocaleString()} bytes stored
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Files className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Total Files Saved
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {data.summary.totalFiles}
                  </h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Distributed across 3 vaults
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-5 sm:col-span-2 lg:col-span-1">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Provider Quota
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    Optimal
                  </h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Supabase Bucket Storage Active
                  </span>
                </div>
              </div>

            </div>

            {/* Friend Storage Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Storage Usage by Friend</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Storage consumption per predefined friend workspace.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {data.friendUsage.map((item) => (
                  <div key={item.folderId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.folderName}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({item.totalFiles} files)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.formattedSize}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          ({item.percentageOfTotal}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.max(item.percentageOfTotal, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* File Type Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">File Type Distribution</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Breakdown by category across all vaults.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Images</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {data.categoryStats.images.count}
                    </p>
                    <p className="text-xs text-slate-400">{data.categoryStats.images.formattedSize}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Documents</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {data.categoryStats.documents.count}
                    </p>
                    <p className="text-xs text-slate-400">{data.categoryStats.documents.formattedSize}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-slate-800/60 border border-rose-100 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <Video className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Videos</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {data.categoryStats.videos.count}
                    </p>
                    <p className="text-xs text-slate-400">{data.categoryStats.videos.formattedSize}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-800/60 border border-amber-100 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Archive className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Archives</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {data.categoryStats.archives.count}
                    </p>
                    <p className="text-xs text-slate-400">{data.categoryStats.archives.formattedSize}</p>
                  </div>

                </div>
              </div>

              {/* Provider Info Banner */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Cloud Infrastructure Notice</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    TrioVault enforces no synthetic per-folder artificial quotas. All three folders enjoy fair access to the shared hosting space backed by MongoDB Atlas for metadata and Supabase Storage for encrypted file payloads.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <p>• Max single file upload: 50MB</p>
                  <p>• Real-time synchronization active</p>
                  <p>• Zero public bucket exposure</p>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
};

