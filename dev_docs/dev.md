# 開発する

## 構成メモ

- それぞれの package を esbuild でビルドしている
- npm module も含めてバンドルしている(配布先で node_modules を用意したくないため)

## 開発するには

- launch.json に書いてあるのは指定のトランスパイル済みファイルを見てねってことだけなので、watch は自前で立てる必要あり
  - root の `yarn dev` で起動する
