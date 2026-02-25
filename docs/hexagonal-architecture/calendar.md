# カレンダービュー機能の処理フロー

## 概要

勤怠履歴を「シンプル（テーブル）」と「モダン（カレンダー）」の 2 つのビューで切り替えて表示する機能。
ヘッダー右端のボタンで切り替え、初期表示はランダム（A/B テスト用）。

---

## アーキテクチャ上の位置づけ

カレンダービュー切り替えは **純粋なクライアント側 UI の関心事**。
domain / application / infrastructure は一切変更しない。

```
domain/         ← 変更なし（business logic）
application/    ← 変更なし（use cases）
infrastructure/ ← 変更なし（repository, clock）
contracts/      ← 変更なし（TodayResponse 型を使うだけ）

presentation/               ← ここだけ変更
  store/
    viewModeStore.ts        ← NEW: ビュー切り替え状態（Zustand）
  parts/
    CalendarView.tsx        ← NEW: カレンダーグリッド（モダンビュー）
    HistoryTable.tsx        ← 既存（シンプルビュー・変更なし）
  AttendancePage.tsx        ← viewMode に応じてビュー切り替え
src/
  components/
    Header.tsx              ← 右端にビュー切り替えボタンを追加
```

---

## 状態管理: viewModeStore（Zustand）

```
Zustand store
┌─────────────────────────────────────┐
│ viewMode: "simple" | "modern"       │
│   初期値: getInitialViewMode()       │
│   → Math.random() < 0.5            │
│   → 50% で "simple" or "modern"    │
│                                     │
│ toggleViewMode()                    │
│   "simple" → "modern"               │
│   "modern" → "simple"               │
└─────────────────────────────────────┘
```

### A/B テストの考え方

```
訪問
  │
  ├─ 50% → viewMode = "simple"  （テーブル表示）
  └─ 50% → viewMode = "modern"  （カレンダー表示）

将来: どちらの UI が有料登録率・継続率が高いかを計測して
      勝者のビューをデフォルトにする
```

---

## データフロー

```
useAttendanceHistory()          ← TanStack Query（変更なし）
    │ GET /api/attendance/history
    │     └─ attendanceService.getHistory()
    │             └─ repo.getHistory()
    ▼
history.data.records: TodayResponse[]
    │
    ├─ viewMode === "simple"
    │     └─► HistoryTable（テーブル形式）
    │
    └─ viewMode === "modern"
          └─► CalendarView（月次カレンダー形式）
```

### CalendarView の内部処理

```
records: TodayResponse[]
    │
    ▼
recordMap: Map<dateStr, TodayResponse>
    // "2026-02-25" → record という O(1) ルックアップ用 Map
    │
    ▼
カレンダーセル生成
    ├─ displayYear, displayMonth の状態（useState）
    ├─ 月の1日の曜日を計算 → 先頭の空セル数を決定
    ├─ daysInMonth 個の日付セル
    └─ 末尾の空セルで 7 の倍数に揃える
    │
    ▼
各セルの描画
    ├─ recordMap.get(dateStr) でレコードを取得
    ├─ status に応じた背景色
    │     "finished"  → 緑系
    │     "working"   → 青系
    │     "on_break"  → 黄色系
    ├─ 今日の日付 → ring-2 で強調
    └─ 退勤済みの場合 → formatDuration(workMinutes) を表示
```

---

## ビュー切り替えの流れ

```
ユーザー: ヘッダー右端のボタンをクリック
    │
    ▼
Header.tsx
    toggleViewMode()  ← useViewModeStore から取得
    │
    ▼
viewModeStore.ts
    set({ viewMode: "simple" → "modern"  OR  "modern" → "simple" })
    │
    ▼
AttendancePage.tsx
    viewMode が変わる → React が再レンダリング
    │
    ├─ "simple" → HistoryTable をレンダリング
    └─ "modern" → CalendarView をレンダリング
```

---

## ヘキサゴナルアーキテクチャの観点

| 層 | 変更 | 理由 |
|---|---|---|
| domain | なし | ビュー切り替えは業務ロジックに影響しない |
| application | なし | ユースケース（clockIn/clockOut 等）は変わらない |
| infrastructure | なし | データ取得元・保存先は変わらない |
| contracts | なし | API レスポンス型（TodayResponse）をそのまま利用 |
| presentation | あり | UI の表示形式を追加するのは presentation の責務 |

**ポートとアダプターの分離が機能している例**:
`useAttendanceHistory()` が返す `TodayResponse[]` という型（ポート）が変わらないため、
CalendarView（アダプター）はその型を受け取るだけで既存の server-fns・service と連携できる。
