export type AttendanceStatus = "not_started" | "working" | "on_break" | "finished"

export interface BreakPeriod {
	breakStart: Date
	breakEnd: Date | null // null = 休憩中
}

export interface AttendanceDay {
	date: string // "2026-02-23" 形式
	status: AttendanceStatus
	clockIn: Date | null
	clockOut: Date | null
	workMinutes: number | null
	breaks: BreakPeriod[]
	breakMinutes: number | null
}

export interface WorkDuration {
	hours: number
	minutes: number
	totalMinutes: number
}
