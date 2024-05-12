# 開発する

## 構成メモ

- それぞれの package を esbuild でビルドしている
- npm module も含めてバンドルしている(配布先で node_modules を用意したくないため)
  - ts-type-expand-plugin は除く(直接参照ではなく規約で参照されるのでバンドルしても意味がない)
- pnpm workspace を使っているが vsce package や publish が対応していないのでリリース用にはやや特殊なことをしている
  - 必要なファイルを extension-tmp にコピーして ts-type-expand-plugin のみ install した状態を作り package している
  - vsce package 側のサポートが充実したらやめたい

## 開発するには

- 開発モードでの拡張機能の起動は launch.json に書かれいている `Run Extension` で起動する
  - preLaunchTask で `pnpm dev` が起動されるほっとリロードが効く状態で拡張機能を試せる(拡張機能側への反映には再読み込みは必要)

### リリース前の動作確認

```bash
$ ./scripts/local-trial.sh
```
