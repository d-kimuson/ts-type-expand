#!/bin/bash

cd $(git rev-parse --show-toplevel)
printf "version? >> ";read new_version

current_version=$(cat package.json | grep version | cut -f 4 -d '"')
sed -i -e "s/"$current_version"/"$new_version"/g" package.json
\rm package.json-e
git add package.json && git commit -m "$new_version release"
git tag -a $new_version -m "$new_version release"
vsce publish
