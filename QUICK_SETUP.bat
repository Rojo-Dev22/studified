@echo off
echo ========================================
echo FIREBASE RULES DEPLOYMENT
echo ========================================
echo.
echo Your Firebase Project ID: authv2-3a0fc
echo.
echo CHOOSE AN OPTION:
echo.
echo 1. Open Firebase Console (RECOMMENDED - 30 seconds)
echo 2. Try automated deployment
echo.
set /p choice="Enter 1 or 2: "

if "%choice%"=="1" (
    echo.
    echo Opening Firebase Console...
    start https://console.firebase.google.com/project/authv2-3a0fc/firestore/rules
    echo.
    echo INSTRUCTIONS:
    echo 1. Delete all existing rules in the editor
    echo 2. Copy content from firestore.rules file
    echo 3. Paste into Firebase Console
    echo 4. Click PUBLISH
    echo.
    echo Opening firestore.rules file...
    notepad firestore.rules
    pause
) else (
    echo.
    echo Attempting automated deployment...
    firebase deploy --only firestore:rules --project authv2-3a0fc
    pause
)