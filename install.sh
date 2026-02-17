#!/bin/bash

# WhatsApp CLI Installation Script
# This script clones and installs WhatsApp CLI globally

set -e

echo "🚀 Installing WhatsApp CLI..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    echo "   Please install npm"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ npm $(npm --version) detected"
echo ""

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📥 Downloading WhatsApp CLI..."
git clone https://github.com/YOUR_USERNAME/whatsapp-cli.git
cd whatsapp-cli

echo "📦 Installing dependencies..."
npm install --silent

echo "🔨 Building project..."
npm run build --silent

echo "🔗 Installing globally..."
npm link

# Clean up
cd ~
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎉 You can now use 'wacli' from anywhere!"
echo ""
echo "Quick start:"
echo "  1. Authenticate:  wacli list"
echo "  2. Send message:  wacli send -n 14165551234 -m \"Hello!\""
echo "  3. Get help:      wacli --help"
echo ""
