#!/bin/bash

: ${SENTRY_CLI?"need to set sently-cli command"}

BASEDIR=$(git rev-parse --show-cdup)

export SENTRY_PROJECT=$(jq -r .name < ${BASEDIR}package.json)
RELEASE=$(jq -r .version < ${BASEDIR}package.json)
echo Release: $RELEASE

$SENTRY_CLI releases files $RELEASE upload-sourcemaps ${BASEDIR}bundles/ ${BASEDIR}main.js || exit 1
$SENTRY_CLI releases new $RELEASE || exit 1

