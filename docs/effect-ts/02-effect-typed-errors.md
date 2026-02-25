# Change 2: Effect による型付きエラーハンドリング（attendanceService.ts）

対象ファイル:
- `src/features/attendance/application/services/attendanceService.ts`

---

## 概念メモ（まずここを読む）

### Effect とは

「**非同期処理 + エラー**」を型で表現するコア型。

```
Effect<成功の型, エラーの型>
```

TypeScript の `Promise<T>` と比べると：

| | Promise\<T\> | Effect\<T, E\> |
|-|-------------|--------------|
| 成功の型 | T | T |
| エラーの型 | **不明（any）** | **E（型付き）** |
| エラーの処理 | catch で実行時に確認 | **コンパイル時に強制** |

Promise は「何が失敗するか」を型として表現できない。
Effect は `Effect<SuccessData, MyError>` のように「どんなエラーが起きうるか」を型で宣言する。

---

### タグ付きユニオン（Discriminated Union）とは

エラーの「種類」を型レベルで区別するパターン。

```ts
type AlreadyClockedInError = { readonly _tag: "AlreadyClockedIn" }
type NotWorkingError       = { readonly _tag: "NotWorking" }

type AttendanceError = AlreadyClockedInError | NotWorkingError
```

`_tag` フィールドで「どのエラーか」を絞り込める（TypeScript の型ガード）：

```ts
if (error._tag === "AlreadyClockedIn") {
  // ここでは error は AlreadyClockedInError 型に絞られる
}
```

---

### Effect.flatMap とは

Effect の中の値を使って、次の Effect を作る操作。

```
Effect<A, E1> --flatMap(a => Effect<B, E2>)--> Effect<B, E1 | E2>
```

- Promise の `.then()` に近いが、エラー型が型パラメータに**積み重なっていく**点が異なる
- 各ステップのエラーが型システムに記録される

---

## Before: 変更前の clockIn

```ts
// attendanceService.ts（変更前）

export async function clockIn(): Promise<ClockInResponse> {
  const clock = getClock()
  const repository = getRepository()
  const date = clock.todayString()
  const record = await repository.getToday(date)

  if (!canClockIn(record)) {
    return { success: false, message: "既に出勤済みです" }   // ← エラーが success: false として成功パスに混在
  }

  const now = clock.now()
  await repository.save({ ...record, status: "working", clockIn: now })

  return {
    success: true,
    clockIn: now.toISOString(),
    message: "出勤しました",
  }
}
```

### 問題点

| 問題 | 詳細 |
|------|------|
| **エラーが成功パスに混在** | `{ success: false }` と `{ success: true }` が同じ型 `ClockInResponse` に混在している。「どんなエラーが起きうるか」が型シグネチャ（`Promise<ClockInResponse>`）からはわからない。 |
| **エラーの種類が型に現れない** | `success: false` になる理由は何か？コードを読まないとわからない。型からはわからない。 |
| **コンパイル時の保証がない** | 新しいエラーケースを追加したとき、TypeScript は「このエラーを処理し忘れている」と教えてくれない。 |

---

## After: Effect.ts を使った後の clockIn

```ts
// attendanceService.ts（変更後）
import { Effect, pipe } from "effect"

// ── エラー型の定義 ────────────────────────────────────────────────
// タグ付きユニオン: _tag で「何のエラーか」を型で区別できる
type AlreadyClockedInError = { readonly _tag: "AlreadyClockedIn" }

// ── 内部 Effect（型付きエラーを持つパイプライン）────────────────────
// Effect<成功の型,      エラーの型>
// Effect<{ clockIn: string; message: string }, AlreadyClockedInError>
function clockInEffect(): Effect.Effect<
  { clockIn: string; message: string },
  AlreadyClockedInError
> {
  const clock = getClock()
  const repository = getRepository()
  const date = clock.todayString()

  return pipe(
    // ① Effect.promise: Promise を Effect に変換
    //    Promise<AttendanceDay> → Effect<AttendanceDay, never>
    //    never = 「このステップはエラーにならない」を型で表現
    Effect.promise(() => repository.getToday(date)),

    // ② Effect.flatMap: 前のステップの値（record）を使って次の Effect を作る
    //    canClockIn が true → Effect.succeed(record)  ＝ 成功の Effect
    //    canClockIn が false → Effect.fail({...})     ＝ 失敗の Effect
    //
    //    型が Effect<AttendanceDay, AlreadyClockedInError> に変化する
    Effect.flatMap((record) =>
      canClockIn(record)
        ? Effect.succeed(record)
        : Effect.fail({ _tag: "AlreadyClockedIn" } as const),
    ),

    // ③ Effect.flatMap（2つ目）: 出勤処理を実行して成功レスポンスを組み立てる
    Effect.flatMap((record) => {
      const now = clock.now()
      return pipe(
        // repository.save の Promise を Effect に変換
        Effect.promise(() =>
          repository.save({ ...record, status: "working", clockIn: now }),
        ),
        // Effect.map: Effect の中の値を同期的に変換する
        // save は void を返すので、ここで成功レスポンスのオブジェクトを作る
        Effect.map(() => ({
          clockIn: now.toISOString(),
          message: "出勤しました",
        })),
      )
    }),
  )
}

// ── 公開 API（外部インターフェースは変えない）──────────────────────
export async function clockIn(): Promise<ClockInResponse> {
  return Effect.runPromise(
    pipe(
      // clockInEffect は Effect<SuccessData, AlreadyClockedInError>
      clockInEffect(),

      // Effect.match: 成功・失敗を同じ型（ClockInResponse）にまとめる
      // これにより型が Effect<ClockInResponse, never> になる
      // never = 失敗しない = Effect.runPromise に渡せる
      Effect.match({
        onSuccess: (data) => ({ success: true as const, ...data }),
        onFailure: (_error) => ({
          success: false as const,
          message: "既に出勤済みです",
        }),
      }),
    ),
  )
}
```

---

## Why: なぜこの変更をしたか

### 1. エラーを型の中に閉じ込める

変更前は `{ success: false }` というエラーが `ClockInResponse` という成功型に混在していた。
変更後は `AlreadyClockedInError` という独立した型でエラーを表現する。

```
変更前: Promise<{ success: true, clockIn: ... } | { success: false, message: ... }>
                                                   ↑ エラーが成功型に混在

変更後: Effect<{ clockIn: ...; message: ... }, AlreadyClockedInError>
                                                ↑ エラーが型パラメータに分離
```

### 2. コンパイル時の安全性

`Effect<SuccessData, AlreadyClockedInError>` という型があると、
TypeScript は「AlreadyClockedInError を処理していない」とコンパイル時に警告する。

新しいエラーケース `NotWorkingError` を追加したとき：

```ts
// Effect<SuccessData, AlreadyClockedInError | NotWorkingError> になる
Effect.flatMap(record =>
  canClockIn(record) ? Effect.succeed(record)
  : canDoSomething(record) ? Effect.fail({ _tag: "NotWorkingError" } as const)
  : Effect.fail({ _tag: "AlreadyClockedIn" } as const)
)
```

`Effect.match` の `onFailure` でエラー型が `AlreadyClockedInError | NotWorkingError` に変わるので、
TypeScript が「NotWorkingError を処理していない可能性がある」と教えてくれる。

### 3. 外部インターフェースは変えない

`clockIn()` の戻り値は依然として `Promise<ClockInResponse>` のまま。
内部だけ Effect に変えることで、**呼び出し側（server-fn や UI）を壊さずに** 内部ロジックを改善できる。

---

## Option との組み合わせ（clockOut）

attendanceService.ts の `clockOut` では、
Change 1 で変更した `calculateWorkDuration`（Option を返す）を
`pipe` + `Option.map` + `Option.getOrElse` で安全に扱っている。

```ts
// clockOut の実働時間計算部分
const netWorkMinutes = pipe(
  // ① calculateWorkDuration は Option<WorkDuration> を返す（Change 1 の変更）
  calculateWorkDuration(record.clockIn!, now),

  // ② Option.map: Option の中の値を変換（none なら自動スキップ）
  //    WorkDuration → 実働時間（分）
  Option.map((d) => Math.max(0, d.totalMinutes - totalBreakMinutes)),

  // ③ Option.getOrElse: none のときのデフォルト値を指定
  //    business logic 上 none にはならないが、型安全のために明示
  Option.getOrElse(() => 0),
)
```

`pipe` を使うことで「Option を受け取る → 変換 → デフォルト値でアンラップ」の
3ステップが視覚的に左から右へ流れるように読める。

---

## 概念メモ: 今回登場した Effect.ts の API

| API | 意味 | 使い場所 |
|-----|------|---------|
| `Effect.promise(f)` | `() => Promise<A>` を `Effect<A, never>` に変換 | repository 呼び出しをラップ |
| `Effect.succeed(v)` | 成功を表す Effect を作る | canClockIn が true のとき |
| `Effect.fail(e)` | 失敗を表す Effect を作る（型 E がシグネチャに入る） | canClockIn が false のとき |
| `Effect.flatMap(f)` | Effect の値を使って次の Effect を作る（連鎖） | 処理ステップの連結 |
| `Effect.map(f)` | Effect の値を同期的に変換する | save 結果 → レスポンスオブジェクト |
| `Effect.match({onSuccess, onFailure})` | 成功・失敗を同じ型にまとめる | Effect → ClockInResponse に統一 |
| `Effect.runPromise(e)` | Effect を実行して Promise に変換（エラー型が never のときのみ使える） | 公開 API の最終ステップ |

### Effect の型変化の流れ（図解）

```
Effect.promise(() => repo.getToday(date))
  → Effect<AttendanceDay, never>                      ← 「never エラー」

.flatMap(record => canClockIn ? succeed : fail(...))
  → Effect<AttendanceDay, AlreadyClockedInError>      ← エラー型が積み上がる

.flatMap(record => Effect.promise(() => repo.save(...)).pipe(Effect.map(...)))
  → Effect<{ clockIn: string; message: string }, AlreadyClockedInError>

Effect.match({ onSuccess, onFailure })
  → Effect<ClockInResponse, never>                    ← never に戻る

Effect.runPromise(...)
  → Promise<ClockInResponse>                          ← 外部に渡せる形に変換
```
