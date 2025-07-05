#!/bin/bash

# Nodebook.js macOS Installation Test Script
# This script verifies that Nodebook.js is properly installed and configured for file associations

set -e

echo "🔍 Nodebook.js macOS Installation Verification"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to check status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $1"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $1"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check warning status
check_warning() {
    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    else
        echo -e "${GREEN}✅ PASS${NC}: $1"
        ((TESTS_PASSED++))
    fi
}

echo "1. Checking if Nodebook.js is installed in /Applications/"
if [ -d "/Applications/Nodebook.js.app" ]; then
    check_status "Nodebook.js.app found in /Applications/"
else
    check_status "Nodebook.js.app NOT found in /Applications/" && false
    echo -e "   ${YELLOW}Install with: sudo mv ~/Downloads/Nodebook.js.app /Applications/${NC}"
fi

echo ""
echo "2. Checking app bundle structure"
if [ -f "/Applications/Nodebook.js.app/Contents/Info.plist" ]; then
    check_status "Info.plist found in app bundle"
else
    check_status "Info.plist missing from app bundle" && false
fi

if [ -f "/Applications/Nodebook.js.app/Contents/Resources/icon.icns" ]; then
    check_status "App icon found in bundle"
else
    check_status "App icon missing from bundle" && false
fi

if [ -f "/Applications/Nodebook.js.app/Contents/Resources/document.icns" ]; then
    check_status "Document icon found in bundle"
else
    check_warning "Document icon missing from bundle - using app icon as fallback"
fi

echo ""
echo "3. Checking Info.plist configuration"
if plutil -p "/Applications/Nodebook.js.app/Contents/Info.plist" 2>/dev/null | grep -q "CFBundleDocumentTypes"; then
    check_status "CFBundleDocumentTypes declared in Info.plist"
else
    check_status "CFBundleDocumentTypes missing from Info.plist" && false
fi

if plutil -p "/Applications/Nodebook.js.app/Contents/Info.plist" 2>/dev/null | grep -q "UTExportedTypeDeclarations"; then
    check_status "UTExportedTypeDeclarations declared in Info.plist"
else
    check_status "UTExportedTypeDeclarations missing from Info.plist" && false
fi

echo ""
echo "4. Checking Launch Services registration"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

if $LSREGISTER -dump | grep -q "Nodebook.js.app"; then
    check_status "Nodebook.js registered with Launch Services"
else
    check_status "Nodebook.js NOT registered with Launch Services" && false
    echo -e "   ${YELLOW}Register with: sudo $LSREGISTER -f /Applications/Nodebook.js.app${NC}"
fi

echo ""
echo "5. Testing file association"
# Create a temporary test file
TEST_FILE="/tmp/test_nodebook_$$.nbjs"
echo '{"cells": [{"type": "markdown", "content": "# Test Notebook"}]}' > "$TEST_FILE"

if command -v duti >/dev/null 2>&1; then
    DEFAULT_APP=$(duti -x nbjs 2>/dev/null | head -1)
    if [[ "$DEFAULT_APP" == *"Nodebook"* ]]; then
        check_status "Nodebook.js is default application for .nbjs files"
    else
        check_status "Nodebook.js is NOT the default application for .nbjs files" && false
        echo -e "   ${YELLOW}Set default with: duti -s com.nodebook.app nbjs all${NC}"
        echo -e "   ${YELLOW}Or right-click any .nbjs file → Get Info → Change default app${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  INFO${NC}: duti not installed - cannot check default app programmatically"
    echo -e "   ${YELLOW}Install with: brew install duti${NC}"
    echo -e "   ${YELLOW}Or test manually: right-click $TEST_FILE and check if Nodebook.js is the default${NC}"
fi

echo ""
echo "6. Testing file opening"
if [ -f "$TEST_FILE" ]; then
    echo -e "${BLUE}ℹ️  INFO${NC}: Test file created at $TEST_FILE"
    echo -e "   ${YELLOW}Try double-clicking this file to test if it opens in Nodebook.js${NC}"
    echo -e "   ${YELLOW}Or run: open \"$TEST_FILE\"${NC}"
else
    echo -e "${RED}❌ FAIL${NC}: Could not create test file"
fi

echo ""
echo "7. Checking security settings"
if xattr "/Applications/Nodebook.js.app" 2>/dev/null | grep -q "com.apple.quarantine"; then
    check_warning "App has quarantine attribute - may show security warnings"
    echo -e "   ${YELLOW}Remove with: sudo xattr -r -d com.apple.quarantine /Applications/Nodebook.js.app${NC}"
else
    check_status "No quarantine attribute found"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Installation appears to be correct!${NC}"
    echo -e "Try double-clicking $TEST_FILE to test file associations."
else
    echo ""
    echo -e "${YELLOW}⚠️  Installation needs attention.${NC}"
    echo "Please check the failed tests above and follow the suggested commands."
    echo ""
    echo "Common fixes:"
    echo "1. Move app to /Applications/: sudo mv ~/Downloads/Nodebook.js.app /Applications/"
    echo "2. Register with system: sudo $LSREGISTER -f /Applications/Nodebook.js.app"
    echo "3. Set as default app: right-click any .nbjs file → Get Info → Change default app"
    echo "4. Remove quarantine: sudo xattr -r -d com.apple.quarantine /Applications/Nodebook.js.app"
    echo ""
    echo "For detailed troubleshooting, see:"
    echo "- MACOS_INSTALL.md"
    echo "- docs/macos-file-association-troubleshooting.md"
fi

# Cleanup
rm -f "$TEST_FILE" 2>/dev/null || true

echo ""
echo "Test complete. For detailed installation instructions, see MACOS_INSTALL.md"
