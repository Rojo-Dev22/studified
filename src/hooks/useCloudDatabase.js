import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  saveUserProfile, 
  addXPTransaction, 
  saveAssignmentCompletion, 
  saveAIChat, 
  addActivity,
  getProfileHistory,
  getXPHistory,
  getAchievements,
  getAssignmentHistory,
  getAIChatHistory,
  getActivityFeed,
  getUserStats,
  initializeUserInFirestore,
  syncUserToFirestore,
} from '@/lib/cloudDatabase';
import { useAuth } from '@/lib/AuthContext';

/**
 * Hook for managing user profile with cloud sync
 */
export function useUserProfile() {
  const { firebaseUser } = useAuth();
  const queryClient = useQueryClient();

  const saveProfile = useMutation({
    mutationFn: async ({ profile, gameData }) => {
      if (!firebaseUser?.uid) throw new Error('Not authenticated');
      return saveUserProfile(firebaseUser.uid, profile, gameData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  return {
    saveProfile: saveProfile.mutate,
    isSaving: saveProfile.isPending,
    saveProfileAsync: saveProfile.mutateAsync,
  };
}

/**
 * Hook for XP management
 */
export function useXP() {
  const { firebaseUser } = useAuth();
  const queryClient = useQueryClient();

  const addXP = useMutation({
    mutationFn: async ({ amount, source, description, metadata }) => {
      if (!firebaseUser?.uid) throw new Error('Not authenticated');
      return addXPTransaction(firebaseUser.uid, amount, source, description, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  const { data: xpHistory = [] } = useQuery({
    queryKey: ['xpHistory', firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser?.uid) return [];
      return getXPHistory(firebaseUser.uid, 100);
    },
    enabled: !!firebaseUser?.uid,
  });

  return {
    addXP: addXP.mutate,
    addXPAsync: addXP.mutateAsync,
    isAdding: addXP.isPending,
    xpHistory,
  };
}

/**
 * Hook for achievements
 */
export function useAchievements() {
  const { firebaseUser } = useAuth();

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements', firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser?.uid) return [];
      return getAchievements(firebaseUser.uid);
    },
    enabled: !!firebaseUser?.uid,
  });

  const unlock = useMutation({
    mutationFn: async ({ achievementId, achievementData }) => {
      if (!firebaseUser?.uid) throw new Error('Not authenticated');
      return unlockAchievement(firebaseUser.uid, achievementId, achievementData);
    },
  });

  return {
    achievements,
    unlockAchievement: unlock.mutate,
    unlockAchievementAsync: unlock.mutateAsync,
    isUnlocking: unlock.isPending,
  };
}

/**
 * Hook for assignment history
 */
export function useAssignments() {
  const { firebaseUser } = useAuth();

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser?.uid) return [];
      return getAssignmentHistory(firebaseUser.uid, 100);
    },
    enabled: !!firebaseUser?.uid,
  });

  const saveCompletion = useMutation({
    mutationFn: async (assignmentData) => {
      if (!firebaseUser?.uid) throw new Error('Not authenticated');
      return saveAssignmentCompletion(firebaseUser.uid, assignmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', firebaseUser?.uid] });
    },
  });

  return {
    assignments,
    saveCompletion: saveCompletion.mutate,
    saveCompletionAsync: saveCompletion.mutateAsync,
    isSaving: saveCompletion.isPending,
  };
}

/**
 * Hook for AI chat history
 */
export function useAIChat() {
  const { firebaseUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: chatHistory = [] } = useQuery({
    queryKey: ['aiChats', firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser?.uid) return [];
      return getAIChatHistory(firebaseUser.uid, 50);
    },
    enabled: !!firebaseUser?.uid,
  });

  const saveChat = useMutation({
    mutationFn: async (chatData) => {
      if (!firebaseUser?.uid) throw new Error('Not authenticated');
      return saveAIChat(firebaseUser.uid, chatData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiChats', firebaseUser?.uid] });
    },
  });

  return {
    chatHistory,
    saveChat: saveChat.mutate,
    saveChatAsync: saveChat.mutateAsync,
    isSaving: saveChat.isPending,
  };
}

/**
 * Hook for activity feed
 */
export function useActivityFeed() {
  const { firebaseUser } = useAuth();

  const { data: activities = [] } = useQuery({
    queryKey: ['activity', firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser?.uid) return [];
      return getActivityFeed(firebaseUser.uid, 50);
    },
    enabled: !!firebaseUser?.uid,
  });

  return {
    activities,
  };
}

/**
 * Hook for user stats
 */
export function useUserStats() {
  const { firebaseUser } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['userStats', firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser?.uid) return null;
      return getUserStats(firebaseUser.uid);
    },
    enabled: !!firebaseUser?.uid,
  });

  return {
    stats,
    isLoading,
  };
}

/**
 * Hook for profile history
 */
export function useProfileHistory() {
  const { firebaseUser } = useAuth();

  const { data: history = [] } = useQuery({
    queryKey: ['profileHistory', firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser?.uid) return [];
      return getProfileHistory(firebaseUser.uid, 50);
    },
    enabled: !!firebaseUser?.uid,
  });

  return {
    history,
  };
}

/**
 * Hook for initializing/syncing user data
 */
export function useUserSync() {
  const { firebaseUser } = useAuth();
  const queryClient = useQueryClient();

  const initialize = useMutation({
    mutationFn: async ({ profile, gameData }) => {
      if (!firebaseUser?.uid) throw new Error('Not authenticated');
      return initializeUserInFirestore(firebaseUser.uid, profile, gameData);
    },
  });

  const sync = useMutation({
    mutationFn: async ({ store, profile }) => {
      if (!firebaseUser?.uid) throw new Error('Not authenticated');
      return syncUserToFirestore(firebaseUser.uid, store, profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  return {
    initialize: initialize.mutate,
    initializeAsync: initialize.mutateAsync,
    sync: sync.mutate,
    syncAsync: sync.mutateAsync,
    isInitializing: initialize.isPending,
    isSyncing: sync.isPending,
  };
}