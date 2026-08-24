@echo off
cd /d c:\Users\Owner\Desktop\EW
del /q validate-done.txt lint-out.txt 2>nul
call npx eslint src/App.jsx src/components/RootErrorBoundary.jsx src/pages/GameArcade.jsx src/pages/MiniGames.jsx src/components/ProtectedRoute.jsx src/components/minigames --quiet > lint-out.txt 2>&1
echo DONE > validate-done.txt
