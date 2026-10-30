import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { initAuth } from './services/authService.js';
import { dbService } from './services/dbStore.js';

import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 1. Security & Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Allows inline previews for PDFs/images
  })
);

// 2. CORS configuration
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow during dev/preview
    },
    credentials: true,
  })
);

// 3. Body & Cookie Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// 4. API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'TrioVault API',
    timestamp: new Date().toISOString(),
  });
});

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/analytics', analyticsRoutes);

// 6. Global 404 Route
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error('[TrioVault Server Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
  });
});

import { fileURLToPath } from 'url';

// 8. Bootstrap and Listen
export const startServer = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Connect Database
      await connectDB();

      // Initialize Auth
      await initAuth();

      // Seed predefined folders automatically on initialization
      await dbService.seedPredefinedFolders();

      const server = app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`  🚀 TrioVault Backend Server is running!`);
        console.log(`  📡 Port: ${PORT}`);
        console.log(`  🔗 Health Check: http://localhost:${PORT}/api/health`);
        console.log(`  🛡️ Auth Master Password: [Configured via APP_PASSWORD]`);
        console.log(`===============================================`);
        resolve(server);
      });
      server.on('error', reject);
    } catch (error) {
      console.error('Failed to start TrioVault backend server:', error);
      reject(error);
    }
  });
};

export { app };

// If executed directly, run startServer
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  startServer().catch(() => process.exit(1));
}
