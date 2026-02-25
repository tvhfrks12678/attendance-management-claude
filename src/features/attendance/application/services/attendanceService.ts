// ────────────────────────────────────────────────────────────────
// effect ライブラリから Effect / Option / pipe をインポート
//
// Effect : 「非同期処理 + エラー」を型で表現するコア型。
//          Effect<成功の型, エラーの型> という 2 つの型パラメータで
//          「何が返るか」「何が失敗するか」をシグネチャで宣言できる。
//
// Option : 「値がある(Some)」か「値がない(None)」を型で表現する型。
//          calculateWorkDuration が Option<WorkDuration> を返すようになったため
//          ここでも Option の API（Option.map / Option.getOrElse）を使う。
//
// pipe   : 値に関数を左から右へ順に適用するユーティリティ。
//          pipe(x, f, g) は g(f(x)) と同じだが左→右で読める。
// ────────────────────────────────────────────────────────────────
import { Effect, Option, pipe } from "effect"

import {
	canClockIn,
	canClockOut,
	canEndBreak,
	canStartBreak,
} from "../../domain/logic/attendance"
import { calculateTotalBreakMinutes, calculateWorkDuration } from "../../domain/logic/worktime"
import { getClock } from "../../infrastructure/getClock"
import { getRepository } from "../../infrastructure/getRepository"
import type {
	BreakEndResponse,
	BreakStartResponse,
	ClockInResponse,
	ClockOutResponse,
	HistoryResponse,
	TodayResponse,
} from "../../contracts/attendance"

// ────────────────────────────────────────────────────────────────
// 型付きエラー型の定義（Change 2 で導入）
//
// 「タグ付きユニオン（Discriminated Union）」パターン。
// _tag フィールドで「どの種類のエラーか」を型レベルで区別できる。
//
// 変更前: エラーを { success: false, message: string } だけで表現していた。
//         エラーの「種類」は実行時にしかわからなかった。
// 変更後: エラーの種類を型で宣言する。
//         TypeScript がコンパイル時に「このエラーを処理していない」と教えてくれる。
// ────────────────────────────────────────────────────────────────

// 出勤済みエラー: canClockIn が false のとき発生する
type AlreadyClockedInError = { readonly _tag: "AlreadyClockedIn" }

// ────────────────────────────────────────────────────────────────
// ヘルパー: BreakPeriod を ISO 文字列にシリアライズ
// ────────────────────────────────────────────────────────────────
function serializeBreaks(breaks: { breakStart: Date; breakEnd: Date | null }[]) {
	return breaks.map((b) => ({
		breakStart: b.breakStart.toISOString(),
		breakEnd: b.breakEnd ? b.breakEnd.toISOString() : null,
	}))
}

// ════════════════════════════════════════════════════════════════
// Change 2 ── Effect による型付きエラーハンドリング（clockIn）
//
// Before: async/await + if チェックで命令型に書かれていた。
//         エラーは { success: false, message } として成功パスと同じ型に混在。
//
// After:  内部を Effect パイプラインで表現する。
//         エラーは AlreadyClockedInError という独立した型になり、
//         TypeScript が「このエラーを処理したか」をコンパイル時に検査する。
//
// 外部インターフェース（Promise<ClockInResponse>）は変わらない。
// ════════════════════════════════════════════════════════════════

// ── clockIn の内部 Effect ────────────────────────────────────────
// Effect<成功の型, エラーの型>
// 成功 → { clockIn: string; message: string }
// 失敗 → AlreadyClockedInError
function clockInEffect(): Effect.Effect<{ clockIn: string; message: string }, AlreadyClockedInError> {
	// 副作用のある処理（インフラ取得）は Effect の外で実行する
	const clock = getClock()
	const repository = getRepository()
	const date = clock.todayString()

	return pipe(
		// ① Effect.promise: Promise を Effect に変換する
		//    Promise<AttendanceDay> → Effect<AttendanceDay, never>
		//    Promise は成功/失敗の型が曖昧だが、Effect は型パラメータで明示する
		Effect.promise(() => repository.getToday(date)),

		// ② Effect.flatMap: Effect の中の値を使って次の Effect を作る
		//    Promise でいう .then(record => ...) に相当するが、
		//    エラー型も型引数に積み重なっていく点が異なる
		Effect.flatMap((record) =>
			// canClockIn が true なら Effect.succeed で成功の Effect を返す
			// canClockIn が false なら Effect.fail で失敗の Effect を返す
			//
			// Effect.succeed(x) → Effect<AttendanceDay, never>
			// Effect.fail(e)    → Effect<never, AlreadyClockedInError>
			// flatMap のおかげで型が Effect<AttendanceDay, AlreadyClockedInError> に合成される
			canClockIn(record)
				? Effect.succeed(record)
				: Effect.fail({ _tag: "AlreadyClockedIn" } as const),
		),

		// ③ Effect.flatMap（2つ目）: 出勤処理を実行して成功レスポンスを組み立てる
		//    前のステップが成功した record を受け取る
		Effect.flatMap((record) => {
			const now = clock.now()
			return pipe(
				// repository.save の Promise を Effect に変換
				Effect.promise(() =>
					repository.save({ ...record, status: "working", clockIn: now }),
				),
				// Effect.map: Effect の中の値を同期的に変換する
				// Promise でいう .then(v => transform(v)) の同期版
				// save は void を返すので、ここで成功レスポンスを組み立てる
				Effect.map(() => ({
					clockIn: now.toISOString(),
					message: "出勤しました",
				})),
			)
		}),
	)
}

// ── clockIn（公開 API）───────────────────────────────────────────
// 外部インターフェースは変えない（Promise<ClockInResponse> のまま）
// 内部で clockInEffect() を実行し、Effect → Promise に変換する
export async function clockIn(): Promise<ClockInResponse> {
	return Effect.runPromise(
		pipe(
			// clockInEffect は Effect<{clockIn,message}, AlreadyClockedInError>
			clockInEffect(),

			// Effect.match: 成功・失敗の両方を同じ型（ClockInResponse）に変換する
			// これにより型が Effect<ClockInResponse, never> になり
			// Effect.runPromise に渡せるようになる（never = 失敗しない）
			Effect.match({
				// 成功ケース: data は { clockIn: string; message: string }
				onSuccess: (data) => ({
					success: true as const,
					clockIn: data.clockIn,
					message: data.message,
				}),
				// 失敗ケース: error は AlreadyClockedInError
				// _tag で具体的なエラー種別が型付きで取得できる
				onFailure: (_error) => ({
					success: false as const,
					message: "既に出勤済みです",
				}),
			}),
		),
	)
}

// ════════════════════════════════════════════════════════════════
// Change 1 ── Option + pipe による型安全な計算（clockOut）
//
// Before: calculateWorkDuration が WorkDuration を返していたので
//         grossDuration.totalMinutes を直接使えた。
//
// After:  calculateWorkDuration が Option<WorkDuration> を返す。
//         呼び出し側は Option の中身を「安全に」取り出す必要がある。
//         pipe + Option.map + Option.getOrElse で流れるように書ける。
// ════════════════════════════════════════════════════════════════
export async function clockOut(): Promise<ClockOutResponse> {
	const clock = getClock()
	const repository = getRepository()
	const date = clock.todayString()
	const record = await repository.getToday(date)

	if (!canClockOut(record)) {
		return { success: false, message: "出勤していません" }
	}

	const now = clock.now()
	const totalBreakMinutes = calculateTotalBreakMinutes(record.breaks)

	// ── Option + pipe で安全に実働時間を計算 ──────────────────────
	// calculateWorkDuration は Option<WorkDuration> を返す（Change 1 で変更）
	// pipe を使って Option の変換ステップを左から右へ宣言的に書く
	const netWorkMinutes = pipe(
		// ① calculateWorkDuration(clockIn, now) → Option<WorkDuration>
		//    record.clockIn は canClockOut チェックを通過しているので必ず存在するが
		//    ! の非 null アサーションを使う。型は Option<WorkDuration>。
		calculateWorkDuration(record.clockIn!, now),

		// ② Option.map: Option の中の値を変換する
		//    Option.some(d) なら d.totalMinutes - totalBreakMinutes を計算
		//    Option.none()  なら何もせず Option.none() のままになる
		//    これが「null チェックなしで変換できる」Option の強さ
		Option.map((d) => Math.max(0, d.totalMinutes - totalBreakMinutes)),

		// ③ Option.getOrElse: Option から値を取り出す
		//    Option.some(n) → n を返す
		//    Option.none()  → () => 0 のフォールバックを実行して 0 を返す
		//    「万が一 none になっても 0 分として扱う」という意図が明確
		Option.getOrElse(() => 0),
	)

	await repository.save({
		...record,
		status: "finished",
		clockOut: now,
		workMinutes: netWorkMinutes,
		breakMinutes: totalBreakMinutes,
	})

	return {
		success: true,
		clockOut: now.toISOString(),
		workMinutes: netWorkMinutes,
		breakMinutes: totalBreakMinutes,
		message: "退勤しました",
	}
}

// ────────────────────────────────────────────────────────────────
// 以下の関数は Effect.ts を導入していない（今後の拡張対象）
// ────────────────────────────────────────────────────────────────

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

export async function startBreak(): Promise<BreakStartResponse> {
	const clock = getClock()
	const repository = getRepository()
	const date = clock.todayString()
	const record = await repository.getToday(date)

	if (!canStartBreak(record)) {
		return { success: false, message: "勤務中でないため休憩を開始できません" }
	}

	const now = clock.now()
	await repository.save({
		...record,
		status: "on_break",
		breaks: [...record.breaks, { breakStart: now, breakEnd: null }],
	})

	return {
		success: true,
		breakStart: now.toISOString(),
		message: "休憩を開始しました",
	}
}

export async function endBreak(): Promise<BreakEndResponse> {
	const clock = getClock()
	const repository = getRepository()
	const date = clock.todayString()
	const record = await repository.getToday(date)

	if (!canEndBreak(record)) {
		return { success: false, message: "休憩中でないため休憩を終了できません" }
	}

	const now = clock.now()
	const updatedBreaks = record.breaks.map((b, i) =>
		i === record.breaks.length - 1 ? { ...b, breakEnd: now } : b,
	)
	const totalBreakMinutes = calculateTotalBreakMinutes(updatedBreaks)

	await repository.save({
		...record,
		status: "working",
		breaks: updatedBreaks,
		breakMinutes: totalBreakMinutes,
	})

	return {
		success: true,
		breakEnd: now.toISOString(),
		breakMinutes: totalBreakMinutes,
		message: "休憩を終了しました",
	}
}

export async function getHistory(): Promise<HistoryResponse> {
	const repository = getRepository()
	const records = await repository.getHistory()

	return {
		records: records.map((r) => ({
			date: r.date,
			status: r.status,
			clockIn: r.clockIn ? r.clockIn.toISOString() : null,
			clockOut: r.clockOut ? r.clockOut.toISOString() : null,
			workMinutes: r.workMinutes,
			breaks: serializeBreaks(r.breaks),
			breakMinutes: r.breakMinutes,
		})),
	}
}
