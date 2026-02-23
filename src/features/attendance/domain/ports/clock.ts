export interface Clock {
	now(): Date
	todayString(): string // "2026-02-23" 形式
}
