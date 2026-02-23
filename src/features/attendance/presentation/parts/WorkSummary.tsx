import { formatDuration } from "../../domain/logic/worktime"
import type { TodayResponse } from "../../contracts/attendance"

interface WorkSummaryProps {
	record: TodayResponse
}

function formatTime(isoString: string): string {
	return new Date(isoString).toLocaleTimeString("ja-JP", {
		timeZone: "Asia/Tokyo",
		hour: "2-digit",
		minute: "2-digit",
	})
}

export function WorkSummary({ record }: WorkSummaryProps) {
	return (
		<div className="space-y-2 text-sm">
			{record.clockIn && (
				<div className="flex justify-between">
					<span className="text-muted-foreground">出勤時刻</span>
					<span className="font-medium">{formatTime(record.clockIn)}</span>
				</div>
			)}
			{record.clockOut && (
				<div className="flex justify-between">
					<span className="text-muted-foreground">退勤時刻</span>
					<span className="font-medium">{formatTime(record.clockOut)}</span>
				</div>
			)}
			{record.workMinutes !== null && (
				<div className="flex justify-between">
					<span className="text-muted-foreground">勤務時間</span>
					<span className="font-medium">{formatDuration(record.workMinutes)}</span>
				</div>
			)}
		</div>
	)
}
