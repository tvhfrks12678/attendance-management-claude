# attendance feature を題材にしたヘキサゴナルアーキテクチャ解説

このドキュメントは `src/features/attendance` の実装を使って、
「ヘキサゴナルアーキテクチャ風に見える構成で、実際にどの順で処理が流れるか」を説明します。

---

## 1. まず基礎: domain とは何か？

### domain（ドメイン）

- **業務そのものの知識・ルール**を表す層です。
- このプロジェクトでは「勤怠管理」がドメインです。
- 例えば以下が domain に相当します。
  - 勤怠状態（`not_started`, `working`, `on_break`, `finished`）
  - 「勤務開始できるのは `not_started` のときだけ」のような判定ルール
  - 勤務時間・休憩時間の計算

### ヘキサゴナルアーキテクチャの考え方（超要約）

- 中心に **domain / application（ユースケース）** を置く。
- DB, 外部 API, フレームワーク, UI は外側（adapter / infrastructure）。
- 中心は外側の具体実装に依存しない。依存するのは **port（インターフェース）**。

本 feature では次の対応になっています。

- `domain/` : エンティティ・業務ルール・port 定義
- `application/services/` : ユースケース（出勤/退勤/休憩）
- `infrastructure/` : repository 実装、clock 実装
- `server-fns/` : サーバー関数の入り口（Web フレームワーク接続）
- `presentation/` : React UI

---

## 2. ディレクトリの見方

```text
src/features/attendance
├── domain
│   ├── entities         # ドメインモデル（AttendanceDay など）
│   ├── logic            # 業務ルール（canClockIn など）
│   └── ports            # 外部依存の抽象（AttendanceRepository, Clock）
├── application
│   └── services         # ユースケース（clockIn, clockOut, getToday ...）
├── infrastructure       # ports の具体実装（InMemoryRepository, SystemClock）
├── server-fns           # HTTP/サーバー関数の entrypoint
└── presentation         # React hooks / page / parts
```

---

## 3. 処理フロー（例: 画面表示時に本日の勤怠を取得）

1. `AttendancePage` が `useTodayAttendance()` を呼ぶ（presentation）。
2. Hook 内で `fetchToday`（server-fn）を実行。
3. `fetchToday` は application の `getToday` を handler として呼ぶ。
4. `getToday` は `getClock()` と `getRepository()` で外部依存を取得。
5. repository から `getToday(date)` で当日データ取得。
6. application でレスポンス整形（Date -> ISO string）して返却。
7. UI が受け取り、`StatusCard` へ渡して表示。

---

## 4. 処理フロー（例: 出勤ボタン押下）

1. `useClockIn` の mutation で `postClockIn()` 実行。
2. `postClockIn` は server-fn として application の `clockIn` を実行。
3. `clockIn` 内部で `clockInEffect` を実行。
4. repository から当日レコードを取得。
5. domain ルール `canClockIn(record)` で判定。
6. OK なら現在時刻を入れて `save`。
7. 成功レスポンスを返却。
8. React Query が `attendance` キーを invalidate し、画面再取得。

---

## 5. 「実際のコード」+ 一行ごとの説明

> 以下は **実コードそのまま**（必要箇所を抜粋）です。

### 5-1. Domain Entity（`AttendanceDay`）

```ts
export type AttendanceStatus =
  | "not_started"
  | "working"
  | "on_break"
  | "finished";

export interface BreakPeriod {
  breakStart: Date;
  breakEnd: Date | null; // null = 休憩中
}

export interface AttendanceDay {
  date: string; // "2026-02-23" 形式
  status: AttendanceStatus;
  clockIn: Date | null;
  clockOut: Date | null;
  workMinutes: number | null;
  breaks: BreakPeriod[];
  breakMinutes: number | null;
}
```

一行ごとの説明:

- `export type AttendanceStatus ...` : 勤怠状態を文字列ユニオンで固定。
- `export interface BreakPeriod {` : 休憩 1 区間を表す型を開始。
- `breakStart: Date` : 休憩開始時刻。
- `breakEnd: Date | null` : 休憩終了。`null` は休憩継続中を意味。
- `}` : `BreakPeriod` 定義終了。
- `export interface AttendanceDay {` : 1 日分勤怠レコードの型を開始。
- `date: string` : 対象日（`YYYY-MM-DD`）。
- `status: AttendanceStatus` : 当日の勤務状態。
- `clockIn: Date | null` : 出勤時刻（未出勤なら `null`）。
- `clockOut: Date | null` : 退勤時刻（未退勤なら `null`）。
- `workMinutes: number | null` : 実働分（未確定なら `null`）。
- `breaks: BreakPeriod[]` : 休憩履歴（複数区間対応）。
- `breakMinutes: number | null` : 休憩合計分。
- `}` : `AttendanceDay` 定義終了。

### 5-2. Domain Logic（出勤可否判定）

```ts
export function canClockIn(today: AttendanceDay): boolean {
  return today.status === "not_started";
}
```

一行ごとの説明:

- `export function canClockIn...` : 出勤可能か判定する純粋関数。
- `return today.status === "not_started"` : 未開始状態のみ true。
- `}` : 関数終了。

### 5-3. Port（Repository 抽象）

```ts
export interface AttendanceRepository {
  getToday(date: string): Promise<AttendanceDay>;
  save(record: AttendanceDay): Promise<void>;
  getHistory(): Promise<AttendanceDay[]>;
}
```

一行ごとの説明:

- `export interface AttendanceRepository {` : 永続化への窓口を抽象化。
- `getToday(date: string): Promise<AttendanceDay>` : 指定日のレコード取得契約。
- `save(record: AttendanceDay): Promise<void>` : レコード保存契約。
- `getHistory(): Promise<AttendanceDay[]>` : 履歴一覧取得契約。
- `}` : interface 終了。

### 5-4. Application Service（`clockIn` の入口）

```ts
export async function clockIn(): Promise<ClockInResponse> {
  return Effect.runPromise(
    pipe(
      clockInEffect(),
      Effect.match({
        onSuccess: (data) => ({
          success: true as const,
          clockIn: data.clockIn,
          message: data.message,
        }),
        onFailure: (_error) => ({
          success: false as const,
          message: "既に出勤済みです",
        }),
      }),
    ),
  );
}
```

一行ごとの説明:

- `export async function clockIn...` : 出勤ユースケースの公開 API。
- `return Effect.runPromise(` : Effect パイプラインを Promise として実行。
- `pipe(` : 左から右へ処理をつなぐ。
- `clockInEffect(),` : 実処理（取得・判定・保存）を表す Effect を呼ぶ。
- `Effect.match({` : 成功・失敗を最終レスポンス型へ畳み込む。
- `onSuccess: (data) => ({` : 成功時の変換開始。
- `success: true as const,` : 成功フラグ。
- `clockIn: data.clockIn,` : 出勤時刻を返却。
- `message: data.message,` : 成功メッセージ。
- `}),` : 成功時オブジェクト終了。
- `onFailure: (_error) => ({` : 失敗時の変換開始。
- `success: false as const,` : 失敗フラグ。
- `message: "既に出勤済みです",` : 失敗メッセージ。
- `}),` : 失敗時オブジェクト終了。
- `}),` : `Effect.match` 終了。
- `),` : `pipe` 終了。
- `)` : `runPromise` 終了。
- `}` : 関数終了。

### 5-5. Infrastructure（実装差し替えポイント）

```ts
let repository: AttendanceRepository | null = null;

export function getRepository(): AttendanceRepository {
  if (!repository) {
    repository = new InMemoryAttendanceRepository();
  }
  return repository;
}
```

一行ごとの説明:

- `let repository ...` : repository 実体を module 内にキャッシュ。
- `export function getRepository...` : application から呼ばれる取得関数。
- `if (!repository) {` : 初回呼び出しか判定。
- `repository = new InMemoryAttendanceRepository()` : 初回のみ in-memory 実装を生成。
- `}` : if 終了。
- `return repository` : 同じ実体を返す（簡易 singleton）。
- `}` : 関数終了。

### 5-6. Server Function（Web 層の入口）

```ts
import { createServerFn } from "@tanstack/react-start";
import { getToday } from "../application/services/attendanceService";

export const fetchToday = createServerFn({ method: "GET" }).handler(getToday);
```

一行ごとの説明:

- `import { createServerFn } ...` : サーバー関数作成 API を読み込む。
- `import { getToday } ...` : application ユースケースを読み込む。
- `export const fetchToday ...` : GET の server-fn を定義し handler に `getToday` を接続。

### 5-7. Presentation Hook（UI から server-fn 呼び出し）

```ts
export function useTodayAttendance() {
  return useQuery({
    queryKey: QUERY_KEYS.today,
    queryFn: () => fetchToday(),
  });
}
```

一行ごとの説明:

- `export function useTodayAttendance...` : 今日の勤怠取得用 Hook。
- `return useQuery({` : React Query の取得処理を開始。
- `queryKey: QUERY_KEYS.today,` : キャッシュキーを指定。
- `queryFn: () => fetchToday(),` : サーバー関数実行を取得関数として設定。
- `})` : Query 設定終了。
- `}` : Hook 終了。

---

## 6. この構成の「ヘキサゴナルらしさ」

- domain は `AttendanceDay` や `canClockIn` などの純粋な業務ルールを保持。
- application は「ユースケースの手順」を記述（取得→判定→保存→返却）。
- 永続化・時刻取得は port 経由（`AttendanceRepository`, `Clock`）で抽象化。
- in-memory から DB 実装へ変更する場合、`infrastructure` 側を差し替える。
- UI / server-fn は application を呼ぶだけなので、ルール変更の影響を局所化しやすい。

---

## 7. まとめ

この feature は厳密な六角形テンプレートというより、**実務で扱いやすいヘキサゴナル寄りの分離**になっています。
特に以下が重要です。

1. ルールは domain に置く（判定・計算）。
2. ユースケースは application に置く（処理手順）。
3. 外部依存は port + infrastructure で隔離する。
4. presentation / server-fn は「呼び出し役」に徹する。

この分離ができていると、将来の DB 変更・外部 API 追加・テスト容易性の面で効きます。
