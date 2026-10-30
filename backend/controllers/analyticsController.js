import { dbService } from '../services/dbStore.js';
import { formatBytes } from '../utils/fileHelpers.js';

export const getAnalyticsOverview = async (req, res) => {
  try {
    const folders = await dbService.getFolders();
    const files = await dbService.getAllFiles();

    const totalFiles = files.length;
    const totalStorageBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

    // Distribution by file category
    const categoryStats = {
      image: { count: 0, size: 0 },
      document: { count: 0, size: 0 },
      video: { count: 0, size: 0 },
      archive: { count: 0, size: 0 },
      other: { count: 0, size: 0 },
    };

    files.forEach(f => {
      const type = categoryStats[f.fileType] ? f.fileType : 'other';
      categoryStats[type].count += 1;
      categoryStats[type].size += (f.fileSize || 0);
    });

    // Breakdown by friend folder
    const friendUsage = folders.map(f => {
      const folderFiles = files.filter(file => file.folderId === f.folderId);
      const folderSize = folderFiles.reduce((acc, file) => acc + (file.fileSize || 0), 0);
      const percentageOfTotal = totalStorageBytes > 0 
        ? Math.round((folderSize / totalStorageBytes) * 100) 
        : 0;

      return {
        folderId: f.folderId,
        folderName: f.folderName,
        totalFiles: folderFiles.length,
        totalBytes: folderSize,
        formattedSize: formatBytes(folderSize),
        percentageOfTotal,
        themeColor: f.themeColor,
      };
    });

    // Recent 5 uploads
    const recentUploads = [...files]
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalFolders: folders.length,
          totalFiles,
          totalStorageBytes,
          formattedTotalStorage: formatBytes(totalStorageBytes),
        },
        categoryStats: {
          images: { ...categoryStats.image, formattedSize: formatBytes(categoryStats.image.size) },
          documents: { ...categoryStats.document, formattedSize: formatBytes(categoryStats.document.size) },
          videos: { ...categoryStats.video, formattedSize: formatBytes(categoryStats.video.size) },
          archives: { ...categoryStats.archive, formattedSize: formatBytes(categoryStats.archive.size) },
          others: { ...categoryStats.other, formattedSize: formatBytes(categoryStats.other.size) },
        },
        friendUsage,
        recentUploads,
      },
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate storage analytics.',
    });
  }
};

