import type { AttendanceRepository } from "../domain/ports/attendanceRepository"
import { InMemoryAttendanceRepository } from "./repositories/inMemoryAttendanceRepository"

// 将来: drizzleAttendanceRepository に差し替えるだけで Turso に移行可能
let repository: AttendanceRepository | null = null

export function getRepository(): AttendanceRepository {
	if (!repository) {
		repository = new InMemoryAttendanceRepository()
	}
	return repository
}
