import { describe, expect, it } from "vitest"
import type { AttendanceDay } from "../entities/attendance"
import { canClockIn, canClockOut, canEndBreak, canStartBreak, getStatus } from "./attendance"

const base: AttendanceDay = {
	date: "2026-02-23",
	status: "not_started",
	clockIn: null,
	clockOut: null,
	workMinutes: null,
	breaks: [],
	breakMinutes: null,
}

describe("canClockIn", () => {
	it("未出勤: true", () => {
		expect(canClockIn({ ...base, status: "not_started" })).toBe(true)
	})
	it("勤務中: false", () => {
		expect(canClockIn({ ...base, status: "working" })).toBe(false)
	})
	it("休憩中: false", () => {
		expect(canClockIn({ ...base, status: "on_break" })).toBe(false)
	})
	it("退勤済み: false", () => {
		expect(canClockIn({ ...base, status: "finished" })).toBe(false)
	})
})

describe("canClockOut", () => {
	it("未出勤: false", () => {
		expect(canClockOut({ ...base, status: "not_started" })).toBe(false)
	})
	it("勤務中: true", () => {
		expect(canClockOut({ ...base, status: "working" })).toBe(true)
	})
	it("休憩中: false", () => {
		expect(canClockOut({ ...base, status: "on_break" })).toBe(false)
	})
	it("退勤済み: false", () => {
		expect(canClockOut({ ...base, status: "finished" })).toBe(false)
	})
})

describe("canStartBreak", () => {
	it("未出勤: false", () => {
		expect(canStartBreak({ ...base, status: "not_started" })).toBe(false)
	})
	it("勤務中: true", () => {
		expect(canStartBreak({ ...base, status: "working" })).toBe(true)
	})
	it("休憩中: false", () => {
		expect(canStartBreak({ ...base, status: "on_break" })).toBe(false)
	})
	it("退勤済み: false", () => {
		expect(canStartBreak({ ...base, status: "finished" })).toBe(false)
	})
})

describe("canEndBreak", () => {
	it("未出勤: false", () => {
		expect(canEndBreak({ ...base, status: "not_started" })).toBe(false)
	})
	it("勤務中: false", () => {
		expect(canEndBreak({ ...base, status: "working" })).toBe(false)
	})
	it("休憩中: true", () => {
		expect(canEndBreak({ ...base, status: "on_break" })).toBe(true)
	})
	it("退勤済み: false", () => {
		expect(canEndBreak({ ...base, status: "finished" })).toBe(false)
	})
})

describe("getStatus", () => {
	it("各ステータスをそのまま返す", () => {
		expect(getStatus({ ...base, status: "not_started" })).toBe("not_started")
		expect(getStatus({ ...base, status: "working" })).toBe("working")
		expect(getStatus({ ...base, status: "on_break" })).toBe("on_break")
		expect(getStatus({ ...base, status: "finished" })).toBe("finished")
	})
})
