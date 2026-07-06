/**
 * Data Export Utility
 * Allows users to export their data in various formats
 */

import { 
  getXPHistory, 
  getAchievements, 
  getAssignmentHistory, 
  getAIChatHistory, 
  getActivityFeed,
  getProfileHistory,
  getUserStats
} from '@/lib/cloudDatabase';

/**
 * Export user data as JSON
 */
export async function exportUserDataAsJSON(uid) {
  try {
    const [
      xpHistory,
      achievements,
      assignments,
      aiChats,
      activities,
      profileHistory,
      stats
    ] = await Promise.all([
      getXPHistory(uid, 1000),
      getAchievements(uid),
      getAssignmentHistory(uid, 1000),
      getAIChatHistory(uid, 1000),
      getActivityFeed(uid, 1000),
      getProfileHistory(uid, 1000),
      getUserStats(uid),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      userId: uid,
      profile: stats?.profile || {},
      stats: {
        totalXPEarned: stats?.totalXPEarned || 0,
        achievementCount: stats?.achievementCount || 0,
      },
      xpHistory,
      achievements,
      assignments,
      aiChats,
      activities,
      profileHistory,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (err) {
    console.error('Failed to export user data:', err);
    throw err;
  }
}

/**
 * Export user data as CSV (flattened)
 */
export async function exportUserDataAsCSV(uid) {
  try {
    const [xpHistory, achievements, assignments, aiChats, activities] = await Promise.all([
      getXPHistory(uid, 1000),
      getAchievements(uid),
      getAssignmentHistory(uid, 1000),
      getAIChatHistory(uid, 1000),
      getActivityFeed(uid, 1000),
    ]);

    const csvSections = [];

    // XP History
    csvSections.push('=== XP HISTORY ===');
    csvSections.push('Date,Amount,Source,Description');
    xpHistory.forEach(tx => {
      const date = tx.createdAt ? new Date(tx.createdAt).toISOString() : '';
      csvSections.push(`${date},${tx.amount},${tx.source},"${tx.description || ''}"`);
    });

    // Achievements
    csvSections.push('\n=== ACHIEVEMENTS ===');
    csvSections.push('Unlocked Date,Achievement ID,Name,Description');
    achievements.forEach(ach => {
      const date = ach.unlockedAt ? new Date(ach.unlockedAt).toISOString() : '';
      csvSections.push(`${date},${ach.achievementId},"${ach.name}","${ach.description || ''}"`);
    });

    // Assignments
    csvSections.push('\n=== ASSIGNMENTS ===');
    csvSections.push('Completed Date,Quest ID,Title,Subject,Score');
    assignments.forEach(assignment => {
      const date = assignment.completedAt ? new Date(assignment.completedAt).toISOString() : '';
      csvSections.push(`${date},${assignment.questId || ''},"${assignment.title || ''}","${assignment.subject || ''}",${assignment.score || ''}`);
    });

    // AI Chats
    csvSections.push('\n=== AI CHATS ===');
    csvSections.push('Date,Subject,Prompt,Response');
    aiChats.forEach(chat => {
      const date = chat.createdAt ? new Date(chat.createdAt).toISOString() : '';
      const prompt = (chat.prompt || '').replace(/"/g, '""');
      const response = (chat.response || '').replace(/"/g, '""');
      csvSections.push(`${date},"${chat.subject || ''}","${prompt}","${response}"`);
    });

    // Activities
    csvSections.push('\n=== ACTIVITIES ===');
    csvSections.push('Date,Type,Title,Description');
    activities.forEach(activity => {
      const date = activity.createdAt ? new Date(activity.createdAt).toISOString() : '';
      csvSections.push(`${date},${activity.type},"${activity.title || ''}","${activity.description || ''}"`);
    });

    return csvSections.join('\n');
  } catch (err) {
    console.error('Failed to export user data as CSV:', err);
    throw err;
  }
}

/**
 * Download data as file
 */
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export user data and trigger download
 */
export async function exportUserData(uid, format = 'json') {
  try {
    let content;
    let filename;
    let mimeType;

    const timestamp = new Date().toISOString().split('T')[0];
    const safeUid = uid.replace(/[^a-zA-Z0-9]/g, '_');

    if (format === 'json') {
      content = await exportUserDataAsJSON(uid);
      filename = `studified_data_${safeUid}_${timestamp}.json`;
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = await exportUserDataAsCSV(uid);
      filename = `studified_data_${safeUid}_${timestamp}.csv`;
      mimeType = 'text/csv';
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    downloadFile(content, filename, mimeType);
    return true;
  } catch (err) {
    console.error('Failed to export data:', err);
    return false;
  }
}

/**
 * Get export summary statistics
 */
export async function getExportSummary(uid) {
  try {
    const stats = await getUserStats(uid);
    
    if (!stats) {
      return null;
    }

    return {
      profile: {
        name: stats.profile.full_name || 'Student',
        email: stats.profile.email || '',
        totalXP: stats.profile.total_xp || 0,
        questsCompleted: stats.profile.quests_completed || 0,
        focusHours: stats.profile.focus_hours || 0,
        streakDays: stats.profile.streak_days || 0,
      },
      counts: {
        xpTransactions: stats.xpHistory?.length || 0,
        achievements: stats.achievements?.length || 0,
        assignments: stats.recentAssignments?.length || 0,
        aiChats: 0, // Would need to fetch separately
        activities: stats.recentActivity?.length || 0,
        profileChanges: 0, // Would need to fetch separately
      },
      totals: {
        totalXPEarned: stats.totalXPEarned || 0,
        achievementCount: stats.achievementCount || 0,
      },
    };
  } catch (err) {
    console.error('Failed to get export summary:', err);
    return null;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate export data
 */
export function validateExportData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  if (!data.userId) {
    return { valid: false, error: 'Missing user ID' };
  }

  if (!data.exportDate) {
    return { valid: false, error: 'Missing export date' };
  }

  return { valid: true };
}