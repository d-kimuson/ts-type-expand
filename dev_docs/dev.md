# 開発する

## 構成メモ

- それぞれの package を esbuild でビルドしている
- npm module も含めてバンドルしている(配布先で node_modules を用意したくないため)

## 開発するには

- 開発モードでの拡張機能の起動は launch.json に書かれいている `Run Extension` で起動する
  - preLaunchTask で defaultBuildTask が指定されており、tasks.json に `npm run dev` がデフォルトタスクとして追加されているので launch されれば開発サーバーが起動した状態で拡張機能を試せる
