# CLAUDE.md

## 必ず参照するドキュメント

Every task must begin by reading and following these documents:

- `.claude/attendance-instructions.md` — 開発ルール・コーディング規約
- `attendance-spec.md` — 機能仕様書

Do NOT start coding until you have read both files completely.

## Git ワークフロー（必須）

Every task MUST follow this workflow:

### 0. 作業前の準備（必須）

作業を開始する前に、必ず最新の `main` ブランチに切り替えて最新化する:

```bash
git switch main
git pull origin main
```

### 1. Issue の確認

- GitHub Issue に基づくタスクの場合、`gh issue view <issue番号>` で内容を確認する
- Issue の要件を理解してから作業を開始する

### 2. ブランチ作成

- `main` から必ず新しいブランチを切る
- Issue がある場合: `feature/<issue番号>-<簡潔な機能名>` (例: `feature/42-add-break-time`)
- Issue がない場合: `feature/<簡潔な機能名>` (例: `feature/add-break-time`)
- 既存ブランチで直接作業しない

### 3. 実装

- `.claude/attendance-instructions.md` と `attendance-spec.md` に従って実装
- こまめにコミット（意味のある単位で）

### 4. Pull Request 作成

- 実装完了後、必ず `gh pr create` で PR を作成する
- PRタイトル: 変更内容を簡潔に記述
- PR本文: 変更概要、変更点リスト、テスト内容を含める
- Issue がある場合、PR本文に `Closes #<issue番号>` を含める（マージ時に自動クローズされる）

### 5. セルフレビュー

PR作成後、自分自身でレビューを行う:

1. `gh pr diff <PR番号>` で差分を確認
2. 以下の観点でレビュー:
   - attendance-spec.md の仕様を満たしているか
   - attendance-instructions.md のルールに違反していないか
   - バグ、タイポ、不要なコードがないか
   - エッジケースの考慮漏れがないか
3. 問題があれば修正コミットを追加
4. レビュー結果を `gh pr review <PR番号> --body "レビュー内容"` でコメント
5. 問題なければ `gh pr review <PR番号> --approve --body "LGTM: レビュー観点と確認結果"` で承認

## コミットメッセージ規約

Follow Conventional Commits format:

```
<type>(<scope>): [HH:MM:SS] <description> #<issue番号>
```

### Type（必須）

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: バグ修正でも機能追加でもないコード変更
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツール設定の変更
- `ci`: CI/CD設定の変更

### Scope（任意だが推奨）

変更対象を示す（例: `attendance`, `break`, `claude`, `api`）

### 作業時間（必須）

- 1行目に `[HH:MM:SS]` 形式でそのコミットの作業にかかった時間を記載する
- description の直前に置く
- 形式: `[HH:MM:SS]`（例: `[00:45:12]`, `[01:23:43]`）

### 例

- `feat(break): [00:45:12] add break time input feature #42`
- `fix(attendance): [00:12:30] correct total hours calculation #15`
- `test(break): [00:30:00] add unit tests for break time validation #42`
- `chore(claude): [00:05:00] update claude code settings`

### ルール

- description は英語で、小文字始まり、末尾にピリオドをつけない
- 1行目は50文字以内を目安にする（作業時間を含めて調整）
- 必要に応じて空行の後に本文を追加する
- GitHub Issue に基づくタスクの場合、description の末尾に `#<issue番号>` を付ける
- Issue がないタスク（設定変更等）では issue 番号は不要

## 権限の永続化ルール

When the user selects "Yes, allow all during this session" for any permission prompt,
add that permission rule to `.claude/settings.json` under `permissions.allow` so it
persists across sessions.

Example: if "Yes, allow all during this session" is selected for `Bash(cat:*)`,
update `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(gh:*)",
      "Bash(cat:*)"
    ]
  }
}
```

Always commit this change: `chore(claude): add <permission> to settings.json`
