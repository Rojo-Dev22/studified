# Cloud Database Setup Guide

This guide explains how to set up and use the cloud database system for Studified, which provides social media-like features including user profile tracking, XP history, achievements, assignment tracking, AI chat history, and a global leaderboard.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Firebase Setup](#firebase-setup)
4. [Deploying Security Rules](#deploying-security-rules)
5. [Using the Cloud Database](#using-the-cloud-database)
6. [API Reference](#api-reference)
7. [React Hooks](#react-hooks)
8. [Examples](#examples)

## 🎯 Overview

The cloud database system extends the existing localStorage-based storage with Firebase Firestore to enable:

- **Cross-device synchronization** - Access your data from any device
- **Global leaderboard** - Compete with students worldwide
- **Profile change history** - Track all changes to your profile
- **XP transaction history** - See exactly when and how you earned XP
- **Achievements system** - Unlock badges for milestones
- **Assignment tracking** - Complete history of all assignments
- **AI chat history** - Store and review AI tutoring sessions
- **Activity feed** - Social feed of your accomplishments

### Architecture

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (React Components & Hooks)             │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Cloud Database Layer               │
│  (cloudDatabase.js + useCloudDatabase)  │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼──────┐    ┌────────▼────────┐
│  Firestore   │    │   localStorage  │
│  (Cloud)     │    │   (Primary)     │
└──────────────┘    └─────────────────┘
```

**Note:** localStorage remains the primary storage for offline functionality. Firestore syncs in the background and enables cross-device features.

## 🗄️ Database Schema

### Users Collection (`/users/{userId}`)

Main user document containing profile and game data.

```javascript
{
  profile: {
    email: string,
    full_name: string,
    caption: string,
    specialities: string[],
    avatar: string,
    interests: string[],
    location: string,
    social_github: string,
    social_twitter: string,
    social_website: string,
    total_xp: number,
    xp: number,
    quests_completed: number,
    focus_hours: number,
    streak_days: number,
    grade: number
  },
  gameData: {
    Quest: Array,
    Raid: Array,
    Guild: Array,
    GuildMessage: Array,
    FocusSession: Array,
    User: Array
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Subcollections

#### 1. Profile History (`/users/{userId}/profileHistory/{changeId}`)

Tracks all changes to user profile.

```javascript
{
  changes: [
    {
      field: string,
      oldValue: any,
      newValue: any
    }
  ],
  changedAt: timestamp,
  previousValues: object,
  newValues: object
}
```

#### 2. XP History (`/users/{userId}/xpHistory/{transactionId}`)

Records all XP transactions.

```javascript
{
  amount: number,
  source: string,  // e.g., 'quest_completion', 'focus_session', 'daily_login'
  description: string,
  metadata: object,
  createdAt: timestamp
}
```

#### 3. Achievements (`/users/{userId}/achievements/{achievementId}`)

Stores unlocked achievements.

```javascript
{
  achievementId: string,
  name: string,
  description: string,
  icon: string,
  unlockedAt: timestamp
}
```

#### 4. Assignments (`/users/{userId}/assignments/{assignmentId}`)

Tracks completed assignments/quests.

```javascript
{
  questId: string,
  title: string,
  subject: string,
  score: number,
  completedAt: timestamp,
  createdAt: timestamp
}
```

#### 5. AI Chats (`/users/{userId}/aiChats/{chatId}`)

Stores AI tutoring sessions.

```javascript
{
  prompt: string,
  response: string,
  subject: string,
  createdAt: timestamp
}
```

#### 6. Activity Feed (`/users/{userId}/activity/{activityId}`)

User's activity timeline.

```javascript
{
  type: string,  // 'quest_completed', 'focus_session', 'achievement_unlocked', 'ai_chat'
  title: string,
  description: string,
  metadata: object,
  createdAt: timestamp
}
```

### Leaderboard Collection (`/leaderboard/{userId}`)

Global leaderboard entries (read-only for users).

```javascript
{
  uid: string,
  email: string,
  full_name: string,
  avatar: string,
  total_xp: number,
  quests_completed: number,
  focus_hours: number,
  streak_days: number,
  level: number,
  updatedAt: timestamp
}
```

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "studified")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database

1. In Firebase Console, go to **Build > Firestore Database**
2. Click "Create database"
3. Select **Start in test mode** (we'll deploy secure rules next)
4. Choose a location close to your users
5. Click "Enable"

### 3. Enable Authentication

1. Go to **Build > Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Click "Save"

### 4. Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click web icon (`</`)
4. Register app with name (e.g., "Studified Web")
5. Copy the Firebase config object

### 5. Update Environment Variables

Add your Firebase config to `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🚀 Deploying Security Rules

### Option 1: Using the Deployment Script (Windows)

```bash
# Double-click this file in Windows Explorer
deploy-firebase-rules.bat
```

Or run manually:

```bash
firebase deploy --only firestore:rules
```

### Option 2: Manual Deployment

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### Option 3: Using Firebase Console

1. Go to **Firestore Database > Rules** tab
2. Copy contents from `firestore.rules`
3. Paste into the rules editor
4. Click "Publish"

## 💻 Using the Cloud Database

### Basic Usage

The cloud database is designed to work seamlessly with the existing localStorage system. Here's how to use it:

#### 1. Initialize User on Signup

```javascript
import { useUserSync } from '@/hooks/useCloudDatabase';

function SignupForm() {
  const { initialize } = useUserSync();
  
  const handleSignup = async (email, password, profile) => {
    // Create user with Firebase Auth
    const user = await createUserWithEmailAndPassword(auth, email, password);
    
    // Initialize in Firestore
    await initialize({
      profile: {
        email: user.user.email,
        full_name: profile.name,
        // ... other profile fields
      },
      gameData: store // Optional: sync existing game data
    });
  };
}
```

#### 2. Sync Data Periodically

```javascript
import { useUserSync } from '@/hooks/useCloudDatabase';

function App() {
  const { sync } = useUserSync();
  
  // Sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      sync({
        store: db.getStore(),
        profile: currentUser
      });
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [sync]);
}
```

#### 3. Track XP Earned

```javascript
import { useXP } from '@/hooks/useCloudDatabase';

function QuestComplete({ quest }) {
  const { addXP } = useXP();
  
  const handleComplete = async () => {
    // Complete quest logic...
    
    // Add XP transaction
    await addXP({
      amount: 100,
      source: 'quest_completion',
      description: `Completed quest: ${quest.title}`,
      metadata: { questId: quest.id, subject: quest.subject }
    });
  };
}
```

#### 4. Unlock Achievements

```javascript
import { useAchievements } from '@/hooks/useCloudDatabase';
import { checkAndUnlockAchievements } from '@/lib/cloudDatabase';

function Profile() {
  const { unlockAchievement } = useAchievements();
  
  useEffect(() => {
    // Check for new achievements when stats change
    const checkAchievements = async () => {
      const newAchievements = await checkAndUnlockAchievements(
        userId,
        {
          quests_completed: user.quests_completed,
          focus_hours: user.focus_hours,
          streak_days: user.streak_days,
          level: user.level
        }
      );
      
      // Show notifications for new achievements
      newAchievements.forEach(achievement => {
        showNotification(`Achievement unlocked: ${achievement.name}!`);
      });
    };
    
    checkAchievements();
  }, [user.quests_completed, user.focus_hours]);
}
```

#### 5. Save AI Chat

```javascript
import { useAIChat } from '@/hooks/useCloudDatabase';

function AITools() {
  const { saveChat } = useAIChat();
  
  const handleChat = async (prompt, response) => {
    // Display chat to user...
    
    // Save to cloud
    await saveChat({
      prompt: prompt,
      response: response,
      subject: 'Mathematics',
      metadata: { topic: 'algebra' }
    });
  };
}
```

## 📚 API Reference

### Core Functions

#### `saveUserProfile(uid, profile, gameData)`

Save user profile to Firestore with change tracking.

**Parameters:**
- `uid` (string): User ID
- `profile` (object): User profile data
- `gameData` (object, optional): Game data (Quest, Raid, etc.)

**Returns:** `Promise<boolean>`

**Example:**
```javascript
await saveUserProfile(userId, {
  email: 'user@example.com',
  full_name: 'John Doe',
  total_xp: 1500,
  quests_completed: 10
});
```

#### `addXPTransaction(uid, amount, source, description, metadata)`

Add XP transaction to user's history.

**Parameters:**
- `uid` (string): User ID
- `amount` (number): XP amount
- `source` (string): Source of XP (e.g., 'quest_completion')
- `description` (string): Human-readable description
- `metadata` (object, optional): Additional data

**Returns:** `Promise<boolean>`

**Example:**
```javascript
await addXPTransaction(
  userId,
  100,
  'quest_completion',
  'Completed Algebra Quiz',
  { questId: 'quest-123', score: 95 }
);
```

#### `unlockAchievement(uid, achievementId, achievementData)`

Unlock achievement for user.

**Parameters:**
- `uid` (string): User ID
- `achievementId` (string): Achievement ID
- `achievementData` (object): Achievement details

**Returns:** `Promise<boolean>`

**Example:**
```javascript
await unlockAchievement(userId, 'first_quest', {
  name: 'First Quest',
  description: 'Complete your first quest',
  icon: 'star'
});
```

#### `saveAssignmentCompletion(uid, assignmentData)`

Save assignment completion to history.

**Parameters:**
- `uid` (string): User ID
- `assignmentData` (object): Assignment details

**Returns:** `Promise<boolean>`

**Example:**
```javascript
await saveAssignmentCompletion(userId, {
  questId: 'quest-456',
  title: 'Quadratic Equations',
  subject: 'Mathematics',
  score: 100
});
```

#### `saveAIChat(uid, chatData)`

Save AI chat interaction.

**Parameters:**
- `uid` (string): User ID
- `chatData` (object): Chat data

**Returns:** `Promise<boolean>`

**Example:**
```javascript
await saveAIChat(userId, {
  prompt: 'How do I solve quadratic equations?',
  response: 'Quadratic equations can be solved using...',
  subject: 'Mathematics'
});
```

#### `getLeaderboard(limitCount)`

Get leaderboard data from Firestore.

**Parameters:**
- `limitCount` (number, optional): Max results (default: 50)

**Returns:** `Promise<Array>`

**Example:**
```javascript
const leaderboard = await getLeaderboard(100);
console.log(leaderboard);
// [{ uid: '...', full_name: '...', total_xp: 1500, level: 5 }, ...]
```

#### `getUserStats(uid)`

Get comprehensive user stats.

**Parameters:**
- `uid` (string): User ID

**Returns:** `Promise<object>`

**Example:**
```javascript
const stats = await getUserStats(userId);
console.log(stats);
// {
//   profile: { ... },
//   xpHistory: [ ... ],
//   achievements: [ ... ],
//   recentAssignments: [ ... ],
//   recentActivity: [ ... ],
//   totalXPEarned: 1500,
//   achievementCount: 12
// }
```

## 🎣 React Hooks

### `useUserProfile()`

Hook for managing user profile with cloud sync.

```javascript
const { saveProfile, isSaving } = useUserProfile();

// Save profile
await saveProfile({
  profile: { full_name: 'John Doe', ... },
  gameData: store.gameData
});
```

### `useXP()`

Hook for XP management.

```javascript
const { addXP, xpHistory } = useXP();

// Add XP
await addXP({
  amount: 100,
  source: 'quest_completion',
  description: 'Completed quest'
});

// View history
console.log(xpHistory);
```

### `useAchievements()`

Hook for achievements.

```javascript
const { achievements, unlockAchievement } = useAchievements();

// Unlock achievement
await unlockAchievement({
  achievementId: 'first_quest',
  achievementData: { name: 'First Quest', ... }
});

// View achievements
console.log(achievements);
```

### `useAssignments()`

Hook for assignment history.

```javascript
const { assignments, saveCompletion } = useAssignments();

// Save completion
await saveCompletion({
  questId: 'quest-123',
  title: 'Algebra Quiz',
  score: 95
});

// View history
console.log(assignments);
```

### `useAIChat()`

Hook for AI chat history.

```javascript
const { chatHistory, saveChat } = useAIChat();

// Save chat
await saveChat({
  prompt: 'What is algebra?',
  response: 'Algebra is...',
  subject: 'Mathematics'
});

// View history
console.log(chatHistory);
```

### `useActivityFeed()`

Hook for activity feed.

```javascript
const { activities } = useActivityFeed();

console.log(activities);
// [{ type: 'quest_completed', title: 'Completed Algebra Quiz', ... }, ...]
```

### `useUserStats()`

Hook for comprehensive user stats.

```javascript
const { stats, isLoading } = useUserStats();

if (stats) {
  console.log(stats.totalXPEarned);
  console.log(stats.achievementCount);
}
```

### `useProfileHistory()`

Hook for profile change history.

```javascript
const { history } = useProfileHistory();

console.log(history);
// [{ changes: [...], changedAt: Date, previousValues: {...}, newValues: {...} }, ...]
```

### `useUserSync()`

Hook for initializing/syncing user data.

```javascript
const { initialize, sync } = useUserSync();

// Initialize new user
await initialize({
  profile: userProfile,
  gameData: gameData
});

// Sync existing user
await sync({
  store: db.getStore(),
  profile: currentUser
});
```

## 📊 Firestore Indexes

For optimal performance, create these indexes in Firebase Console:

### Leaderboard Collection

```
Collection: leaderboard
Fields:
  - total_xp (Descending)
  - updatedAt (Descending)
```

### User Subcollections

All subcollections should have indexes on `createdAt` (Descending):

```
Collection: users/{userId}/xpHistory
Fields:
  - createdAt (Descending)

Collection: users/{userId}/achievements
Fields:
  - unlockedAt (Descending)

Collection: users/{userId}/assignments
Fields:
  - completedAt (Descending)

Collection: users/{userId}/aiChats
Fields:
  - createdAt (Descending)

Collection: users/{userId}/activity
Fields:
  - createdAt (Descending)

Collection: users/{userId}/profileHistory
Fields:
  - changedAt (Descending)
```

**Note:** Firestore will automatically prompt you to create indexes when queries fail. Click the link in the error message to auto-create the index.

## 🧪 Examples

### Example 1: Complete User Onboarding

```javascript
import { useUserSync } from '@/hooks/useCloudDatabase';
import { useXP } from '@/hooks/useCloudDatabase';
import { useAchievements } from '@/hooks/useCloudDatabase';

async function handleUserSignup(user, profile) {
  const { initialize } = useUserSync();
  const { addXP } = useXP();
  const { unlockAchievement } = useAchievements();
  
  // 1. Initialize user in Firestore
  await initialize({
    profile: {
      ...profile,
      total_xp: 0,
      quests_completed: 0,
      focus_hours: 0,
      streak_days: 0
    }
  });
  
  // 2. Give welcome XP
  await addXP({
    amount: 50,
    source: 'welcome_bonus',
    description: 'Welcome to Studified!'
  });
  
  // 3. Unlock welcome achievement
  await unlockAchievement({
    achievementId: 'welcome',
    name: 'Welcome',
    description: 'Joined Studified',
    icon: 'sparkles'
  });
}
```

### Example 2: Quest Completion with Full Tracking

```javascript
import { useXP } from '@/hooks/useCloudDatabase';
import { useAchievements } from '@/hooks/useCloudDatabase';
import { useAssignments } from '@/hooks/useCloudDatabase';
import { useActivityFeed } from '@/hooks/useCloudDatabase';
import { checkAndUnlockAchievements } from '@/lib/cloudDatabase';

async function completeQuest(quest, score) {
  const { addXP } = useXP();
  const { unlockAchievement } = useAchievements();
  const { saveCompletion } = useAssignments();
  const { addActivity } = useActivityFeed();
  
  // 1. Calculate XP
  const xpEarned = Math.floor(score * 1.5);
  
  // 2. Add XP transaction
  await addXP({
    amount: xpEarned,
    source: 'quest_completion',
    description: `Completed: ${quest.title}`,
    metadata: { questId: quest.id, score, subject: quest.subject }
  });
  
  // 3. Save assignment completion
  await saveCompletion({
    questId: quest.id,
    title: quest.title,
    subject: quest.subject,
    score: score
  });
  
  // 4. Add activity
  await addActivity({
    type: 'quest_completed',
    title: 'Quest Completed',
    description: `Completed "${quest.title}" with ${score}% score`,
    metadata: { questId: quest.id, xpEarned }
  });
  
  // 5. Check for new achievements
  const userStats = await getUserStats(userId);
  const newAchievements = await checkAndUnlockAchievements(userId, userStats);
  
  // 6. Unlock new achievements
  for (const achievement of newAchievements) {
    await unlockAchievement({
      achievementId: achievement.id,
      ...achievement
    });
  }
}
```

### Example 3: Focus Session Tracking

```javascript
import { useXP } from '@/hooks/useCloudDatabase';

async function completeFocusSession(session) {
  const { addXP } = useXP();
  
  // 1. Calculate XP (10 XP per minute)
  const xpEarned = session.actual_minutes * 10;
  
  // 2. Add XP transaction
  await addXP({
    amount: xpEarned,
    source: 'focus_session',
    description: `Focused for ${session.actual_minutes} minutes on ${session.subject}`,
    metadata: {
      sessionId: session.id,
      subject: session.subject,
      duration: session.actual_minutes,
      distractions: session.distraction_count
    }
  });
}
```

## 🔧 Troubleshooting

### "Permission denied" errors

Make sure you've deployed the Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

### Data not syncing

1. Check Firebase config in `.env.local`
2. Verify Firebase is initialized in `src/lib/firebase.js`
3. Check browser console for errors
4. Ensure user is authenticated

### Leaderboard not showing other users

1. Deploy Firestore rules (see above)
2. Ensure leaderboard collection exists in Firestore
3. Check that users have synced their data

### Index errors

Firestore will provide a direct link to create required indexes. Click the link in the error message to auto-create the index.

## 📈 Performance Tips

1. **Limit queries**: Always use `limit()` for large collections
2. **Cache data**: Use React Query's built-in caching
3. **Batch operations**: Use `writeBatch` for multiple writes
4. **Offline support**: localStorage ensures app works offline
5. **Debounce saves**: Profile saves are debounced to reduce writes

## 🔐 Security Notes

- All user data is private by default
- Users can only read/write their own data
- Leaderboard is read-only for users
- Profile history is only visible to the user
- All writes require authentication
- Firestore rules enforce access control

## 📝 Next Steps

1. ✅ Deploy Firestore security rules
2. ✅ Update Firebase config in `.env.local`
3. ✅ Test user initialization on signup
4. ✅ Implement XP tracking in quest/focus completion
5. ✅ Add achievement checking logic
6. ✅ Test leaderboard functionality
7. ✅ Deploy and monitor usage

## 🆘 Support

For issues or questions:
- Check the Firebase Console for errors
- Review browser console logs
- Ensure all environment variables are set
- Verify Firestore rules are deployed

---

**Last Updated:** 2025
**Version:** 1.0.0