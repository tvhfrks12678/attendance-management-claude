import type { WorkDuration } from "../entities/attendance"

export function calculateWorkDuration(clockIn: Date, clockOut: Date): WorkDuration {
	const totalMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000)
	return {
		hours: Math.floor(totalMinutes / 60),
		minutes: totalMinutes % 60,
		totalMinutes,
	}
}

export function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60)
	const mins = minutes % 60
	if (hours === 0) return `${mins}分`
	if (mins === 0) return `${hours}時間`
	return `${hours}時間${mins}分`
}
