#!/bin/bash

# Build script for Nodebook.js
# Usage: ./build.sh [platform] [arch]
# Example: ./build.sh darwin arm64

set -e

PLATFORM=${1:-"current"}
ARCH=${2:-"current"}

echo "🔨 Building Nodebook.js"
echo "Platform: $PLATFORM"
echo "Architecture: $ARCH"
echo ""

# Run prebuild step
echo "📋 Running prebuild..."
pnpm run prebuild

# Determine build command
if [ "$PLATFORM" = "current" ] && [ "$ARCH" = "current" ]; then
    echo "🏗️  Building for current platform..."
    pnpm run make
elif [ "$PLATFORM" = "darwin" ] && [ "$ARCH" = "x64" ]; then
    echo "🍎 Building for macOS Intel..."
    pnpm run make:darwin:x64
elif [ "$PLATFORM" = "darwin" ] && [ "$ARCH" = "arm64" ]; then
    echo "🍎 Building for macOS Apple Silicon..."
    pnpm run make:darwin:arm64
elif [ "$PLATFORM" = "win32" ] && [ "$ARCH" = "x64" ]; then
    echo "🪟 Building for Windows x64..."
    pnpm run make:win32:x64
elif [ "$PLATFORM" = "linux" ] && [ "$ARCH" = "x64" ]; then
    echo "🐧 Building for Linux x64..."
    pnpm run make:linux:x64
else
    echo "❌ Unsupported platform/arch combination: $PLATFORM/$ARCH"
    echo "Supported combinations:"
    echo "  - current current (build for current platform)"
    echo "  - darwin x64"
    echo "  - darwin arm64"
    echo "  - win32 x64"
    echo "  - linux x64"
    exit 1
fi

echo ""
echo "✅ Build completed!"
echo "📦 Output files:"

if [ -d "out" ]; then
    find out -name "*.exe" -o -name "*.dmg" -o -name "*.zip" -o -name "*.deb" -o -name "*.rpm" -o -name "*.AppImage" | head -10
else
    echo "No output directory found"
fi
