#!/bin/bash

echo "🧹 Cleaning iOS build cache..."

# 1. Clean npm/yarn cache
echo "Cleaning package manager cache..."
npm cache clean --force

# 2. Remove node_modules
echo "Removing node_modules..."
rm -rf node_modules

# 3. Clean iOS build folders
echo "Cleaning iOS folders..."
cd ios
rm -rf Pods
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData
pod cache clean --all

# 4. Reinstall dependencies
echo "📦 Reinstalling dependencies..."
cd ..
npm install

# 5. Install iOS pods
echo "📱 Installing iOS pods..."
cd ios
pod install --repo-update

echo "✅ iOS build fix complete!"
echo ""
echo "Next steps:"
echo "1. Run: npx expo run:ios"
echo "2. Or if using EAS: eas build --platform ios"