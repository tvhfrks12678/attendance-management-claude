import { describe, expect, it } from "vitest"
import { calculateTotalBreakMinutes, calculateWorkDuration, formatDuration } from "./worktime"

describe("calculateWorkDuration", () => {
	it("9:00〜18:00 → 540分", () => {
		const result = calculateWorkDuration(
			new Date("2026-02-23T09:00:00+09:00"),
			new Date("2026-02-23T18:00:00+09:00"),
		)
		expect(result.totalMinutes).toBe(540)
		expect(result.hours).toBe(9)
		expect(result.minutes).toBe(0)
	})

	it("9:15〜18:30 → 555分", () => {
		const result = calculateWorkDuration(
			new Date("2026-02-23T09:15:00+09:00"),
			new Date("2026-02-23T18:30:00+09:00"),
		)
		expect(result.totalMinutes).toBe(555)
		expect(result.hours).toBe(9)
		expect(result.minutes).toBe(15)
	})

	it("日跨ぎ: 23:00〜01:00 → 120分", () => {
		const result = calculateWorkDuration(
			new Date("2026-02-22T23:00:00+09:00"),
			new Date("2026-02-23T01:00:00+09:00"),
		)
		expect(result.totalMinutes).toBe(120)
	})
})

describe("calculateTotalBreakMinutes", () => {
	it("休憩なし → 0分", () => {
		expect(calculateTotalBreakMinutes([])).toBe(0)
	})

	it("1回の休憩 60分", () => {
		const breaks = [
			{
				breakStart: new Date("2026-02-23T12:00:00+09:00"),
				breakEnd: new Date("2026-02-23T13:00:00+09:00"),
			},
		]
		expect(calculateTotalBreakMinutes(breaks)).toBe(60)
	})

	it("2回の休憩 合計90分", () => {
		const breaks = [
			{
				breakStart: new Date("2026-02-23T10:00:00+09:00"),
				breakEnd: new Date("2026-02-23T10:30:00+09:00"),
			},
			{
				breakStart: new Date("2026-02-23T12:00:00+09:00"),
				breakEnd: new Date("2026-02-23T13:00:00+09:00"),
			},
		]
		expect(calculateTotalBreakMinutes(breaks)).toBe(90)
	})

	it("休憩中（breakEnd が null）は now を使って計算する", () => {
		const start = new Date("2026-02-23T12:00:00+09:00")
		const now = new Date("2026-02-23T12:30:00+09:00")
		const breaks = [{ breakStart: start, breakEnd: null }]
		expect(calculateTotalBreakMinutes(breaks, now)).toBe(30)
	})
})

describe("formatDuration", () => {
	it("0分 → '0分'", () => {
		expect(formatDuration(0)).toBe("0分")
	})
	it("60分 → '1時間'", () => {
		expect(formatDuration(60)).toBe("1時間")
	})
	it("90分 → '1時間30分'", () => {
		expect(formatDuration(90)).toBe("1時間30分")
	})
	it("480分 → '8時間'", () => {
		expect(formatDuration(480)).toBe("8時間")
	})
	it("555分 → '9時間15分'", () => {
		expect(formatDuration(555)).toBe("9時間15分")
	})
})
