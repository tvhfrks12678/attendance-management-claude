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
			}
		}
		return { ...todayRecord }
	}

	async save(record: AttendanceDay): Promise<void> {
		todayRecord = { ...record }
	}

	async getHistory(): Promise<AttendanceDay[]> {
		return [...initialHistory]
	}
}
