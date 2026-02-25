# Attendance feature における DI（依存性注入）の使われ方

このドキュメントでは、`src/features/attendance` がヘキサゴナルアーキテクチャ風の構成になっている中で、**DI（依存性注入）をどこで・どう使っているか**を、実際のコードに沿って説明します。

---

## 1. この feature での DI の基本方針

- `domain/ports` で「必要な外部機能のインターフェース（抽象）」を定義する。
- `infrastructure/` で「具体実装（SystemClock, InMemoryRepository）」を用意する。
- `application/services` は具体クラス名を直接知らず、`getClock()` / `getRepository()` から依存を受け取って動く。
- 依存の差し替えは `infrastructure/getRepository.ts` などの組み立てポイントで行う。

---

## 2. Port（抽象）定義: DI の受け口

### コード: `src/features/attendance/domain/ports/attendanceRepository.ts`

```ts
import type { AttendanceDay } from "../entities/attendance"

export interface AttendanceRepository {
	getToday(date: string): Promise<AttendanceDay>
	save(record: AttendanceDay): Promise<void>
	getHistory(): Promise<AttendanceDay[]>
}
```

#### 1行ごとの説明

1. `AttendanceDay` 型を import して、Repository が扱うデータ構造を統一します。
2. 空行で import と本体を分離しています。
3. `AttendanceRepository` という**抽象インターフェース**を宣言しています（DI の核）。
4. 今日のレコード取得メソッドの契約を定義します。
5. レコード保存メソッドの契約を定義します。
6. 履歴取得メソッドの契約を定義します。
7. interface 宣言を閉じます。

---

## 3. Infrastructure 実装: 注入される具体クラス

### コード: `src/features/attendance/infrastructure/getRepository.ts`

```ts
import type { AttendanceRepository } from "../domain/ports/attendanceRepository"
import { InMemoryAttendanceRepository } from "./repositories/inMemoryAttendanceRepository"

// 将来: drizzleAttendanceRepository に差し替えるだけで Turso に移行可能
let repository: AttendanceRepository | null = null

export function getRepository(): AttendanceRepository {
	if (!repository) {
		repository = new InMemoryAttendanceRepository()
	}
	return repository
}
```

#### 1行ごとの説明

1. 返却型を `AttendanceRepository`（抽象）に固定し、呼び出し側を実装詳細から切り離します。
2. 現在使う具体実装 `InMemoryAttendanceRepository` を読み込みます。
3. 空行。
4. コメントで「差し替えポイント」を明示し、DI の意図（実装交換）を示しています。
5. モジュール内シングルトンとして repository 変数を保持します。
6. 空行。
7. 依存を提供するファクトリ関数を公開します。
8. 未初期化なら初回だけインスタンス化します。
9. 具体実装を生成して `repository` に保存します。
10. `if` ブロックを閉じます。
11. 抽象型として repository を返します（利用側は実装を意識しない）。
12. 関数を閉じます。

### コード: `src/features/attendance/infrastructure/getClock.ts`

```ts
import type { Clock } from "../domain/ports/clock"
import { SystemClock } from "./clock/systemClock"

let clock: Clock | null = null

export function getClock(): Clock {
	if (!clock) {
		clock = new SystemClock()
	}
	return clock
}
```

#### 1行ごとの説明

1. `Clock` という抽象インターフェースを import します。
2. 具体実装 `SystemClock` を import します。
3. 空行。
4. 抽象型 `Clock` でシングルトン変数を宣言します。
5. 空行。
6. `Clock` 依存を提供する関数を公開します。
7. まだ生成していなければ、
8. `SystemClock` の実体を作って保持します。
9. `if` を閉じます。
10. 抽象型として clock を返します。
11. 関数を閉じます。

---

## 4. Application Service: DI を実際に利用する層

### コード: `src/features/attendance/application/services/attendanceService.ts`（`getToday`）

```ts
export async function getToday(): Promise<TodayResponse> {
	const clock = getClock()
	const repository = getRepository()
	const date = clock.todayString()
	const record = await repository.getToday(date)

	return {
		date: record.date,
		status: record.status,
		clockIn: record.clockIn ? record.clockIn.toISOString() : null,
		clockOut: record.clockOut ? record.clockOut.toISOString() : null,
		workMinutes: record.workMinutes,
		breaks: serializeBreaks(record.breaks),
		breakMinutes: record.breakMinutes,
	}
}
```

#### 1行ごとの説明

1. `getToday` ユースケースを非同期関数として公開します。
2. `Clock` 依存を DI 経由で取得します（具体クラス名はここに出ない）。
3. `AttendanceRepository` 依存を DI 経由で取得します。
4. Clock の抽象メソッドで「今日の日付文字列」を作成します。
5. Repository の抽象メソッドで当日レコードを取得します。
6. 空行。
7. API 応答オブジェクトの生成を開始します。
8. 日付を応答へ詰めます。
9. ステータスを応答へ詰めます。
10. `Date | null` を API 契約の `string | null` に変換します。
11. 退勤時刻も同様に `string | null` へ変換します。
12. 勤務分数を応答へ詰めます。
13. 休憩配列をシリアライズして応答へ詰めます。
14. 休憩合計分を応答へ詰めます。
15. オブジェクトを閉じます。
16. 関数を閉じます。

> ポイント: application 層は `getClock/getRepository` という **依存提供関数**だけを知っていればよく、インフラ実装の詳細に依存しません。

---

## 5. Server Function 層: ユースケースをハンドラへ接続

### コード: `src/features/attendance/server-fns/today.ts`

```ts
import { createServerFn } from "@tanstack/react-start"
import { getToday } from "../application/services/attendanceService"

export const fetchToday = createServerFn({ method: "GET" }).handler(getToday)
```

#### 1行ごとの説明

1. TanStack Start のサーバー関数ファクトリを import します。
2. application 層のユースケース関数 `getToday` を import します。
3. 空行。
4. GET エンドポイントを作成し、`getToday` をそのままハンドラに接続します。

> ここでは DI の組み立てをしていません。DI 済みの application サービスを呼び出すだけです。

---

## 6. 「どこで DI しているか」を一言でまとめる

- **抽象定義**: `domain/ports/*`
- **実装生成（注入ポイント）**: `infrastructure/getRepository.ts`, `infrastructure/getClock.ts`
- **利用**: `application/services/attendanceService.ts` の各ユースケース
- **入口接続**: `server-fns/*.ts`（HTTP ハンドラへのバインド）

この構成により、将来的に `InMemoryAttendanceRepository` を Drizzle 実装へ差し替える場合も、主に `getRepository.ts` 側の切り替えで対応できます。
