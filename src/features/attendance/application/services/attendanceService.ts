import {
	canClockIn,
	canClockOut,
	canEndBreak,
	canStartBreak,
} from "../../domain/logic/attendance"
import { calculateTotalBreakMinutes, calculateWorkDuration } from "../../domain/logic/worktime"
import { getClock } from "../../infrastructure/getClock"
import { getRepository } from "../../infrastructure/getRepository"
import type {
	BreakEndResponse,
	BreakStartResponse,
	ClockInResponse,
	ClockOutResponse,
	HistoryResponse,
	TodayResponse,
} from "../../contracts/attendance"

function serializeBreaks(breaks: { breakStart: Date; breakEnd: Date | null }[]) {
	return breaks.map((b) => ({
		breakStart: b.breakStart.toISOString(),
		breakEnd: b.breakEnd ? b.breakEnd.toISOString() : null,
	}))
}

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
		breaks: serializeBreaks(record.breaks),
		breakMinutes: record.breakMinutes,
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
	const grossDuration = calculateWorkDuration(record.clockIn!, now)
	const totalBreakMinutes = calculateTotalBreakMinutes(record.breaks)
	const netWorkMinutes = Math.max(0, grossDuration.totalMinutes - totalBreakMinutes)

	await repository.save({
		...record,
		status: "finished",
		clockOut: now,
		workMinutes: netWorkMinutes,
		breakMinutes: totalBreakMinutes,
	})

	return {
		success: true,
		clockOut: now.toISOString(),
		workMinutes: netWorkMinutes,
		breakMinutes: totalBreakMinutes,
		message: "退勤しました",
	}
}

export async function startBreak(): Promise<BreakStartResponse> {
	const clock = getClock()
	const repository = getRepository()
	const date = clock.todayString()
	const record = await repository.getToday(date)

	if (!canStartBreak(record)) {
		return { success: false, message: "勤務中でないため休憩を開始できません" }
	}

	const now = clock.now()
	await repository.save({
		...record,
		status: "on_break",
		breaks: [...record.breaks, { breakStart: now, breakEnd: null }],
	})

	return {
		success: true,
		breakStart: now.toISOString(),
		message: "休憩を開始しました",
	}
}

export async function endBreak(): Promise<BreakEndResponse> {
	const clock = getClock()
	const repository = getRepository()
	const date = clock.todayString()
	const record = await repository.getToday(date)

	if (!canEndBreak(record)) {
		return { success: false, message: "休憩中でないため休憩を終了できません" }
	}

	const now = clock.now()
	const updatedBreaks = record.breaks.map((b, i) =>
		i === record.breaks.length - 1 ? { ...b, breakEnd: now } : b,
	)
	const totalBreakMinutes = calculateTotalBreakMinutes(updatedBreaks)

	await repository.save({
		...record,
		status: "working",
		breaks: updatedBreaks,
		breakMinutes: totalBreakMinutes,
	})

	return {
		success: true,
		breakEnd: now.toISOString(),
		breakMinutes: totalBreakMinutes,
		message: "休憩を終了しました",
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
			breaks: serializeBreaks(r.breaks),
			breakMinutes: r.breakMinutes,
		})),
	}
}
