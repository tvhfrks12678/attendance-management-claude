import type { Clock } from "../../domain/ports/clock"

export class SystemClock implements Clock {
	now(): Date {
		return new Date()
	}

	todayString(): string {
		// Asia/Tokyo 固定でYYYY-MM-DD形式を返す
		return new Intl.DateTimeFormat("en-CA", {
			timeZone: "Asia/Tokyo",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(this.now())
	}
}
