#!/bin/bash

set -e

ORIGINAL_PATH=$(pwd)
PATH_TO_QUATT_CLOUD=$1

if [ -z "$PATH_TO_QUATT_CLOUD" ]
then
  echo "Path to Quatt Cloud is empty"
  exit 1
fi

cd $PATH_TO_QUATT_CLOUD

npx @openapitools/openapi-generator-cli generate \
  -i ./src/spec/schemas/api-v1.yaml \
  -o $ORIGINAL_PATH/src/api-client \
  -g typescript-fetch \
  --additional-properties=supportsES6=true,modelPropertyNaming=original \
  --skip-validate-spec

cd $ORIGINAL_PATH;

