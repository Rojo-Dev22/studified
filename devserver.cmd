@echo off
cd /d c:\Users\Owner\Desktop\EW
del /q devserver-out.txt 2>nul
call npm run dev > devserver-out.txt 2>&1
