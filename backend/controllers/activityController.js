import { dbService } from '../services/dbStore.js';

export const getActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const activities = await dbService.getActivities(null, limit);

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve activities.',
    });
  }
};

export const getFolderActivities = async (req, res) => {
  try {
    const { folderId } = req.params;
    const limit = parseInt(req.query.limit || '50', 10);

    const folder = await dbService.getFolderById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.',
      });
    }

    const activities = await dbService.getActivities(folderId, limit);

    return res.status(200).json({
      success: true,
      folder,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error('Error fetching folder activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve folder activities.',
    });
  }
};
