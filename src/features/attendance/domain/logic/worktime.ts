// ────────────────────────────────────────────────────────────────
// effect ライブラリから Option と pipe をインポートする
//
// Option : 「値がある(Some)」か「値がない(None)」かを型で表現するデータ型。
//          JavaScript の null / undefined の代わりに使う。
//          「この関数は失敗するかもしれない」という事実をシグネチャに刻める。
//
// pipe   : 値に対して関数を左から右へ順番に適用するユーティリティ。
//          pipe(x, f, g, h) は h(g(f(x))) と同じ意味だが、
//          左から右へ流れるので処理の流れが直感的に読める。
// ────────────────────────────────────────────────────────────────
import { Option, pipe } from "effect"

import type { BreakPeriod, WorkDuration } from "../entities/attendance"

/**
 * 出勤時刻と退勤時刻から勤務時間を計算する。
 *
 * ## Before（変更前）
 * ```ts
 * export function calculateWorkDuration(clockIn: Date, clockOut: Date): WorkDuration {
 *   const totalMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000)
 *   return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60, totalMinutes }
 * }
 * ```
 * 問題点: clockOut < clockIn のとき totalMinutes が負になる。
 *         戻り値の型が WorkDuration なので、呼び出し側は「失敗があるかもしれない」と
 *         気づけない（型が嘘をついている）。
 *
 * ## After（変更後）
 * 戻り値を Option<WorkDuration> にすることで
 * 「計算できないケースがある」を型シグネチャで宣言する。
 * 呼び出し側は Option.getOrElse / Option.map 等で
 * 必ず「値がない場合」を処理しなければならない → 安全性が上がる。
 */
export function calculateWorkDuration(
	// 出勤時刻（Date 型）
	clockIn: Date,
	// 退勤時刻（Date 型）
	clockOut: Date,
): Option.Option<WorkDuration> {
	// getTime() はエポックミリ秒を返す。差を 60000 で割ると「分」になる
	const totalMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000)

	// ── 失敗ケース ──────────────────────────────────────────────────
	// clockOut が clockIn より前（例: 入力ミス）の場合は計算不能
	// Option.none() = 「値がない」状態を返す
	// TypeScript の型は Option.Option<WorkDuration> なので
	// コンパイル時に「計算できないケースがある」ことが型に現れる
	if (totalMinutes < 0) {
		return Option.none()
	}

	// ── 成功ケース ──────────────────────────────────────────────────
	// Option.some(value) = 「値がある」状態を返す
	// 呼び出し側は Option.some か Option.none かを必ず考慮する必要がある
	return Option.some({
		// 時間 = totalMinutes を 60 で割った商（切り捨て）
		hours: Math.floor(totalMinutes / 60),
		// 残り分 = totalMinutes を 60 で割った余り
		minutes: totalMinutes % 60,
		// 合計分をそのまま保持（後の計算で使う）
		totalMinutes,
	})
}

/**
 * 全休憩時間の合計（分）を計算する。
 *
 * この関数は変更なし。純粋な reduce を使っているので
 * 副作用がなく、テストしやすい状態が既に保たれている。
 */
export function calculateTotalBreakMinutes(breaks: BreakPeriod[], now?: Date): number {
	// Array.reduce で休憩配列を畳み込み、合計分を求める
	return breaks.reduce((total, b) => {
		// breakEnd が null（休憩中）の場合は now か現在時刻を終了とみなす
		const end = b.breakEnd ?? now ?? new Date()
		// 休憩時間を分に変換（端数は切り捨て）
		const minutes = Math.floor((end.getTime() - b.breakStart.getTime()) / 60000)
		// Math.max(0, ...) でマイナスになる異常値を 0 にクランプ
		return total + Math.max(0, minutes)
	}, 0)
}

/**
 * 分数を「X時間Y分」形式の文字列にフォーマットする。
 *
 * ## Before（変更前）
 * ```ts
 * export function formatDuration(minutes: number): string {
 *   const hours = Math.floor(minutes / 60)
 *   const mins = minutes % 60
 *   if (hours === 0) return `${mins}分`
 *   if (mins === 0) return `${hours}時間`
 *   return `${hours}時間${mins}分`
 * }
 * ```
 * 問題点: 「計算 → 判定 → フォーマット」の3段階が
 *         命令型（let / if / return の羅列）で書かれており、
 *         どの変数がどのステップに属するか追いにくい。
 *
 * ## After（変更後）
 * pipe を使って「分 → 分解 → 文字列」の変換を段階ごとに書く。
 * 各ステップが独立した関数なので、処理の意味が明確になる。
 */
export function formatDuration(minutes: number): string {
	return pipe(
		// ① 入力: 分数（例: 90）
		minutes,

		// ② 分解ステップ: 分数を「時間」と「残り分」に分ける
		//    90 → { hours: 1, mins: 30 }
		//    (m) => {...} は「m を受け取って変換する関数」を渡している
		(m) => ({ hours: Math.floor(m / 60), mins: m % 60 }),

		// ③ フォーマットステップ: オブジェクトを日本語文字列に変換
		//    { hours: 1, mins: 30 } → "1時間30分"
		//    前のステップの出力が自動的に引数として渡される
		({ hours, mins }) => {
			if (hours === 0) return `${mins}分`
			if (mins === 0) return `${hours}時間`
			return `${hours}時間${mins}分`
		},
	)
}
