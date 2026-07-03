# Firebase Setup - REQUIRED for Leaderboard to Work

## Why You Need This:
localStorage only works on ONE device. To see ALL users across ALL devices, you MUST deploy Firebase security rules.

## Step-by-Step Setup (2 minutes):

### 1. Open Firebase Console
Go to: https://console.firebase.google.com

### 2. Select Your Project
Click on your project name

### 3. Go to Firestore Database
- Look at the LEFT menu
- Click "Firestore Database" (it has a database icon)
- If it asks to "Create Database", click it
- Choose "Start in test mode"
- Click "Next"
- Click "Enable"

### 4. Deploy Security Rules
- Click the **"Rules"** tab at the top
- You'll see some default rules
- **DELETE EVERYTHING** in the editor
- **PASTE THIS EXACTLY:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

- Click the **"PUBLISH"** button (blue button at the top)
- Wait 10 seconds

### 5. Test
- Go back to your app
- Refresh the page
- Log in
- Check console for: "✅ User profile saved to Firebase"
- Go to leaderboard - you should see users!

## That's It!
The leaderboard will now show ALL users from ALL devices.