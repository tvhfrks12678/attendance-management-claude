# 概要
- 出勤管理サイト
- AIにコードを書かせて実装（Claude Codeを使用）

  
<img width="400" height="801" alt="スクリーンショット 2026-02-25 19 52 07" src="https://github.com/user-attachments/assets/c203a2ab-4c6e-40a8-b063-cb9701f54e45" />


# URL
- [出勤管理](https://attendance-management-claude.tvhfrks12678.workers.dev/)

# 技術スタック
- 言語: TypeScript
- フレームワーク: TanStack Start（React 19）
- UI: shadcn/ui + Tailwind CSS v4
- 関数型プログラミング: Effect-ts
- Test: Vitest React Testing Library Playwright
- AI: Claude Code
- インフラ: Cloudflare Workers

## AIエージェント向け: Vercel React Best Practices Skill の導入

`react-best-practices` をエージェントで使う場合は、以下のコマンドで Agent Skills を追加します。

```bash
npx skills add vercel-labs/agent-skills
```

導入後、Codex / Claude Code / Cursor などで React レビュー時に、
ウォーターフォール削減・バンドルサイズ最適化・再レンダー抑制のルールを参照できるようになります。

### 運用ルール（コミット・PR）

- 作業完了は **PR作成まで** を含む（実装＋コミットだけで終了しない）
- コミットメッセージは作業時間を含む形式にする

```text
chore(claude): [00:05:00] add pr-required rule as task completion definition
```

フォーマット:

```text
<type>(<scope>): [HH:MM:SS] <description>
```


## Browser/Playwright MCP（UI検証）の設定

打刻ボタン、履歴テーブル、現在時刻表示などの **実ブラウザ検証** を行えるように、
このリポジトリに MCP サーバー設定を追加しました。

### 追加した設定

- `.mcp.json`
  - `browser-playwright` サーバーを定義
  - `npx -y @playwright/mcp@latest --browser chromium --headless` で起動
- `package.json` scripts
  - `pnpm run mcp:browser`（headless）
  - `pnpm run mcp:browser:headed`（headed）

### 使い方

1. 開発サーバーを起動

```bash
pnpm dev
```

2. MCP サーバーを起動

```bash
pnpm run mcp:browser
```

3. MCP 対応クライアント（Claude Code / Codex / Cursor など）で
   `browser-playwright` サーバーに接続して UI 検証を実施

### 確認観点の例

- 打刻ボタン（出勤 / 退勤）がクリックできるか
- 履歴テーブルが正しく表示されるか
- 現在時刻表示が崩れずに更新されるか
- スマホ幅でレイアウト崩れがないか



# ディレクトリ構成

```
attendance-management-claude/
├── src/
│   ├── components/
│   │   └── ui/                        # shadcn/ui 共通UIコンポーネント
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── table.tsx
│   │       ├── dialog.tsx
│   │       └── separator.tsx
│   │
│   ├── features/
│   │   └── attendance/                # 出勤管理機能（ヘキサゴナルアーキテクチャ）
│   │       │
│   │       ├── contracts/             # API契約（唯一の真実）
│   │       │   └── attendance.ts      # zod schema + リクエスト/レスポンス型定義
│   │       │
│   │       ├── domain/                # フレームワーク完全非依存
│   │       │   ├── entities/
│   │       │   │   └── attendance.ts  # AttendanceDay, AttendanceStatus 等の内部型
│   │       │   ├── logic/
│   │       │   │   ├── attendance.ts  # canClockIn / canClockOut / getStatus（純粋関数）
│   │       │   │   ├── attendance.test.ts
│   │       │   │   ├── worktime.ts    # calculateWorkDuration / formatDuration（純粋関数）
│   │       │   │   └── worktime.test.ts
│   │       │   └── ports/
│   │       │       ├── attendanceRepository.ts  # interface AttendanceRepository
│   │       │       └── clock.ts                 # interface Clock（時刻抽象化）
│   │       │
│   │       ├── application/           # フレームワーク非依存
│   │       │   └── services/
│   │       │       └── attendanceService.ts  # ユースケース実行（clockIn/clockOut等）
│   │       │
│   │       ├── infrastructure/        # 外部依存の実装
│   │       │   ├── repositories/
│   │       │   │   ├── inMemoryAttendanceRepository.ts  # インメモリ実装（現在使用中）
│   │       │   │   └── drizzleAttendanceRepository.ts   # Turso + Drizzle 実装（将来用）
│   │       │   ├── clock/
│   │       │   │   └── systemClock.ts   # Clock interface の実装（実時刻を返す）
│   │       │   ├── data/
│   │       │   │   └── attendanceData.ts  # ベタ書き初期データ（過去の履歴）
│   │       │   ├── db/
│   │       │   │   ├── client.ts    # Turso 接続設定（将来用）
│   │       │   │   └── schema.ts    # Drizzle スキーマ定義（将来用）
│   │       │   ├── getRepository.ts  # リポジトリ実装の切り替えポイント
│   │       │   └── getClock.ts       # Clock実装の切り替えポイント
│   │       │
│   │       ├── presentation/          # React UI
│   │       │   ├── hooks/
│   │       │   │   └── useAttendance.ts  # TanStack Query による API 呼び出し
│   │       │   ├── parts/
│   │       │   │   ├── StatusCard.tsx    # ステータス表示（未出勤/勤務中/退勤済み）
│   │       │   │   ├── ClockButton.tsx   # 出勤/退勤ボタン（確認ダイアログ付き）
│   │       │   │   ├── WorkSummary.tsx   # 今日の勤務時間サマリー
│   │       │   │   ├── HistoryTable.tsx  # 勤怠履歴テーブル
│   │       │   │   └── CurrentTime.tsx   # 現在時刻のリアルタイム表示（1秒更新）
│   │       │   └── AttendancePage.tsx    # ページ全体の組み立て
│   │       │
│   │       └── server-fns/            # TanStack Start サーバー関数（APIエンドポイント）
│   │           ├── today.ts           # GET  /api/attendance/today
│   │           ├── clock-in.ts        # POST /api/attendance/clock-in
│   │           ├── clock-out.ts       # POST /api/attendance/clock-out
│   │           ├── break-start.ts     # POST /api/attendance/break-start
│   │           ├── break-end.ts       # POST /api/attendance/break-end
│   │           └── history.ts         # GET  /api/attendance/history
│   │
│   ├── routes/
│   │   ├── __root.tsx   # ルートレイアウト（Header等の共通UI）
│   │   └── index.tsx    # ルートページ（AttendancePage をマウント）
│   │
│   └── router.tsx       # TanStack Router 設定
│
├── e2e/
│   └── attendance.spec.ts          # Playwright E2E テスト
│
├── docs/
│   ├── effect-ts/                  # Effect.ts 段階的導入ログ（Option / pipe / Effect）
│   ├── di/                         # 依存性注入パターン解説
│   ├── hexagonal-architecture/     # ヘキサゴナルアーキテクチャ処理フロー解説
│   └── test/                       # テスト解説（Vitest / React Testing Library / Playwright）
│
├── prompts/
│   ├── attendance-instructions.md  # Claude Code 向け実装指示書
│   └── attendance-spec.md          # 実装仕様書（API仕様・型定義・UIイメージ等）
│
├── playwright.config.ts  # Playwright 設定
├── vitest.config.ts      # Vitest 設定
├── wrangler.jsonc        # Cloudflare Workers デプロイ設定
└── package.json
```

## アーキテクチャの考え方

ヘキサゴナルアーキテクチャ（ポート＆アダプターパターン）を採用し、ビジネスロジックとフレームワーク依存を明確に分離しています。

| 層 | ディレクトリ | 役割 |
|---|---|---|
| ドメイン層 | `domain/` | フレームワーク完全非依存。打刻の可否判定・勤務時間計算などの純粋な業務ロジック |
| アプリケーション層 | `application/` | フレームワーク非依存。ユースケースの実行（リポジトリ取得→ロジック適用→結果返却） |
| インフラ層 | `infrastructure/` | 外部依存の実装。現在はインメモリ。将来は Turso + Drizzle に差し替え可能 |
| プレゼンテーション層 | `presentation/` | React UI。APIを TanStack Query で叩くだけで、ビジネスロジックに直接触らない |
| API契約 | `contracts/` | zod schema で定義されたリクエスト/レスポンス型。クライアント・サーバー共有の唯一の真実 |


# 処理の流れ

## 画面表示〜打刻までの全体フロー

```
ユーザー操作                  クライアント                      サーバー（server-fns）
─────────────────────────────────────────────────────────────────────────────────────
                              index.tsx
                                 │
                                 ▼
1. ページアクセス          AttendancePage
                                 │ useAttendance (TanStack Query)
                                 │ GET /api/attendance/today ───────► today.ts
                                 │                                       │ attendanceService.getToday()
                                 │                                       │   ├─ getRepository() → InMemoryRepo
                                 │                                       │   ├─ getClock()       → SystemClock
                                 │                                       │   └─ repo.getToday(date)
                                 │ ◄── { status, clockIn, … } ──────────┘
                                 │
                                 ▼
2. ステータスに応じた表示   StatusCard  ← 未出勤/勤務中/退勤済みを表示
                            ClockButton ← ステータスに応じてボタン切り替え
                            WorkSummary ← 勤務時間サマリー
                            CurrentTime ← 1秒ごとに現在時刻更新
                                 │
                                 │ GET /api/attendance/history ─────► history.ts
                                 │                                       │ attendanceService.getHistory()
                                 │                                       │   └─ repo.getHistory()
                                 │ ◄── { records: [...] } ───────────────┘
                                 │
                                 ▼
3. 出勤ボタン押下          確認ダイアログ表示
       │
       │（確認）
       ▼
                                 │ POST /api/attendance/clock-in ───► clock-in.ts
                                 │                                       │ attendanceService.clockIn()
                                 │                                       │   ├─ repo.getToday()
                                 │                                       │   ├─ canClockIn(today) ← domain ロジック
                                 │                                       │   ├─ clock.now()       ← SystemClock
                                 │                                       │   └─ repo.save(updated)
                                 │ ◄── { success: true, clockIn } ───────┘
                                 │
                                 ▼
4. 退勤ボタン押下          確認ダイアログ表示
       │
       │（確認）
       ▼
                                 │ POST /api/attendance/clock-out ──► clock-out.ts
                                 │                                       │ attendanceService.clockOut()
                                 │                                       │   ├─ repo.getToday()
                                 │                                       │   ├─ canClockOut(today) ← domain ロジック
                                 │                                       │   ├─ clock.now()
                                 │                                       │   ├─ calculateWorkDuration() ← domain ロジック
                                 │                                       │   └─ repo.save(updated)
                                 │ ◄── { success: true, workMinutes } ───┘
                                 │
                                 ▼
                         画面を再取得（invalidateQueries）→ ステータス更新
```

## ドメインロジックの処理フロー

```
打刻リクエスト受信（clock-in.ts / clock-out.ts）
        │
        ▼
attendanceService.clockIn() / attendanceService.clockOut()
        │
        ├─ 1. repo.getToday(dateStr) で今日の勤怠レコードを取得
        │
        ├─ 2. domain/logic/attendance.ts で打刻可否を判定
        │       canClockIn(today)  → 未出勤(not_started) のときだけ true
        │       canClockOut(today) → 勤務中(working) のときだけ true
        │
        ├─ 3. clock.now() でサーバー時刻を取得（クライアント時刻は使わない）
        │
        ├─ 4. レコードを更新
        │       clockIn:  status → "working",  clockIn = now
        │       clockOut: status → "finished", clockOut = now, workMinutes = 計算値
        │
        ├─ 5. domain/logic/worktime.ts で勤務時間を計算（退勤時のみ）
        │       calculateWorkDuration(clockIn, clockOut) → WorkDuration
        │
        └─ 6. repo.save(updated) で保存し、結果を返す
```

## データの永続化（現在 → 将来）

```
現在（インメモリ）                    将来（Turso + Drizzle ORM）
──────────────────────                ──────────────────────────
infrastructure/
  getRepository.ts                      getRepository.ts
    └─ new InMemoryRepo()                 └─ new DrizzleRepo(client)
                                                    │
  repositories/                          repositories/
    inMemoryAttendanceRepository.ts ─►     drizzleAttendanceRepository.ts
    （メモリ上に保持、再起動でリセット）   （Turso SQLite に永続化）

※ domain/ application/ presentation/ contracts/ は変更不要
※ getRepository.ts の切り替え1行だけで移行完了
```


# Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Testing

このプロジェクトは 3 つのテストレイヤーを持ちます。

| レイヤー | フレームワーク | 対象 | コマンド |
|---|---|---|---|
| ユニット・コンポーネント | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) | ドメインロジック・UI コンポーネント | `pnpm test` |
| E2E | [Playwright](https://playwright.dev/) | ブラウザ上のユーザー操作 | `pnpm exec playwright test` |

```bash
# ユニット・コンポーネントテストを実行
pnpm test

# E2E テストを実行（初回は dev サーバーが自動起動）
pnpm exec playwright test
```

テスト解説ドキュメント: [`docs/test/`](./docs/test/)

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:

```bash
pnpm lint
pnpm format
pnpm check
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
