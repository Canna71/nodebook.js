#!/bin/bash

# Version bump script for Nodebook.js
# Usage: ./bump-version.sh [patch|minor|major|prerelease] [prerelease-id]
# Example: ./bump-version.sh minor
# Example: ./bump-version.sh prerelease beta

set -e

VERSION_TYPE=${1:-patch}
PRERELEASE_ID=${2:-beta}

echo "🔖 Nodebook.js Version Bumper"
echo "=============================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Working directory is not clean. Please commit or stash changes."
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: $CURRENT_VERSION"

# Validate version type
case $VERSION_TYPE in
    patch|minor|major|prerelease)
        echo "✅ Version type: $VERSION_TYPE"
        ;;
    *)
        echo "❌ Error: Invalid version type. Use: patch, minor, major, or prerelease"
        exit 1
        ;;
esac

# Bump version using pnpm
echo "🔄 Bumping version..."
if [ "$VERSION_TYPE" = "prerelease" ]; then
    NEW_VERSION=$(pnpm version prerelease --preid=$PRERELEASE_ID --no-git-tag-version --json | jq -r '.newVersion')
else
    NEW_VERSION=$(pnpm version $VERSION_TYPE --no-git-tag-version --json | jq -r '.newVersion')
fi

echo "🎯 New version: $NEW_VERSION"

# Confirm before proceeding
echo ""
read -p "❓ Do you want to commit and tag this version? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Reverting version change..."
    git checkout package.json
    exit 0
fi

# Commit the version change
echo "📝 Committing version change..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"

# Create and push tag
echo "🏷️  Creating tag v$NEW_VERSION..."
git tag "v$NEW_VERSION"

# Ask about pushing
echo ""
read -p "❓ Do you want to push the changes and tag to origin? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Pushing to origin..."
    git push origin main
    git push origin "v$NEW_VERSION"
    echo ""
    echo "✅ Version $NEW_VERSION has been created and pushed!"
    echo "🔗 GitHub Actions will now build and create a release."
    echo "📋 Check: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/' | sed 's/\.git$//')/actions"
else
    echo "✅ Version $NEW_VERSION has been created locally."
    echo "📝 Run 'git push origin main && git push origin v$NEW_VERSION' when ready to deploy."
fi

echo ""
echo "🎉 Done!"
