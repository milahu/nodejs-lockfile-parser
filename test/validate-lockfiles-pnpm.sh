#! /usr/bin/env bash

# moved to /home/user/src/javascript/pnpm/validate-lockfiles-pnpm.sh

set -e # exit on error

#set -x # trace

find test/fixtures/ -name 'pnpm-lock.v*.yaml' -not -path '*/node_modules/*' | while read -r lockfilePath
do
  lockfileVersion=$(echo "$lockfilePath" | sed -E 's,^.*/pnpm-lock\.v([0-9.]+)\.yaml$,\1,')
  echo "lockfilePath = $lockfilePath"
  echo "lockfileVersion = $lockfileVersion"

  # NOTE(milahu): original file: /home/user/src/javascript/pnpm/git/pnpm/packages/pnpm/test/install/lockfile.todo.mjs
  node test/validate-lockfiles-pnpm.mjs "$lockfilePath"

done
