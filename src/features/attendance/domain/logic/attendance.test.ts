import { describe, expect, it } from "vitest"
import type { AttendanceDay } from "../entities/attendance"
import { canClockIn, canClockOut, getStatus } from "./attendance"

const base: AttendanceDay = {
	date: "2026-02-23",
	status: "not_started",
	clockIn: null,
	clockOut: null,
	workMinutes: null,
}

describe("canClockIn", () => {
	it("未出勤: true", () => {
		expect(canClockIn({ ...base, status: "not_started" })).toBe(true)
	})
	it("勤務中: false", () => {
		expect(canClockIn({ ...base, status: "working" })).toBe(false)
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
	it("退勤済み: false", () => {
		expect(canClockOut({ ...base, status: "finished" })).toBe(false)
	})
})

describe("getStatus", () => {
	it("各ステータスをそのまま返す", () => {
		expect(getStatus({ ...base, status: "not_started" })).toBe("not_started")
		expect(getStatus({ ...base, status: "working" })).toBe("working")
		expect(getStatus({ ...base, status: "finished" })).toBe("finished")
	})
})
