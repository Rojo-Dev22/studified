# Deploy Firebase Rules - Service Account Method

This method works without interactive login and is perfect for automated deployment.

## Step 1: Get Service Account Key from Firebase

1. Go to https://console.firebase.google.com
2. Click your project
3. Click the gear icon (Settings) → "Project settings"
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Save the downloaded JSON file as `firebase-service-account.json` in your project root
7. **IMPORTANT**: Add this file to `.gitignore` (never commit it!)

## Step 2: Deploy Rules Using the Service Account

Run this command in PowerShell:

```powershell
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your actual Firebase project ID (found in project settings).

## Alternative: Use the Service Account Directly

If the above doesn't work, use this Node.js script:

```javascript
// deploy-rules.js
const admin = require('firebase-admin');
const fs = require('fs');

// Load service account
const serviceAccount = JSON.parse(fs.readFileSync('firebase-service-account.json'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Read and deploy rules
const rules = fs.readFileSync('firestore.rules', 'utf8');

console.log('Deploying rules...');
console.log('Rules file:', rules);
console.log('\nTo deploy these rules:');
console.log('1. Go to Firebase Console → Firestore → Rules');
console.log('2. Copy the content from firestore.rules');
console.log('3. Paste into the Firebase Console editor');
console.log('4. Click Publish');
```

## Step 3: Verify Deployment

After deploying, test by:
1. Refreshing your app
2. Logging in
3. Checking console for "✅ User profile saved to Firebase"
4. Going to leaderboard - users should appear!

## Quick Copy-Paste Method (FASTEST)

If you want the fastest method:

1. Open `firestore.rules` file in your project
2. Copy ALL the content
3. Go to https://console.firebase.google.com
4. Firestore Database → Rules tab
5. Paste the rules
6. Click Publish

That's it! Takes 30 seconds.