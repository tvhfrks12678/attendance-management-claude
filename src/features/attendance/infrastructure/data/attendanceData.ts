import type { AttendanceDay } from "../../domain/entities/attendance"

// 過去の勤怠履歴（初期表示用）
export const initialHistory: AttendanceDay[] = [
	{
		date: "2026-02-21",
		status: "finished",
		clockIn: new Date("2026-02-21T09:15:00+09:00"),
		clockOut: new Date("2026-02-21T18:30:00+09:00"),
		workMinutes: 555,
	},
	{
		date: "2026-02-20",
		status: "finished",
		clockIn: new Date("2026-02-20T08:50:00+09:00"),
		clockOut: new Date("2026-02-20T17:45:00+09:00"),
		workMinutes: 535,
	},
	{
		date: "2026-02-19",
		status: "finished",
		clockIn: new Date("2026-02-19T09:00:00+09:00"),
		clockOut: new Date("2026-02-19T18:00:00+09:00"),
		workMinutes: 540,
	},
	{
		date: "2026-02-18",
		status: "finished",
		clockIn: new Date("2026-02-18T09:30:00+09:00"),
		clockOut: new Date("2026-02-18T18:15:00+09:00"),
		workMinutes: 525,
	},
	{
		date: "2026-02-17",
		status: "finished",
		clockIn: new Date("2026-02-17T08:45:00+09:00"),
		clockOut: new Date("2026-02-17T17:30:00+09:00"),
		workMinutes: 525,
	},
]
