#!/bin/bash

set -e

cp LICENSE dist/chrome/
cp LICENSE dist/firefox/

cd dist

cd firefox
zip -r ../../wide-github-firefox.zip . -x '*.DS_Store' -x '*.git*' -x '*.MACOSX*' -x '*.md'
cd ..

cd chrome
zip -r ../../wide-github-chrome.zip . -x '*.DS_Store' -x '*.git*' -x '*.MACOSX*' -x '*.md'
cd ..

echo "ZIP packages created."
