#!/usr/bin/env bash

# これで動くことを検証できたらちゃんとしたい...
set -eux

REPOSITORY_DIR=$(git rev-parse --show-toplevel)
EXTENSION_TMP_DIR=${REPOSITORY_DIR}/extension-tmp
VERSION=$1

cd ${REPOSITORY_DIR}

# clean
rm -rf ${EXTENSION_TMP_DIR} && mkdir -p ${EXTENSION_TMP_DIR}

# 全体ビルド
pnpm typecheck
pnpm build

# ts-type-expand-plugin の pack
pushd ./packages/ts-type-expand-plugin
ts_type_expand_plugin_packed=$(pnpm pack --pack-destination ${EXTENSION_TMP_DIR})
popd

# packaging する用のパッケージ作成
node -e "console.log(JSON.stringify({...require('./packages/ts-type-expand/package.json'), scripts: {}, dependencies: {}, devDependencies: {}, version: '${VERSION}'}, null, 2))"\
  >> ${EXTENSION_TMP_DIR}/package.json
cp ./packages/ts-type-expand/.vscodeignore ${EXTENSION_TMP_DIR}
cp ./packages/ts-type-expand/LICENSE ${EXTENSION_TMP_DIR}
cp -r ./packages/ts-type-expand/dist ${EXTENSION_TMP_DIR}
cp -r ./packages/ts-type-expand/resources ${EXTENSION_TMP_DIR}

# pack した ts-type-expand-plugin をローカルインストール
pushd ${EXTENSION_TMP_DIR}
npm i $ts_type_expand_plugin_packed
pnpm vsce package --no-yarn
