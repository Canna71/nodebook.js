#!/bin/bash

# Quick test to verify icon files exist before building
echo "🔍 Checking icon files before build..."

echo ""
echo "Checking build-resources/icons directory:"
ls -la build-resources/icons/

echo ""
echo "Required icon files:"
for icon in icon.icns document.icns icon.ico document.ico icon.png document.png; do
    if [ -f "build-resources/icons/$icon" ]; then
        echo "✅ $icon - $(stat -f%z "build-resources/icons/$icon" 2>/dev/null || stat -c%s "build-resources/icons/$icon" 2>/dev/null) bytes"
    else
        echo "❌ $icon - MISSING"
    fi
done

echo ""
echo "Checking Info.plist:"
if [ -f "build-resources/Info.plist" ]; then
    echo "✅ Info.plist found"
    if grep -q "CFBundleDocumentTypes" build-resources/Info.plist; then
        echo "✅ Contains CFBundleDocumentTypes"
    else
        echo "❌ Missing CFBundleDocumentTypes"
    fi
    if grep -q "UTExportedTypeDeclarations" build-resources/Info.plist; then
        echo "✅ Contains UTExportedTypeDeclarations"
    else
        echo "❌ Missing UTExportedTypeDeclarations"
    fi
else
    echo "❌ Info.plist - MISSING"
fi

echo ""
echo "✅ Pre-build verification complete"
