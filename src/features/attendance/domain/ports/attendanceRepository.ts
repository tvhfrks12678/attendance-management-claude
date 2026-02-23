import type { AttendanceDay } from "../entities/attendance"

export interface AttendanceRepository {
	getToday(date: string): Promise<AttendanceDay>
	save(record: AttendanceDay): Promise<void>
	getHistory(): Promise<AttendanceDay[]>
}
