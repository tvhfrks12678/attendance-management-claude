import type { AttendanceDay } from "../../domain/entities/attendance"
import type { AttendanceRepository } from "../../domain/ports/attendanceRepository"
import { initialHistory } from "../data/attendanceData"

// サーバー再起動でリセットされるインメモリ状態
let todayRecord: AttendanceDay = {
	date: new Date().toISOString().split("T")[0] as string,
	status: "not_started",
	clockIn: null,
	clockOut: null,
	workMinutes: null,
	breaks: [],
	breakMinutes: null,
}

export class InMemoryAttendanceRepository implements AttendanceRepository {
	async getToday(date: string): Promise<AttendanceDay> {
		if (todayRecord.date !== date) {
			todayRecord = {
				date,
				status: "not_started",
				clockIn: null,
				clockOut: null,
				workMinutes: null,
				breaks: [],
				breakMinutes: null,
			}
		}
		return {
			...todayRecord,
			breaks: todayRecord.breaks.map((b) => ({ ...b })),
		}
	}

	async save(record: AttendanceDay): Promise<void> {
		todayRecord = {
			...record,
			breaks: record.breaks.map((b) => ({ ...b })),
		}
	}

	async getHistory(): Promise<AttendanceDay[]> {
		return [...initialHistory]
	}
}
