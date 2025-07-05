# GitHub Actions Guide for Nodebook.js

## What are GitHub Actions?

GitHub Actions is a CI/CD (Continuous Integration/Continuous Deployment) platform that allows you to automate your software development workflows directly in your GitHub repository. Think of it as a way to run scripts and commands automatically when certain events happen in your repository.

## Core Concepts

### 1. **Workflows**
- **Definition**: YAML files that define automated processes
- **Location**: `.github/workflows/` directory in your repository
- **Trigger**: Run automatically based on events (pushes, pull requests, tags, etc.)
- **Example**: Our `build.yml` file is a workflow

### 2. **Events (Triggers)**
Events tell GitHub Actions *when* to run your workflow:

```yaml
on:
  push:                    # When code is pushed
    branches: [ main ]     # Only on main branch
  pull_request:           # When PRs are opened/updated
    branches: [ main ]     # Only PRs targeting main
  tags: [ 'v*' ]          # When version tags are pushed (v1.0.0, v2.1.3, etc.)
  workflow_dispatch:      # Manual trigger (button in GitHub UI)
```

### 3. **Jobs**
- **Definition**: A set of steps that execute on the same runner
- **Parallel execution**: Multiple jobs run simultaneously by default
- **Dependencies**: Jobs can depend on other jobs with `needs:`

### 4. **Steps**
- **Definition**: Individual tasks within a job
- **Sequential**: Steps run one after another within a job
- **Actions or Commands**: Can use pre-built actions or run shell commands

### 5. **Runners**
- **Definition**: Virtual machines that execute your workflows
- **Types**: GitHub-hosted (ubuntu-latest, windows-latest, macos-latest) or self-hosted
- **Fresh environment**: Each job gets a clean virtual machine

### 6. **Matrix Strategy**
- **Definition**: Run the same job with different configurations
- **Example**: Build for multiple operating systems/architectures simultaneously

## How Our Build Workflow Works

Let's break down our `build.yml` workflow step by step:

### **Trigger Configuration**
```yaml
on:
  push:
    branches: [ main, develop ]  # Build on pushes to main/develop
    tags: [ 'v*' ]              # Build on version tags
  pull_request:
    branches: [ main ]          # Build on PRs to main
  workflow_dispatch:            # Allow manual runs
```

**What happens**: GitHub monitors your repository and runs this workflow whenever:
- You push code to `main` or `develop` branches
- You create a tag starting with 'v' (like `v1.0.0`)
- Someone opens a pull request targeting `main`
- You manually trigger it from the GitHub Actions tab

### **Matrix Strategy**
```yaml
strategy:
  fail-fast: false           # Don't stop other builds if one fails
  matrix:
    include:
      - os: macos-latest     # Build on macOS
        arch: x64            # For Intel Macs
        platform: darwin
        artifact_name: darwin-x64
      - os: macos-latest     # Build on macOS
        arch: arm64          # For Apple Silicon Macs
        platform: darwin
        artifact_name: darwin-arm64
      - os: windows-latest   # Build on Windows
        arch: x64            # For 64-bit Windows
        platform: win32
        artifact_name: win32-x64
```

**What happens**: GitHub creates 3 separate virtual machines and runs the same job on each:
1. macOS runner building for Intel Macs
2. macOS runner building for Apple Silicon Macs  
3. Windows runner building for Windows x64

### **Job Execution Flow**

Each runner follows these steps:

#### **1. Environment Setup**
```yaml
- name: Checkout code
  uses: actions/checkout@v4    # Downloads your repository code

- name: Setup Node.js
  uses: actions/setup-node@v4  # Installs Node.js 20
  with:
    node-version: '20'

- name: Setup pnpm
  uses: pnpm/action-setup@v4   # Installs pnpm package manager
```

**What happens**: 
- Fresh virtual machine is created
- Your repository code is downloaded
- Node.js and pnpm are installed and configured

#### **2. Caching**
```yaml
- name: Setup pnpm cache
  uses: actions/cache@v4
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
```

**What happens**: 
- Checks if dependencies were cached from previous runs
- If cache exists, restores it (much faster than re-downloading)
- Cache key includes OS and lockfile hash (invalidates when dependencies change)

#### **3. Memory Optimization**
```yaml
- name: Increase Node.js memory
  run: echo "NODE_OPTIONS=--max_old_space_size=4096" >> $GITHUB_ENV
```

**What happens**: 
- Sets environment variable to increase Node.js memory limit to 4GB
- Prevents "out of memory" errors during large builds
- Available to all subsequent steps

#### **4. Dependency Installation**
```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile
  env:
    NODE_OPTIONS: --max_old_space_size=4096
```

**What happens**: 
- Downloads and installs all npm packages
- `--frozen-lockfile` ensures exact versions from lockfile
- Uses increased memory limit for installation

#### **5. Build Process**
```yaml
- name: Build application
  run: pnpm run make
  env:
    npm_config_target_arch: ${{ matrix.arch }}      # x64 or arm64
    npm_config_target_platform: ${{ matrix.platform }} # darwin or win32
    NODE_OPTIONS: --max_old_space_size=4096
```

**What happens**: 
- Runs your build command (`pnpm run make`)
- Sets environment variables for cross-compilation
- Each matrix job builds for its specific architecture
- Creates platform-specific installers/packages

#### **6. Artifact Upload**
```yaml
- name: Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-${{ matrix.artifact_name }}  # build-darwin-x64, etc.
    path: |
      out/make/**/*.exe
      out/make/**/*.dmg
      out/make/**/*.zip
```

**What happens**: 
- Finds build output files (installers, packages)
- Uploads them to GitHub's artifact storage
- Each job uploads its own artifacts with unique names
- Available for download from the workflow run page

### **Release Job**
```yaml
release:
  if: startsWith(github.ref, 'refs/tags/v')  # Only for version tags
  needs: build                               # Wait for build jobs to complete
  runs-on: ubuntu-latest
```

**What happens**: 
- Only runs when you push a version tag (like `v1.0.0`)
- Waits for all build jobs to complete successfully
- Downloads all artifacts from build jobs
- Creates a GitHub Release with all platform builds attached

## Workflow Execution Timeline

Here's what happens when you push a version tag:

```
1. Tag Push (v1.0.0)
   ↓
2. GitHub detects the push event
   ↓
3. Workflow is triggered
   ↓
4. Three build jobs start in parallel:
   ├── macOS Intel build (10-15 minutes)
   ├── macOS ARM64 build (10-15 minutes)
   └── Windows x64 build (10-15 minutes)
   ↓
5. Each job:
   ├── Sets up environment
   ├── Installs dependencies
   ├── Builds application
   └── Uploads artifacts
   ↓
6. When all builds complete successfully:
   └── Release job starts
       ├── Downloads all artifacts
       ├── Prepares release files
       └── Creates GitHub Release
```

## Understanding the GitHub Actions Interface

### **Actions Tab**
- **Location**: Your repository → "Actions" tab
- **Shows**: All workflow runs (past and current)
- **Status indicators**:
  - 🟢 Green circle: Successful
  - 🔴 Red circle: Failed
  - 🟡 Yellow circle: In progress
  - ⚪ Gray circle: Cancelled/skipped

### **Workflow Run Page**
When you click on a workflow run, you see:

- **Summary**: Overall status and timing
- **Jobs section**: Each matrix job (darwin-x64, darwin-arm64, win32-x64)
- **Artifacts section**: Downloadable build files (at bottom of page)

### **Job Details**
Click on any job to see:
- **Step-by-step progress**: Each action with timing and status
- **Logs**: Detailed output from each step
- **Expandable sections**: Click to see full command output

### **Real-time Monitoring**
- **Live updates**: Page refreshes automatically during runs
- **Step indicators**: 
  - ✅ Completed successfully
  - ❌ Failed (click for error details)
  - 🔄 Currently running
  - ⏸️ Queued/waiting

## Environment Variables and Secrets

### **Automatic Variables**
GitHub provides many built-in variables:
- `${{ github.ref }}`: The branch or tag that triggered the workflow
- `${{ runner.os }}`: Operating system (Linux, Windows, macOS)
- `${{ matrix.arch }}`: Current matrix value (x64, arm64)

### **Environment Variables**
```yaml
env:
  NODE_OPTIONS: --max_old_space_size=4096
  npm_config_target_arch: ${{ matrix.arch }}
```

These are available to all commands in that step.

### **Secrets**
- **GITHUB_TOKEN**: Automatically provided for repository access
- **Custom secrets**: Can be added in repository settings
- **Usage**: `${{ secrets.SECRET_NAME }}`

## Costs and Limitations

### **GitHub-hosted Runners**
- **Public repositories**: Free unlimited minutes
- **Private repositories**: 2,000 free minutes/month, then paid
- **Concurrent jobs**: Up to 20 for free accounts

### **Runner Specifications**
- **2-core CPU**: Sufficient for most builds
- **7 GB RAM**: Good for Node.js applications
- **14 GB SSD**: Adequate for dependencies and build outputs

### **Time Limits**
- **Job timeout**: 6 hours maximum
- **Workflow timeout**: 72 hours maximum
- **Our builds**: Typically complete in 10-15 minutes

## Best Practices

### **1. Fail-Fast Strategy**
```yaml
strategy:
  fail-fast: false  # Continue other builds even if one fails
```
Allows you to see which specific platforms have issues.

### **2. Caching**
Always cache dependencies to speed up builds:
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### **3. Memory Management**
For large applications like Electron apps:
```yaml
env:
  NODE_OPTIONS: --max_old_space_size=4096
```

### **4. Artifact Organization**
Use descriptive names for artifacts:
```yaml
name: build-${{ matrix.artifact_name }}  # build-darwin-x64, etc.
```

### **5. Conditional Steps**
Run steps only when needed:
```yaml
- name: Free up disk space (Ubuntu/Linux)
  if: runner.os == 'Linux'
```

## Debugging Workflows

### **Common Issues**
1. **Out of memory**: Increase `NODE_OPTIONS`
2. **Missing dependencies**: Check lockfile and cache
3. **Cross-compilation failures**: Verify native module support
4. **Permission errors**: Check file permissions and secrets

### **Debugging Steps**
1. **Check logs**: Click on failed step for detailed output
2. **Add debug steps**: Insert `ls -la` or `env` commands
3. **Local reproduction**: Try to reproduce the issue locally
4. **Incremental fixes**: Test one change at a time

### **Debug Commands**
```yaml
- name: Debug environment
  run: |
    echo "Working directory: $(pwd)"
    echo "Environment variables:"
    env | sort
    echo "File system:"
    ls -la
```

## Security Considerations

### **Code Access**
- Workflows can access your entire repository
- Third-party actions can execute arbitrary code
- Use trusted actions with specific versions

### **Secrets Management**
- Never log secrets or put them in code
- Use GitHub's secrets feature for sensitive data
- Secrets are masked in logs automatically

### **Permissions**
```yaml
permissions:
  contents: write  # Needed for creating releases
```
Grant minimal necessary permissions.

## Monitoring and Notifications

### **Email Notifications**
- GitHub automatically emails on workflow failures
- Configure in your GitHub notification settings

### **Status Badges**
Add to your README:
```markdown
![Build Status](https://github.com/username/repo/actions/workflows/build.yml/badge.svg)
```

### **Webhook Integration**
- Can integrate with Slack, Discord, etc.
- Notifications for build status changes

## Advanced Features

### **Manual Workflow Dispatch**
```yaml
workflow_dispatch:
  inputs:
    platform:
      description: 'Platform to build'
      required: true
      default: 'all'
      type: choice
      options: ['all', 'darwin', 'win32']
```

Allows manual triggering with parameters.

### **Reusable Workflows**
Create workflows that can be called from other workflows:
```yaml
uses: ./.github/workflows/reusable-build.yml
with:
  platform: darwin
```

### **Composite Actions**
Bundle multiple steps into reusable actions:
```yaml
# .github/actions/setup-build/action.yml
runs:
  using: "composite"
  steps:
    - run: pnpm install
    - run: pnpm run build
```

This guide should give you a comprehensive understanding of how GitHub Actions work and how our specific build workflow operates!
