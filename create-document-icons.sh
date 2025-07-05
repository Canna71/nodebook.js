#!/bin/bash

# Script to create document icons for .nbjs files
# This creates variations of the app icon with document styling

set -e

echo "Creating document icons for .nbjs files..."

# Check if ImageMagick is available
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is required but not installed."
    echo "Install with: brew install imagemagick"
    exit 1
fi

# Create directories
mkdir -p build-resources/icons/document/png
mkdir -p build-resources/icons/document/icns
mkdir -p build-resources/icons/document/ico

# Base icon path
BASE_ICON="build-resources/icons/icon.png"

if [ ! -f "$BASE_ICON" ]; then
    echo "Error: Base icon not found at $BASE_ICON"
    exit 1
fi

# Create document icon variants with a document badge
# We'll create a simple overlay to indicate it's a document

echo "Creating PNG document icons..."

# Create different sizes for PNG
for size in 16 32 48 64 128 256 512; do
    output="build-resources/icons/document/png/document-${size}.png"
    
    # Create a document version by adding a small page corner fold
    convert "$BASE_ICON" \
        -resize ${size}x${size} \
        \( +clone -fill white -colorize 100% -fill '#666666' \
           -draw "polygon 0,0 ${size},0 ${size},$((size-size/6)) $((size-size/6)),$((size-size/6)) $((size-size/6)),0 0,0" \
           -fill white \
           -draw "polygon $((size-size/6)),$((size-size/6)) ${size},$((size-size/6)) ${size},0" \) \
        -compose multiply -composite \
        "$output"
    
    echo "Created: $output"
done

echo "Creating ICO file for Windows..."
# Create ICO file with multiple sizes
convert build-resources/icons/document/png/document-16.png \
        build-resources/icons/document/png/document-32.png \
        build-resources/icons/document/png/document-48.png \
        build-resources/icons/document/png/document-64.png \
        build-resources/icons/document/png/document-128.png \
        build-resources/icons/document/png/document-256.png \
        build-resources/icons/document/ico/document.ico

echo "Creating ICNS file for macOS..."
# Create iconset directory structure for macOS
ICONSET_DIR="build-resources/icons/document/document.iconset"
mkdir -p "$ICONSET_DIR"

# Copy and rename for iconset
cp build-resources/icons/document/png/document-16.png "$ICONSET_DIR/icon_16x16.png"
cp build-resources/icons/document/png/document-32.png "$ICONSET_DIR/icon_16x16@2x.png"
cp build-resources/icons/document/png/document-32.png "$ICONSET_DIR/icon_32x32.png"
cp build-resources/icons/document/png/document-64.png "$ICONSET_DIR/icon_32x32@2x.png"
cp build-resources/icons/document/png/document-128.png "$ICONSET_DIR/icon_128x128.png"
cp build-resources/icons/document/png/document-256.png "$ICONSET_DIR/icon_128x128@2x.png"
cp build-resources/icons/document/png/document-256.png "$ICONSET_DIR/icon_256x256.png"
cp build-resources/icons/document/png/document-512.png "$ICONSET_DIR/icon_256x256@2x.png"
cp build-resources/icons/document/png/document-512.png "$ICONSET_DIR/icon_512x512.png"

# Convert to ICNS
iconutil -c icns "$ICONSET_DIR" -o "build-resources/icons/document/document.icns"

# Create simple copies for immediate use
cp build-resources/icons/document/document.icns build-resources/icons/document.icns
cp build-resources/icons/document/ico/document.ico build-resources/icons/document.ico
cp build-resources/icons/document/png/document-256.png build-resources/icons/document.png

echo "✅ Document icons created successfully!"
echo ""
echo "Created files:"
echo "  - build-resources/icons/document.icns (macOS)"
echo "  - build-resources/icons/document.ico (Windows)"
echo "  - build-resources/icons/document.png (Linux)"
echo ""
echo "Next steps:"
echo "1. Update Info.plist to use document icons"
echo "2. Update registry file for Windows"
echo "3. Test file associations after installation"
