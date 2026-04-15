#!/bin/bash

# Build main application based on branch
if [ "$CF_PAGES_BRANCH" == "main" ]; then
  npm run build
elif [ "$CF_PAGES_BRANCH" == "staging" ]; then
  npm run build:staging
elif [ "$CF_PAGES_BRANCH" == "develop" ]; then
  npm run build:development
else
  npm run build:development
fi

echo "Build complete."
