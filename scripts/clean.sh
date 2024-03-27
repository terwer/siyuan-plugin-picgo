#!/bin/sh

find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "dist" -type d -exec rm -rf {} +
find . -name ".turbo" -type d -exec rm -rf {} +
rm -rf ./artifacts
rm -rf ./build
echo "clean finished."