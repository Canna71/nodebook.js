#!/bin/bash

# Test icon copying logic locally
echo "🧪 Testing icon copying logic..."

# Create a mock build structure
TEST_BUILD_DIR="/tmp/test_nodebook_build"
MOCK_APP_PATH="$TEST_BUILD_DIR/Nodebook.js.app"
MOCK_RESOURCES_PATH="$MOCK_APP_PATH/Contents/Resources"

echo "Creating mock app bundle structure at $MOCK_APP_PATH"

# Clean up any existing test
rm -rf "$TEST_BUILD_DIR" 2>/dev/null

# Create the directory structure
mkdir -p "$MOCK_RESOURCES_PATH"
mkdir -p "$MOCK_APP_PATH/Contents"

# Create a mock Info.plist
cat > "$MOCK_APP_PATH/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.nodebook.app</string>
</dict>
</plist>
EOF

echo "Mock app bundle created"

# Simulate the build logic
echo ""
echo "Testing icon copying..."

CURRENT_DIR=$(pwd)
BUILD_PATH="$MOCK_RESOURCES_PATH/app"  # This simulates where buildPath points in Electron Forge
mkdir -p "$BUILD_PATH"

# Test our logic
APP_RESOURCES_DIR="$BUILD_PATH/.."  # This should point to Contents/Resources

echo "Build path (simulated): $BUILD_PATH"
echo "App resources dir: $APP_RESOURCES_DIR"
echo "Resolved path: $(realpath "$APP_RESOURCES_DIR")"

# Test icon copying
echo ""
echo "Testing icon file copies:"

for icon in icon.icns document.icns; do
    SRC="$CURRENT_DIR/build-resources/icons/$icon"
    DEST="$APP_RESOURCES_DIR/$icon"
    
    if [ -f "$SRC" ]; then
        cp "$SRC" "$DEST"
        echo "✅ Copied $icon"
        ls -la "$DEST"
    else
        echo "❌ Source $icon not found at $SRC"
    fi
done

echo ""
echo "Final app bundle structure:"
find "$MOCK_APP_PATH" -type f

echo ""
echo "Testing with our installation verification script..."
# Temporarily modify our test script to use the mock path
sed "s|/Applications/Nodebook.js.app|$MOCK_APP_PATH|g" test-macos-installation.sh > /tmp/test-mock-install.sh
chmod +x /tmp/test-mock-install.sh

echo "Running modified verification script..."
/tmp/test-mock-install.sh

# Cleanup
echo ""
echo "Cleaning up test files..."
rm -rf "$TEST_BUILD_DIR"
rm -f /tmp/test-mock-install.sh

echo "✅ Test completed"
