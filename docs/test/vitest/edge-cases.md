# Vitest エッジケーステスト解説

**ファイル**: `src/features/attendance/domain/logic/worktime.edge.test.ts`

---

## Why: なぜこのテストを追加したか

既存の `worktime.test.ts` は「よくある入力」を中心にテストしている。しかし実際のシステムでは
「想定外の入力」や「ギリギリの値」でバグが発生することが多い。

このテストファイルでは、既存テストでカバーされていない 3 つの「境界値・異常値」を追加した。

| テスト | カバーする状況 |
|---|---|
| 出退勤時刻が同じ | 0 分の勤務が正しく扱われるか（負にならないか） |
| `formatDuration(1)` | 最小単位 1 分が正しくフォーマットされるか |
| breakEnd < breakStart | 異常なデータでも合計が負にならないか |

---

## コード

```typescript
import { Option } from "effect"
// ↑ calculateWorkDuration は Option<WorkDuration> を返すため
//   値を取り出す Option API が必要

import { describe, expect, it } from "vitest"
// ↑ Vitest のテスト構造 API をインポート
//   describe: テストグループ / expect: 検証 / it: 個別テスト

import { calculateTotalBreakMinutes, calculateWorkDuration, formatDuration } from "./worktime"
// ↑ テスト対象の関数を同ディレクトリからインポート

describe("calculateWorkDuration エッジケース", () => {
  // ↑ テストグループの名前。テスト結果の出力に表示される

  it("出勤時刻と退勤時刻が同じ → Option.some({ totalMinutes: 0 })", () => {
    // ↑ 1 本のテストケース。文字列は「何をテストしているか」の説明

    const t = new Date("2026-02-25T09:00:00+09:00")
    // ↑ 同じ Date を clockIn / clockOut 両方に使う準備

    const result = calculateWorkDuration(t, t)
    // ↑ 同じ時刻を渡す。差は 0 分なので totalMinutes = 0 になるはず

    expect(Option.isSome(result)).toBe(true)
    // ↑ 0 分は「有効な勤務時間」として Option.some() が返ることを確認
    //   (totalMinutes >= 0 の条件を満たすため none にはならない)

    const duration = Option.getOrThrow(result)
    // ↑ Option の中身を取り出す。Option.none() なら例外を投げてテスト失敗になる

    expect(duration.totalMinutes).toBe(0)
    // ↑ 合計 0 分
    expect(duration.hours).toBe(0)
    // ↑ 0 時間
    expect(duration.minutes).toBe(0)
    // ↑ 0 分
  })
})

describe("formatDuration エッジケース", () => {
  it("1分 → '1分'", () => {
    // ↑ hours=0, mins=1 の場合のフォーマット確認

    const result = formatDuration(1)
    // ↑ 1 分を渡す → pipe 内で { hours: 0, mins: 1 } に分解される

    expect(result).toBe("1分")
    // ↑ "0時間1分" でも "1時間" でもなく "1分" が返ることを確認
  })
})

describe("calculateTotalBreakMinutes エッジケース", () => {
  it("breakEnd が breakStart より前の異常値 → 0分（負になってクランプされる）", () => {
    // ↑ Math.max(0, ...) のガードが正しく機能するかを確認

    const breaks = [
      {
        breakStart: new Date("2026-02-25T13:00:00+09:00"),
        // ↑ 13:00 開始
        breakEnd: new Date("2026-02-25T12:00:00+09:00"),
        // ↑ 12:00 終了（開始より前 → 異常値）
      },
    ]

    const result = calculateTotalBreakMinutes(breaks)
    // ↑ 計算上は 12:00 - 13:00 = -60分になるが...

    expect(result).toBe(0)
    // ↑ Math.max(0, -60) = 0 にクランプされるため 0 分が返る
  })
})
```

---

## 概念メモ

### 境界値テスト (Boundary Value Testing)

バグはしばしば「ちょうど 0」「ちょうど 1」「最大値ちょうど」といった**境界**で発生する。

```
         NG 領域        |  OK 領域
  totalMinutes < 0      | totalMinutes >= 0
                   ↑
               境界値: 0
```

- `totalMinutes = -1` → `Option.none()` （負の値）
- `totalMinutes = 0`  → `Option.some({...})` ← **このテストで確認**
- `totalMinutes = 1`  → `Option.some({...})`

`0` を境界値としてテストすることで、`if (totalMinutes < 0)` の条件が正しいことを確認できる。

### 異常値ガードテスト (Guard Test)

実装内部で異常入力を安全に処理していることを確認するテスト。

```typescript
// worktime.ts の実装
return total + Math.max(0, minutes)
//             ^^^^^^^^^^^^^^^^^^^
//             負の値を 0 にクランプするガード
```

このガードのテストを書いておくと、将来誰かが `Math.max(0, ...)` を削除したとき
テストが失敗して問題に気づける。

### ホワイトボックステスト vs ブラックボックステスト

- **ブラックボックス**: 実装を見ずに「入力 → 期待出力」だけを確認
- **ホワイトボックス**: 実装のコードを見て、特定のブランチ・条件を意図的にカバー

エッジケーステスト 3 は「`Math.max(0, ...)` というコードがある」と知った上で書いているため
**ホワイトボックステスト** の性質を持つ。
