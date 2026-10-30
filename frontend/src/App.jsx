import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { PasswordScreen } from './pages/PasswordScreen';
import { FolderSelection } from './pages/FolderSelection';
import { PersonalFolderDashboard } from './pages/PersonalFolderDashboard';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ActivityPage } from './pages/ActivityPage';
import { Loader2 } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-3 text-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm font-semibold tracking-wide text-slate-400">Verifying TrioVault Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/unlock" replace />;
  }

  return children;
};

// Public Route (Redirect to home if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-3 text-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm font-semibold tracking-wide text-slate-400">Loading TrioVault...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Password Entry Screen */}
              <Route
                path="/unlock"
                element={
                  <PublicRoute>
                    <PasswordScreen />
                  </PublicRoute>
                }
              />

              {/* Protected 3-Friend Folder Selection Hub */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <FolderSelection />
                  </ProtectedRoute>
                }
              />

              {/* Protected Personal Folder Dashboard */}
              <Route
                path="/folder/:folderId"
                element={
                  <ProtectedRoute>
                    <PersonalFolderDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Storage Analytics */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Activity Audit Trail */}
              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <ActivityPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

