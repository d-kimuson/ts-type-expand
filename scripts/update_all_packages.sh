#!/usr/bin/env bash

set -eux

pnpm --filter='*' update --latest
