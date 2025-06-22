# Version Management Guide

## Overview

This project includes multiple ways to automatically increment versions and create releases. Choose the method that best fits your workflow.

## 🎯 Quick Start

### **Option 1: Manual Script (Recommended for beginners)**
```bash
# Patch version (0.8.0 → 0.8.1)
pnpm run release:patch

# Minor version (0.8.0 → 0.9.0)
pnpm run release:minor

# Major version (0.8.0 → 1.0.0)
pnpm run release:major

# Beta prerelease (0.8.0 → 0.8.1-beta.0)
pnpm run release:beta
```

### **Option 2: GitHub Actions UI (Easy and visual)**
1. Go to your repository on GitHub
2. Click **"Actions"** tab
3. Click **"Version Management"** workflow
4. Click **"Run workflow"** button
5. Choose version type and options
6. Click **"Run workflow"**

### **Option 3: Semantic Release (Automatic based on commits)**
- Commits automatically determine version bumps
- Follows conventional commit format
- Runs on every push to main

## 📋 Detailed Methods

### **Method 1: Local Script (`bump-version.sh`)**

**Features:**
- Interactive prompts for safety
- Works locally without GitHub
- Handles git operations automatically
- Validates working directory state

**Usage:**
```bash
# Interactive patch bump
./bump-version.sh patch

# Interactive minor bump
./bump-version.sh minor

# Interactive major bump
./bump-version.sh major

# Interactive prerelease
./bump-version.sh prerelease alpha
./bump-version.sh prerelease beta
./bump-version.sh prerelease rc
```

**What it does:**
1. Checks if git working directory is clean
2. Shows current version
3. Bumps version in package.json
4. Asks for confirmation
5. Commits the change
6. Creates git tag
7. Optionally pushes to GitHub (triggers build)

### **Method 2: GitHub Actions Workflow**

**Workflow file:** `.github/workflows/version-management.yml`

**Features:**
- Manual trigger from GitHub UI
- Choose version bump type
- Choose release type for prereleases
- Option to create release or just bump version
- Automatically triggers build workflow

**GitHub UI Steps:**
1. Repository → Actions → Version Management
2. "Run workflow" → Choose options:
   - **Version bump type**: patch, minor, major, prerelease
   - **Release type**: alpha, beta, rc (for prereleases)
   - **Create release**: true/false
3. Run workflow

**What it does:**
1. Bumps version in package.json
2. Commits and pushes changes
3. Creates git tag (if create_release is true)
4. Creates GitHub release (if create_release is true)
5. Triggers build workflow automatically

### **Method 3: Semantic Release**

**Workflow file:** `.github/workflows/semantic-release.yml`

**Features:**
- Fully automatic versioning
- Based on conventional commit messages
- Generates changelog
- Creates releases automatically
- Runs on every push to main

**Conventional Commit Format:**
```
feat: add new feature        → minor version bump
fix: fix bug                 → patch version bump
perf: improve performance    → patch version bump
refactor: refactor code      → patch version bump
docs: update documentation   → no version bump
chore: update dependencies   → no version bump
BREAKING CHANGE: ...         → major version bump
```

**Examples:**
```bash
git commit -m "feat: add dark mode support"           # 0.8.0 → 0.9.0
git commit -m "fix: resolve memory leak in editor"    # 0.8.0 → 0.8.1
git commit -m "feat!: redesign user interface"        # 0.8.0 → 1.0.0
```

**What it does:**
1. Analyzes commit messages since last release
2. Determines appropriate version bump
3. Updates package.json
4. Generates CHANGELOG.md
5. Creates git tag and GitHub release
6. Triggers build workflow

## 🔧 Package.json Scripts

### **Version Only (No Git Operations)**
```bash
pnpm run version:patch      # Update package.json only
pnpm run version:minor      # Update package.json only
pnpm run version:major      # Update package.json only
pnpm run version:prerelease # Update package.json only
```

### **Full Release (Git + Push)**
```bash
pnpm run release:patch      # Complete patch release
pnpm run release:minor      # Complete minor release
pnpm run release:major      # Complete major release
pnpm run release:beta       # Complete beta prerelease
```

## 🚀 Complete Release Process

### **Automatic Workflow:**
1. **Choose method** (script, GitHub UI, or semantic release)
2. **Version is bumped** and committed
3. **Git tag is created** (e.g., `v0.8.1`)
4. **Tag push triggers** the build workflow
5. **Build workflow** creates platform-specific binaries
6. **GitHub release** is created with artifacts
7. **Users can download** the built applications

### **Manual Workflow:**
1. **Bump version** using version-only scripts
2. **Test locally** if needed
3. **Commit changes** manually
4. **Create and push tag** manually
5. **GitHub Actions** handles the rest

## 📊 Version Numbering

### **Semantic Versioning (SemVer)**
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.9.0): New features, backward compatible
- **PATCH** (0.8.1): Bug fixes, backward compatible

### **Prerelease Versions**
- **Alpha** (0.8.1-alpha.0): Early development
- **Beta** (0.8.1-beta.0): Feature complete, testing
- **RC** (0.8.1-rc.0): Release candidate

## 🔍 Monitoring Releases

### **GitHub Interface:**
- **Releases page**: Repository → Releases
- **Actions page**: Repository → Actions
- **Tags page**: Repository → Tags

### **Artifacts:**
- **Build artifacts**: Available in Actions workflow runs
- **Release assets**: Attached to GitHub releases
- **Download links**: Public URLs for distribution

## 🛠️ Troubleshooting

### **Script Issues:**
```bash
# If script fails, check:
git status                  # Working directory clean?
git remote -v              # Correct remote URL?
node -v                    # Node.js installed?
pnpm -v                    # pnpm installed?
```

### **GitHub Actions Issues:**
- **Check workflow logs** for specific errors
- **Verify permissions** (contents: write)
- **Check branch protection** rules
- **Verify GITHUB_TOKEN** has necessary permissions

### **Semantic Release Issues:**
- **Check commit message** format
- **Verify conventional commits** are being used
- **Check branch** (must be main)
- **Review release rules** in .releaserc.json

## 📝 Best Practices

### **For Development:**
1. **Use patch versions** for bug fixes
2. **Use minor versions** for new features
3. **Use major versions** for breaking changes
4. **Test prereleases** before stable releases

### **For Teams:**
1. **Agree on commit message** format
2. **Use semantic release** for consistency
3. **Review changes** before releasing
4. **Document breaking changes** clearly

### **For CI/CD:**
1. **Test builds** before releasing
2. **Use staging environments** for prereleases
3. **Monitor release metrics**
4. **Keep release notes** up to date

## 🎯 Choosing the Right Method

### **Use Local Script When:**
- You want full control over the process
- You need to test locally before releasing
- You're working offline or in restricted environments
- You prefer command-line tools

### **Use GitHub Actions UI When:**
- You want a visual, user-friendly interface
- Multiple team members need to create releases
- You want to avoid command-line operations
- You need to create releases from different machines

### **Use Semantic Release When:**
- You have a team following conventional commits
- You want fully automated releases
- You need consistent versioning across projects
- You want automatic changelog generation

## 🔗 Integration with Build System

All version management methods integrate seamlessly with your build system:

1. **Version bump** creates a git tag
2. **Tag push** triggers the build workflow
3. **Build workflow** creates platform binaries
4. **Release** includes all build artifacts
5. **Users** can download the applications

This ensures that every version bump results in a complete, distributable release! 🎉
