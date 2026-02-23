import { canClockIn, canClockOut } from "../../domain/logic/attendance"
import { calculateWorkDuration } from "../../domain/logic/worktime"
import { getClock } from "../../infrastructure/getClock"
import { getRepository } from "../../infrastructure/getRepository"
import type {
	ClockInResponse,
	ClockOutResponse,
	HistoryResponse,
	TodayResponse,
} from "../../contracts/attendance"

export async function getToday(): Promise<TodayResponse> {
	const clock = getClock()
	const repository = getRepository()
	const date = clock.todayString()
	const record = await repository.getToday(date)

	return {
		date: record.date,
		status: record.status,
		clockIn: record.clockIn ? record.clockIn.toISOString() : null,
		clockOut: record.clockOut ? record.clockOut.toISOString() : null,
		workMinutes: record.workMinutes,
	}
}

export async function clockIn(): Promise<ClockInResponse> {
	const clock = getClock()
	const repository = getRepository()
	const date = clock.todayString()
	const record = await repository.getToday(date)

	if (!canClockIn(record)) {
		return { success: false, message: "既に出勤済みです" }
	}

	const now = clock.now()
	await repository.save({
		...record,
		status: "working",
		clockIn: now,
	})

	return {
		success: true,
		clockIn: now.toISOString(),
		message: "出勤しました",
	}
}

export async function clockOut(): Promise<ClockOutResponse> {
	const clock = getClock()
	const repository = getRepository()
	const date = clock.todayString()
	const record = await repository.getToday(date)

	if (!canClockOut(record)) {
		return { success: false, message: "出勤していません" }
	}

	const now = clock.now()
	const workDuration = calculateWorkDuration(record.clockIn!, now)
	await repository.save({
		...record,
		status: "finished",
		clockOut: now,
		workMinutes: workDuration.totalMinutes,
	})

	return {
		success: true,
		clockOut: now.toISOString(),
		workMinutes: workDuration.totalMinutes,
		message: "退勤しました",
	}
}

export async function getHistory(): Promise<HistoryResponse> {
	const repository = getRepository()
	const records = await repository.getHistory()

	return {
		records: records.map((r) => ({
			date: r.date,
			status: r.status,
			clockIn: r.clockIn ? r.clockIn.toISOString() : null,
			clockOut: r.clockOut ? r.clockOut.toISOString() : null,
			workMinutes: r.workMinutes,
		})),
	}
}
