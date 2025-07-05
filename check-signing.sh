#!/bin/bash

# Check macOS app signing status
# Usage: ./check-signing.sh [path-to-app]

set -e

APP_PATH=${1:-"out/make/zip/darwin/x64/Nodebook.js-darwin-x64-*.zip"}

echo "🔍 macOS App Signing Checker"
echo "============================"

# Function to check a single app
check_app_signing() {
    local app_path="$1"
    
    if [ ! -e "$app_path" ]; then
        echo "❌ App not found: $app_path"
        return 1
    fi
    
    echo "📱 Checking: $(basename "$app_path")"
    echo ""
    
    # If it's a zip file, we need to extract it first
    if [[ "$app_path" == *.zip ]]; then
        echo "📦 Extracting ZIP file for analysis..."
        temp_dir=$(mktemp -d)
        unzip -q "$app_path" -d "$temp_dir"
        app_path=$(find "$temp_dir" -name "*.app" -type d | head -1)
        
        if [ -z "$app_path" ]; then
            echo "❌ No .app found in ZIP file"
            rm -rf "$temp_dir"
            return 1
        fi
    fi
    
    echo "🔐 Code Signature Information:"
    echo "--------------------------------"
    
    # Check if app is signed
    if codesign -dv "$app_path" 2>/dev/null; then
        echo "✅ App is signed"
        echo ""
        
        # Get detailed signature info
        echo "📋 Signature Details:"
        codesign -dv --verbose=4 "$app_path" 2>&1 | head -10
        echo ""
        
        # Verify signature
        echo "🛡️  Signature Verification:"
        if codesign --verify --deep --verbose=2 "$app_path" 2>/dev/null; then
            echo "✅ Signature is valid"
        else
            echo "❌ Signature verification failed"
        fi
        echo ""
        
        # Check for hardened runtime
        echo "🔒 Hardened Runtime:"
        if codesign -d --entitlements - "$app_path" 2>/dev/null | grep -q "hardened"; then
            echo "✅ Hardened runtime enabled"
        else
            echo "⚠️  Hardened runtime not detected"
        fi
        echo ""
        
        # Check for notarization
        echo "🍎 Notarization Status:"
        if xcrun stapler validate "$app_path" 2>/dev/null; then
            echo "✅ App is notarized"
        else
            echo "⚠️  App is not notarized (or stapler not available)"
        fi
        
    else
        echo "❌ App is NOT signed"
        echo ""
        echo "📋 This means users will see security warnings when trying to open the app."
        echo "📋 They'll need to right-click → Open to run it the first time."
    fi
    
    echo ""
    echo "📊 App Bundle Information:"
    echo "-------------------------"
    
    # Get app info
    if [ -f "$app_path/Contents/Info.plist" ]; then
        echo "Bundle ID: $(defaults read "$app_path/Contents/Info.plist" CFBundleIdentifier 2>/dev/null || echo 'Not found')"
        echo "Version: $(defaults read "$app_path/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null || echo 'Not found')"
        echo "Build: $(defaults read "$app_path/Contents/Info.plist" CFBundleVersion 2>/dev/null || echo 'Not found')"
    fi
    
    # Get app size
    app_size=$(du -sh "$app_path" | cut -f1)
    echo "Size: $app_size"
    
    # Clean up temp directory if we created one
    if [[ "$1" == *.zip ]] && [ -n "$temp_dir" ]; then
        rm -rf "$temp_dir"
    fi
}

# Check if codesign is available
if ! command -v codesign >/dev/null 2>&1; then
    echo "❌ Error: codesign not found. This script only works on macOS."
    exit 1
fi

# If no argument provided, look for built apps
if [ $# -eq 0 ]; then
    echo "🔍 Looking for built apps..."
    
    # Look for apps in common build locations
    found_apps=()
    
    # Check for .app bundles
    while IFS= read -r -d '' app; do
        found_apps+=("$app")
    done < <(find out -name "*.app" -type d -print0 2>/dev/null)
    
    # Check for zip files containing apps
    while IFS= read -r -d '' zip; do
        if unzip -l "$zip" 2>/dev/null | grep -q "\.app/"; then
            found_apps+=("$zip")
        fi
    done < <(find out -name "*.zip" -print0 2>/dev/null)
    
    if [ ${#found_apps[@]} -eq 0 ]; then
        echo "❌ No built apps found in 'out' directory."
        echo "💡 Try running 'pnpm run make' first, or specify a path manually:"
        echo "   ./check-signing.sh /path/to/your/app.app"
        exit 1
    fi
    
    echo "📱 Found ${#found_apps[@]} app(s):"
    for app in "${found_apps[@]}"; do
        echo "  - $(basename "$app")"
    done
    echo ""
    
    # Check each found app
    for app in "${found_apps[@]}"; do
        check_app_signing "$app"
        echo "=========================================="
        echo ""
    done
else
    # Check the specified app
    check_app_signing "$1"
fi

echo "🎉 Signing check complete!"
echo ""
echo "💡 Tips:"
echo "  - Signed apps open without warnings"
echo "  - Unsigned apps require right-click → Open"
echo "  - Notarized apps are trusted by all macOS versions"
echo "  - See internal-docs/macos-code-signing.md for setup instructions"
