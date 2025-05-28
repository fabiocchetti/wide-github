#!/bin/bash

set -e

# Clean previous builds
rm -rf dist/firefox dist/chrome

mkdir -p dist/firefox
cp -r src/* dist/firefox/
cp manifest.firefox.json dist/firefox/manifest.json

mkdir -p dist/chrome
cp -r src/* dist/chrome/
cp manifest.chrome.json dist/chrome/manifest.json

echo "Build complete!"
