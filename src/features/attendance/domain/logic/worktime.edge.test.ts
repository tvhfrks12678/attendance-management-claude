// Option をインポート: calculateWorkDuration が Option<WorkDuration> を返すため
import { Option } from "effect"
// Vitest のテスト API をインポート
import { describe, expect, it } from "vitest"
// テスト対象の関数をインポート
import { calculateTotalBreakMinutes, calculateWorkDuration, formatDuration } from "./worktime"

// ── エッジケーステスト ──────────────────────────────────────────────────
// 通常ケースは worktime.test.ts でカバー済み。
// このファイルでは「境界値」と「異常値のガード」に絞ってテストする。

describe("calculateWorkDuration エッジケース", () => {
	it("出勤時刻と退勤時刻が同じ → Option.some({ totalMinutes: 0 })", () => {
		// 同じ時刻を渡したとき totalMinutes = 0 になる（負にはならない）ことを確認する。
		// これは「境界値テスト」の一例:
		//   負 (<0) と 非負 (>=0) の境界にある値 0 で Option.none() にならないかを検証する。
		const t = new Date("2026-02-25T09:00:00+09:00")

		// 同じ Date オブジェクトを clockIn / clockOut 両方に渡す
		const result = calculateWorkDuration(t, t)

		// Option.some() が返ることを確認（0分は有効な勤務時間として扱う）
		expect(Option.isSome(result)).toBe(true)

		// Option の中身を取り出して値を検証
		const duration = Option.getOrThrow(result)
		expect(duration.totalMinutes).toBe(0) // 0分ちょうど
		expect(duration.hours).toBe(0) // 0時間
		expect(duration.minutes).toBe(0) // 0分
	})
})

describe("formatDuration エッジケース", () => {
	it("1分 → '1分'", () => {
		// 最小単位 1分 のフォーマットを確認する。
		// hours === 0 のブランチが正しく動作するかの境界値テスト。
		// 0分は既存テストでカバー済みのため、ここでは「1分」だけをテストする。

		// formatDuration(1) を呼び出す（1 は hours=0, mins=1 に分解される）
		const result = formatDuration(1)

		// "1分" が返ることを確認（"0時間1分" にはならない）
		expect(result).toBe("1分")
	})
})

describe("calculateTotalBreakMinutes エッジケース", () => {
	it("breakEnd が breakStart より前の異常値 → 0分（負になってクランプされる）", () => {
		// 実装の Math.max(0, minutes) が正しく機能するかを確認する。
		// 「異常値ガードのテスト」: 入力が壊れていてもシステムが安全に動作することを担保する。
		//
		// 現実的には UI で防ぐべき入力だが、
		// データの直接操作やバグで breakEnd < breakStart になりうる。
		// そのとき合計が負にならないことを確認する。

		const breaks = [
			{
				// breakStart が breakEnd より「後」という異常な休憩データ
				breakStart: new Date("2026-02-25T13:00:00+09:00"), // 13:00
				breakEnd: new Date("2026-02-25T12:00:00+09:00"), // 12:00（開始より前）
			},
		]

		// 計算上は -60分になるが、Math.max(0, -60) = 0 にクランプされるはず
		const result = calculateTotalBreakMinutes(breaks)

		// 0分が返ることを確認（負の値にならない）
		expect(result).toBe(0)
	})
})
