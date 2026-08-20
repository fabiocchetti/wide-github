#!/bin/bash

set -e

# Remove stale archives (zip -r would merge into an existing one)
rm -f wide-github-chrome.zip wide-github-firefox.zip wide-github-edge.zip

cp LICENSE dist/chrome/
cp LICENSE dist/firefox/
cp LICENSE dist/edge/

cd dist

cd firefox
zip -r ../../wide-github-firefox.zip . -x '*.DS_Store' -x '*.git*' -x '*.MACOSX*' -x '*.md'
cd ..

cd chrome
zip -r ../../wide-github-chrome.zip . -x '*.DS_Store' -x '*.git*' -x '*.MACOSX*' -x '*.md'
cd ..

cd edge
zip -r ../../wide-github-edge.zip . -x '*.DS_Store' -x '*.git*' -x '*.MACOSX*' -x '*.md'
cd ..

echo "ZIP packages created."
