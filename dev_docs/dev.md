# 開発する

## 構成メモ

- それぞれの package を esbuild でビルドしている
- npm module も含めてバンドルしている(配布先で node_modules を用意したくないため)
  - ts-type-expand-plugin は除く(直接参照ではなく規約で参照されるのでバンドルしても意味がない)
- pnpm workspace を使っているが vsce package や publish が対応していないのでリリース用にはやや特殊なことをしている
  - 必要なファイルを extension-tmp にコピーして ts-type-expand-plugin のみ install した状態を作り package している
  - vsce package 側のサポートが充実したらやめたい

## 開発するには

- launch.json に書いてあるのは指定のトランスパイル済みファイルを見てねってことだけなので、watch は自前で立てる必要あり
  - root の `yarn dev` で起動する
- 実際にリリースする前の確認は

### リリース前の動作確認

```bash
$ ./scripts/package.sh 0.0.0
$ code --install-extension ./extension-tmp/ts-type-expand-0.0.0.vsix
```
