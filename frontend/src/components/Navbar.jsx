import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Sun,
  Moon,
  Lock,
  PieChart,
  History,
  FolderTree,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar = ({ currentFolderName = null }) => {
  const { lock } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLock = async () => {
    await lock();
    navigate('/unlock');
  };

  const isLinkActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/folder');
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                Trio<span className="text-blue-600 dark:text-blue-400">Vault</span>
              </span>
              <span className="text-[10px] block font-medium tracking-wider uppercase text-slate-400 dark:text-slate-500">
                Shared Cloud Storage
              </span>
            </div>
          </Link>

          {currentFolderName && (
            <div className="hidden sm:flex items-center gap-2 pl-3 ml-2 border-l border-slate-200 dark:border-slate-800 text-sm">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {currentFolderName}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isLinkActive('/')
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span className="hidden md:inline">Vaults</span>
          </Link>

          <Link
            to="/analytics"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isLinkActive('/analytics')
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span className="hidden md:inline">Analytics</span>
          </Link>

          <Link
            to="/activity"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isLinkActive('/activity')
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Audit Trail</span>
          </Link>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 sm:mx-2" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Lock Website Button */}
          <button
            onClick={handleLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition border border-rose-200/60 dark:border-rose-900/40"
            title="Lock TrioVault Session"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </nav>

      </div>
    </header>
  );
};

