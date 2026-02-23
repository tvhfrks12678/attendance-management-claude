import type { Clock } from "../domain/ports/clock"
import { SystemClock } from "./clock/systemClock"

let clock: Clock | null = null

export function getClock(): Clock {
	if (!clock) {
		clock = new SystemClock()
	}
	return clock
}
