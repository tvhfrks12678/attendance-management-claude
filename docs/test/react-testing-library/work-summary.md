# React Testing Library テスト解説

**ファイル**: `src/features/attendance/presentation/parts/WorkSummary.test.tsx`

---

## Why: なぜこのテストを追加したか

`WorkSummary` コンポーネントはステータスや時刻情報を表示する純粋なプレゼンテーション層。
ロジックは `formatDuration`（ドメイン層）に委譲しており、このコンポーネント固有の責務は
「条件に応じた表示・非表示の制御」だけ。

具体的には以下の 3 点が正しく動くことを UI レベルで確認する:

| テスト | 確認すること |
|---|---|
| clockIn あり | 「出勤時刻」行が表示される |
| clockOut なし | 「退勤時刻」行が表示されない |
| workMinutes = 480 | "8時間" がフォーマットされて表示される |

**`WorkSummary` を選んだ理由**: hooks や Context を持たない純粋な表示コンポーネントのため、
モックなしでシンプルにテストできる（初めての RTL テストとして理解しやすい）。

---

## コード

```tsx
import { render, screen } from "@testing-library/react"
// ↑ render: コンポーネントを jsdom の仮想 DOM にマウントする関数
//   screen: マウントされた DOM を検索するクエリ集合
//           document.body 全体を検索対象にしたオブジェクト

import { describe, expect, it } from "vitest"
// ↑ テスト構造 API（describe: グループ化 / it: 個別テスト / expect: 検証）

import { WorkSummary } from "./WorkSummary"
// ↑ テスト対象のコンポーネントをインポート

const baseRecord = {
  date: "2026-02-25",
  // ↑ 日付文字列（表示には使われないが型の必須フィールド）
  status: "working" as const,
  // ↑ "as const" で型を "working" リテラル型に絞る（"string" にならない）
  clockIn: "2026-02-25T09:00:00.000Z",
  // ↑ 出勤時刻（ISO 8601 形式の文字列）
  clockOut: null,
  // ↑ まだ退勤していない
  workMinutes: null,
  // ↑ 勤務時間未確定（退勤前）
  breaks: [],
  // ↑ 休憩なし
  breakMinutes: null,
  // ↑ 休憩時間合計未確定
}

describe("WorkSummary", () => {
  it("clockIn があるとき、出勤時刻が表示される", () => {
    render(<WorkSummary record={baseRecord} />)
    // ↑ jsdom にコンポーネントをマウント。ブラウザなしで React をレンダリングできる。

    const label = screen.getByText("出勤時刻")
    // ↑ screen.getByText(): DOM から「出勤時刻」というテキストを持つ要素を探す
    //   見つからない場合: 例外を投げてテスト失敗（これが getBy* の特性）
    //   見つかった場合: その HTMLElement を返す

    expect(label).toBeDefined()
    // ↑ 要素が定義されている（存在する）ことを確認
  })

  it("clockOut が null のとき、退勤時刻は表示されない", () => {
    render(<WorkSummary record={{ ...baseRecord, clockOut: null }} />)
    // ↑ スプレッド構文で baseRecord をコピー。clockOut を null に明示。

    const label = screen.queryByText("退勤時刻")
    // ↑ screen.queryByText(): 要素がなければ null を返す（getBy* と違い例外を投げない）
    //   「存在しないことを確認したい」ときに使う

    expect(label).toBeNull()
    // ↑ null であること（DOM に要素がないこと）を確認
  })

  it("workMinutes = 480 のとき、勤務時間 '8時間' が表示される", () => {
    render(
      <WorkSummary
        record={{
          ...baseRecord,
          clockOut: "2026-02-25T18:00:00.000Z",
          // ↑ 退勤時刻を設定することで workMinutes 行が表示されるようになる
          workMinutes: 480,
          // ↑ 8時間 = 480分。formatDuration(480) = "8時間" になることを期待
          status: "finished" as const,
          // ↑ 退勤済みステータス
        }}
      />,
    )

    const label = screen.getByText("勤務時間")
    // ↑ "勤務時間" ラベルが存在することを確認

    expect(label).toBeDefined()

    const value = screen.getByText("8時間")
    // ↑ formatDuration(480) の結果 "8時間" が表示されることを確認
    //   UI コンポーネントとドメインロジックの結合を間接的に検証している

    expect(value).toBeDefined()
  })
})
```

---

## 概念メモ

### getByText vs queryByText の使い分け

RTL のクエリには `getBy*` と `queryBy*` の 2 種類がある。

| クエリ | 要素なし時の挙動 | 使いどころ |
|---|---|---|
| `getByText` | **例外を投げる**（テスト失敗） | 要素が存在するはずのとき |
| `queryByText` | `null` を返す | 要素が存在しないことを確認したいとき |

```typescript
// ✅ 要素が存在するはずの確認
const label = screen.getByText("出勤時刻")   // なければテスト失敗

// ✅ 要素が存在しないことの確認
const label = screen.queryByText("退勤時刻")  // なければ null が返る
expect(label).toBeNull()
```

### jsdom とは

Node.js 上でブラウザの DOM を模倣するライブラリ。React Testing Library は jsdom 上で
コンポーネントをレンダリングし、実際のブラウザがなくてもテストを高速に実行できる。

```
テスト環境
┌──────────────────────────────────┐
│  Node.js                         │
│  ┌────────────────────────────┐  │
│  │ jsdom（DOM シミュレーター）  │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ React コンポーネント   │  │  │
│  │  └──────────────────────┘  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### スナップショットテスト vs クエリテスト

| 方式 | 説明 | 向き不向き |
|---|---|---|
| **クエリテスト**（今回） | 特定のテキスト・要素を検索して確認 | 動作の意図が明確、変更に強い |
| **スナップショットテスト** | HTML 全体を文字列として保存・比較 | UI の回帰検知に便利、変更のたびに更新が必要 |

今回はクエリテストを採用。「何が表示されるか」を直接テストするため、
コンポーネントの構造が変わっても意図した情報が表示されていれば通過する。
