# このプロジェクトで使うおすすめ MCP

このリポジトリ（TanStack Start + Cloudflare Workers）では、次の MCP を優先して使うのがおすすめです。

## 推奨 MCP

1. **GitHub MCP（最優先）**
   - 目的: Issue 確認、PR 作成、レビューコメントの一元化
   - 効果: 実装→PR までを同じフローで完結できる

2. **Filesystem MCP（ローカル解析）**
   - 目的: `src/features/attendance` 配下の構造理解、影響範囲調査
   - 効果: 大きい差分でも読み取り漏れを減らせる

3. **Browser/Playwright MCP（UI検証）**
   - 目的: 打刻ボタン、履歴テーブル、現在時刻表示などの動作確認
   - 効果: 見た目崩れやクリック不可などを実ブラウザで検証できる

4. **Cloudflare MCP（デプロイ運用）**
   - 目的: Workers のデプロイ状態・環境変数・ログの確認
   - 効果: 本番相当の切り分けが速くなる

## まず何をすればよいか（導入順）

1. GitHub MCP を接続して、Issue/PR ワークフローを先に固める
2. Browser MCP を接続して、UI 変更時のスクリーンショット確認を標準化する
3. Cloudflare MCP を接続して、Workers 側のログ確認を手元フローに組み込む

## このプロジェクト向けの使い分け例

- **仕様確認〜実装前**: Filesystem MCP で既存ロジック調査
- **実装中**: GitHub MCP で Issue 要件との差分を常時確認
- **実装後**: Browser MCP で動作確認 + スクショ取得
- **リリース前**: Cloudflare MCP でデプロイ状態とログ確認
