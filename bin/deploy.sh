#!/bin/bash

set -eu

cd $(git rev-parse --show-toplevel)/packages/ts-type-expand

current_version=$(cat package.json | grep version | cut -f 4 -d '"')
echo "current version is ${current_version}"
printf "which version to update ? >> ";read new_version

if [[ $current_version = $new_version ]]; then
    echo "$new_version is same to current version"
    exit 1
fi

# deploy
sed -i -e "s/"$current_version"/"$new_version"/g" package.json  # for mac
if [ -f package.json-e ]; then
    rm package.json-e
fi
git add package.json && git commit -m "$new_version release"
git tag -a "v$new_version" -m "$new_version release"
touch yarn.lock
vsce publish --yarn
rm yarn.lock

git push origin HEAD
git push origin --tags
