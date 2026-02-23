import { useEffect, useState } from "react"

function formatDate(date: Date): string {
	return date.toLocaleDateString("ja-JP", {
		timeZone: "Asia/Tokyo",
		year: "numeric",
		month: "long",
		day: "numeric",
		weekday: "short",
	})
}

function formatTime(date: Date): string {
	return date.toLocaleTimeString("ja-JP", {
		timeZone: "Asia/Tokyo",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	})
}

export function CurrentTime() {
	const [now, setNow] = useState(() => new Date())

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 1000)
		return () => clearInterval(timer)
	}, [])

	return (
		<div className="text-center space-y-1">
			<p className="text-3xl font-mono font-bold tabular-nums">{formatTime(now)}</p>
			<p className="text-sm text-muted-foreground">{formatDate(now)}</p>
		</div>
	)
}
