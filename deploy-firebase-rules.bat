@echo off
echo ========================================
echo Firebase Rules Deployment Script
echo ========================================
echo.
echo This script will deploy the Firebase security rules.
echo.
echo BEFORE RUNNING THIS:
echo 1. Install Firebase CLI: npm install -g firebase-tools
echo 2. Login: firebase login
echo 3. Make sure you're in the project directory
echo.
pause
echo.
echo Deploying rules...
firebase deploy --only firestore:rules
echo.
echo Done! Check the output above for any errors.
pause