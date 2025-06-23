#!/bin/bash

# Find hardcoded colors in the codebase
# Usage: ./find-hardcoded-colors.sh

echo "🎨 Hardcoded Color Detector"
echo "=========================="
echo ""

# Function to search for hardcoded colors
search_colors() {
    local pattern="$1"
    local description="$2"
    local files=$(grep -r --include="*.tsx" --include="*.ts" --include="*.css" -l "$pattern" src/ 2>/dev/null)
    
    if [ -n "$files" ]; then
        echo "🔍 $description:"
        echo "Files found: $(echo "$files" | wc -l)"
        echo ""
        
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                echo "📁 $file:"
                grep --color=always -n "$pattern" "$file" | head -5
                echo ""
            fi
        done <<< "$files"
        echo "----------------------------------------"
        echo ""
    fi
}

# Search for various hardcoded color patterns
search_colors "text-red-[0-9]" "Red text colors (text-red-400, etc.)"
search_colors "text-yellow-[0-9]" "Yellow text colors (text-yellow-400, etc.)"
search_colors "text-blue-[0-9]" "Blue text colors (text-blue-400, etc.)"
search_colors "text-green-[0-9]" "Green text colors (text-green-400, etc.)"
search_colors "text-gray-[0-9]" "Gray text colors (text-gray-400, etc.)"

search_colors "bg-red-[0-9]" "Red background colors"
search_colors "bg-yellow-[0-9]" "Yellow background colors"
search_colors "bg-blue-[0-9]" "Blue background colors"
search_colors "bg-green-[0-9]" "Green background colors"
search_colors "bg-gray-[0-9]" "Gray background colors"

search_colors "border-red-[0-9]" "Red border colors"
search_colors "border-yellow-[0-9]" "Yellow border colors"
search_colors "border-blue-[0-9]" "Blue border colors"
search_colors "border-green-[0-9]" "Green border colors"
search_colors "border-gray-[0-9]" "Gray border colors"

# Search for RGB/HSL colors in CSS
search_colors "rgb\(" "RGB color values"
search_colors "rgba\(" "RGBA color values"
search_colors "hsl\(" "HSL color values"
search_colors "#[0-9a-fA-F]{3,6}" "Hex color values"

echo "🎯 Replacement Suggestions:"
echo "=========================="
echo ""
echo "Status Colors:"
echo "  text-red-400     → text-error"
echo "  text-yellow-400  → text-warning"
echo "  text-blue-400    → text-info"
echo "  text-green-400   → text-success"
echo "  text-gray-400    → text-debug"
echo ""
echo "Background Colors:"
echo "  bg-gray-900      → bg-console-background"
echo "  bg-gray-800      → bg-muted"
echo "  bg-gray-700      → bg-secondary"
echo ""
echo "Border Colors:"
echo "  border-gray-700  → border-console-border"
echo "  border-gray-600  → border-border"
echo ""
echo "General Mapping:"
echo "  Gray colors      → Use muted/console variants"
echo "  Status colors    → Use semantic error/warning/info/success"
echo "  Custom colors    → Add to theme.css with semantic names"
echo ""
echo "📋 Next Steps:"
echo "1. Review the files listed above"
echo "2. Replace hardcoded colors with theme colors"
echo "3. Test in both light and dark modes"
echo "4. Add new semantic colors to theme.css if needed"
echo ""
echo "📖 See internal-docs/theme-system.md for detailed guidance"
