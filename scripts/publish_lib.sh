#!/bin/sh

cp package.json package.bak.json
cp ./package.lib.json package.json
pnpm buildLib

npm publish --tag latest
mv package.bak.json package.json
