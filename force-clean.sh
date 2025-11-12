#!/bin/bash
echo "🔫 Force closing Electron processes..."
taskkill //f //im electron.exe 2>/dev/null
taskkill //f //im "node.exe" 2>/dev/null

echo "⏳ Waiting 5 seconds..."
timeout 5

echo "🗑️ Removing directories..."
rm -rf dist
rm -rf release
rm -rf build

echo "✅ Force cleanup completed!"