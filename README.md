# Schemock

Schemockは、科学的な図の構図をオフラインで調整するエディタです。
デスクトップ版Google Chromeで図のJSONを編集し、エージェントと手動でやり取りして、採用した結果から編集可能なTypstを生成します。
ノード・エッジ図と定性的なスペクトル・プロファイルに対応します。

## リリース候補 0.1.0 / フォーマット 2

このチェックアウトには未公開のリリース候補が含まれています。対応ブラウザはデスクトップ版Chromeです。
`dist/schemock-v0.1.0.html`はアプリ、`dist/schemock-v0.1.0-data.tar.gz`はフォーマットとサンプルなどを収めたアーカイブ、`dist/SHA256SUMS`はそれらのチェックサムです。
リリースをダウンロードしてチェックサムを確認し、ChromeでHTMLを開いて、**新しい図を開く**からJSONを選択してください。

位置やサイズ、ラベル、色、経路や曲線の制御点を編集でき、履歴操作やバリアントごとのリセットもできます。
同じ図の編集を再開するときは**保存状態を復元**を、別の図や構造を変更したリビジョンを開くときは**新しい図を開く**を使います。
JSONにはすべてのバリアントを、PNGには選択中の構図をフレームの縦横2倍のサイズで保存します。
旧v1形式からの移行方法は[旧形式からの移行](docs/migration-v1.md)を参照してください。

## 開発（Node >=22、Chromeのインストールが必要）

追加パッケージのインストールなしで実行できます。

```fish
npm test
npm run preview -- --input examples/node-edge.json --output-dir /tmp/schemock-previews
npm run verify:release
```

`npm test`はロジックとビルド済みHTMLを検証し、ヘッドレスChromeでダウンロードやUI、引き継ぎなどを確認します。
保存ダイアログとOS上のIMEは[リリース手順](docs/releasing.md)に従って手動で確認します。
生成される`dist/`と`artifacts/`はGitの管理対象外です。

詳細は[データフォーマットv2](docs/data-format-v2.md)、[エージェントとのワークフロー](docs/agent-workflow.md)、[アーキテクチャ](docs/architecture.md)を参照してください。
ソースとフィクスチャはdotfiles-public PR #36のhead `570535453ec3335cf76b310b8ae604aa4ab3c2ff`を基にしています。
