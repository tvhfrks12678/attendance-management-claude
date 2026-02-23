export type AttendanceStatus = "not_started" | "working" | "finished"

export interface AttendanceDay {
	date: string // "2026-02-23" 形式
	status: AttendanceStatus
	clockIn: Date | null
	clockOut: Date | null
	workMinutes: number | null
}

export interface WorkDuration {
	hours: number
	minutes: number
	totalMinutes: number
}
