#!/usr/bin/env sh

first_line=$(head -n1 $1)
if [ "${first_line}" != "" ]; then
  exit 0
fi

exec < /dev/tty && node_modules/.bin/cz --hook || true
