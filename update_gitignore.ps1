$env:Path += ';C:\Program Files\Git\bin'
$content = @"
# =====================
# ENVIRONMENT VARIABLES
# =====================
.env
.env.*
.env.local
.env.development
.env.production
.env.test

# =====================
# DEPENDENCIES
# =====================
node_modules/
.pnp
.pnp.js

# =====================
# BUILD OUTPUT
# =====================
dist
dist-ssr
build
*.tsbuildinfo

# =====================
# LOGS
# =====================
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# =====================
# OS FILES
# =====================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
Desktop.ini

# =====================
# IDE / EDITOR
# =====================
.vscode/*
!.vscode/extensions.json
.idea
*.swp
*.swo
*~
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# =====================
# FIREBASE
# =====================
.firebase/
firebase-debug.log
.firebaserc.local

# =====================
# TESTING
# =====================
coverage
.nyc_output

# =====================
# MISC
# =====================
*.local
.vite
*.pid
*.seed
*.pid.lock
"@

Set-Content -Path 'c:\Users\Owner\Desktop\EW\.gitignore' -Value $content -Force
Write-Host '.gitignore updated successfully'