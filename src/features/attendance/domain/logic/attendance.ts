import type { AttendanceDay, AttendanceStatus } from "../entities/attendance"

export function canClockIn(today: AttendanceDay): boolean {
	return today.status === "not_started"
}

export function canClockOut(today: AttendanceDay): boolean {
	return today.status === "working"
}

export function getStatus(today: AttendanceDay): AttendanceStatus {
	return today.status
}
