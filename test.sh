#!/bin/bash

set -e

# Runs every test/*.test.js. No dependencies are required: the style test skips
# itself unless jsdom is installed (cd test && npm install jsdom).

for t in test/*.test.js; do
  node "$t"
done

echo "All tests passed."
