# Change 1: Option と pipe の導入（worktime.ts）

対象ファイル:
- `src/features/attendance/domain/logic/worktime.ts`
- `src/features/attendance/domain/logic/worktime.test.ts`

---

## 概念メモ（まずここを読む）

### Option とは

「値がある（Some）」か「値がない（None）」かを **型で表現する** データ型。

```
Option<WorkDuration>
  = Option.some({ hours: 9, minutes: 0, totalMinutes: 540 })   // 値がある
  | Option.none()                                               // 値がない
```

**なぜ必要か？**

JavaScript では「値がないこと」を `null` や `undefined` で表現する。
しかし `null` は型システムの外にあるので、うっかり `.totalMinutes` を呼んでも
TypeScript はエラーを出してくれないことがある。

```ts
// 変更前: WorkDuration を直接返す
function calculateWorkDuration(clockIn, clockOut): WorkDuration {
  // clockOut < clockIn のとき totalMinutes が -540 になるが、型は WorkDuration のまま
  return { hours: ..., minutes: ..., totalMinutes: -540 }
}
```

Option を使うと：

```ts
// 変更後: Option<WorkDuration> を返す
function calculateWorkDuration(clockIn, clockOut): Option.Option<WorkDuration> {
  if (clockOut < clockIn) return Option.none()   // 「計算不能」を型で宣言
  return Option.some({ hours: ..., minutes: ..., totalMinutes: 540 })
}
```

呼び出し側は `Option.none()` の可能性を TypeScript が強制的に扱わせる。
「エラーが型の外に漏れない」のが Option の強み。

---

### pipe とは

関数を **左から右へ** 順番に適用するユーティリティ。

```
pipe(x, f, g, h)  ===  h(g(f(x)))
```

「右から左に入れ子になった関数呼び出し」を「左から右の直線的なパイプライン」に変換する。

**変換のイメージ:**

```ts
// 変換前（右から左に読む）
formatString(decompose(minutes))

// 変換後（左から右に読む）
pipe(
  minutes,      // ① 入力
  decompose,    // ② 分解
  formatString  // ③ フォーマット
)
```

---

## Before: 変更前のコード

```ts
// worktime.ts（変更前）

export function calculateWorkDuration(clockIn: Date, clockOut: Date): WorkDuration {
  const totalMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000)
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  }
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}分`
  if (mins === 0) return `${hours}時間`
  return `${hours}時間${mins}分`
}
```

### 問題点

| 問題 | 詳細 |
|------|------|
| **calculateWorkDuration** | `clockOut < clockIn` のとき `totalMinutes` が負になる。戻り値の型 `WorkDuration` は常に「成功した計算結果」を示すので、**型が嘘をついている**。呼び出し側はこの異常ケースを知る手段がない。 |
| **formatDuration** | `const hours = ...` `const mins = ...` という一時変数が散らばり、「計算」「判定」「フォーマット」の3段階が命令型で混在している。処理の流れを追うのに変数を都度確認しなければならない。 |

---

## After: Effect.ts を使った後のコード

```ts
// worktime.ts（変更後）
import { Option, pipe } from "effect"

// ─── calculateWorkDuration ────────────────────────────────────────
export function calculateWorkDuration(
  clockIn: Date,
  clockOut: Date,
): Option.Option<WorkDuration> {
  // ① clockOut - clockIn を「分」に変換
  const totalMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000)

  // ② 負の値 = 無効な入力 → Option.none() で「計算不能」を型で返す
  if (totalMinutes < 0) {
    return Option.none()
  }

  // ③ 有効な結果 → Option.some() で値を包んで返す
  return Option.some({
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  })
}

// ─── formatDuration ───────────────────────────────────────────────
export function formatDuration(minutes: number): string {
  return pipe(
    // ① 入力: 分数（例: 90）
    minutes,

    // ② 分解: 分数を「時間」と「残り分」に分ける（90 → { hours: 1, mins: 30 }）
    (m) => ({ hours: Math.floor(m / 60), mins: m % 60 }),

    // ③ フォーマット: オブジェクトを日本語文字列に変換（"1時間30分"）
    ({ hours, mins }) => {
      if (hours === 0) return `${mins}分`
      if (mins === 0) return `${hours}時間`
      return `${hours}時間${mins}分`
    },
  )
}
```

### テストの変化（worktime.test.ts）

```ts
// 変更前: 直接プロパティにアクセス
const result = calculateWorkDuration(clockIn, clockOut)
expect(result.totalMinutes).toBe(540)  // ← Option なしで直接アクセス

// 変更後: Option から値を取り出してからアクセス
const result = calculateWorkDuration(clockIn, clockOut)
const duration = Option.getOrThrow(result)  // Option.some なら値を返す、none なら例外
expect(duration.totalMinutes).toBe(540)

// 新しく追加: 無効入力のテスト（変更前は書けなかった）
it("clockOut が clockIn より前 → Option.none()", () => {
  const result = calculateWorkDuration(
    new Date("2026-02-23T18:00:00+09:00"),
    new Date("2026-02-23T09:00:00+09:00"),
  )
  expect(Option.isNone(result)).toBe(true)  // 型で「計算不能」を表現できる
})
```

---

## Why: なぜこの変更をしたか

### calculateWorkDuration に Option を導入した理由

1. **型が嘘をつかない**
   変更前は「計算が常に成功する」という嘘を型でついていた。
   `Option<WorkDuration>` にすることで「失敗するかもしれない」を正直に型で宣言できる。

2. **呼び出し側への強制**
   `Option<WorkDuration>` を返すと、呼び出し側は必ず
   `Option.map` / `Option.getOrElse` / `Option.getOrThrow` などで
   「値がない場合」を処理しなければならない。
   → 「`null` チェックを忘れた」というバグが発生しない。

3. **テストの網羅性が上がる**
   「none になるケース」を型で表現したことで、そのテストケースを自然に書きたくなる。

### formatDuration に pipe を導入した理由

1. **処理の段階が明確になる**
   `pipe(入力, 変換1, 変換2, ...)` の形で「このデータはこの順番で変換される」が視覚的にわかる。

2. **一時変数が不要になる**
   `const hours = ...` `const mins = ...` という一時変数がなくなり、
   各ステップの「入力と出力の関係」だけに集中できる。

---

## 概念メモ: 今回登場した Effect.ts の API

| API | 意味 | 使い場所 |
|-----|------|---------|
| `Option.none()` | 「値がない」Option を作る | 計算不能なとき |
| `Option.some(v)` | 「値がある」Option を作る | 正常計算の結果 |
| `Option.isNone(opt)` | Option が none かチェックする述語 | テストで使用 |
| `Option.getOrThrow(opt)` | Option から値を取り出す（none なら例外） | テストで使用 |
| `Option.map(f)` | Option の中の値を変換する（none はスキップ） | attendanceService.ts で使用 |
| `Option.getOrElse(() => default)` | none のときデフォルト値を返す | attendanceService.ts で使用 |
| `pipe(x, f, g, ...)` | 左から右に関数を適用する | formatDuration / attendanceService で使用 |

### Option.map の動き（図解）

```
Option.some(540)  --(map(n => n - 60))--> Option.some(480)
Option.none()     --(map(n => n - 60))--> Option.none()    ← none はスキップされる
```

`map` は「Option が some のときだけ変換し、none はそのまま通す」。
これにより null チェックなしで安全に変換チェーンが書ける。
