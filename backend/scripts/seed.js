import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { dbService, PREDEFINED_FOLDERS } from '../services/dbStore.js';
import { initAuth } from '../services/authService.js';

const runSeed = async () => {
  console.log('[TrioVault Seed] Starting database initialization...');
  await connectDB();
  await initAuth();
  await dbService.seedPredefinedFolders();

  console.log('[TrioVault Seed] The following predefined folders are ensured:');
  PREDEFINED_FOLDERS.forEach((f, idx) => {
    console.log(`  ${idx + 1}. [${f.folderId}] ${f.folderName}`);
  });

  console.log('[TrioVault Seed] Database seed completed successfully.');
  process.exit(0);
};

runSeed().catch((err) => {
  console.error('[TrioVault Seed] Error seeding database:', err);
  process.exit(1);
});
