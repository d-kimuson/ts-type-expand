# デプロイ手順

## CHANGELOG の作成

```markdown
## [x.x.x] - 202X-XX-XX

### Added

### Changed

### Removed
```

## Web での操作

- [vsce のページ](https://dev.azure.com/kimuson/vsce) へ行く
- [公式ドキュメント](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions) を参考にスコープを設定して作成する

## CLI からの操作

```bash
$ vsce login kimuson
Publisher 'kimuson' is already known
Do you want to overwrite its PAT? [y/N] y
https://marketplace.visualstudio.com/manage/publishers/
Personal Access Token for publisher 'kimuson': ****************************************************

The Personal Access Token verification succeeded for the publisher 'kimuson'.

$ ./bin/deploy.sh
current version is 1.0.2
which version to update ? >> 1.0.3
# ...
 DONE  Published kimuson.ts-type-expand v1.0.3.
```

## release の作成

- title: `vx.x.x release`
- CHANGELOG の説明を持ってくる
