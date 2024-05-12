#!/usr/bin/env bash

TRIAL_VERSION=2.0.0

./scripts/package.sh $TRIAL_VERSION
code --install-extension ./extension-tmp/ts-type-expand-$TRIAL_VERSION.vsix --force
