import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table"
import { formatDuration } from "../../domain/logic/worktime"
import type { TodayResponse } from "../../contracts/attendance"

interface HistoryTableProps {
	records: TodayResponse[]
}

function formatDate(dateStr: string): string {
	const date = new Date(`${dateStr}T00:00:00+09:00`)
	return date.toLocaleDateString("ja-JP", {
		timeZone: "Asia/Tokyo",
		month: "numeric",
		day: "numeric",
		weekday: "short",
	})
}

function formatTime(isoString: string | null): string {
	if (!isoString) return "-"
	return new Date(isoString).toLocaleTimeString("ja-JP", {
		timeZone: "Asia/Tokyo",
		hour: "2-digit",
		minute: "2-digit",
	})
}

export function HistoryTable({ records }: HistoryTableProps) {
	if (records.length === 0) {
		return <p className="text-center text-muted-foreground py-4">履歴がありません</p>
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>日付</TableHead>
					<TableHead className="text-center">出勤</TableHead>
					<TableHead className="text-center">退勤</TableHead>
					<TableHead className="text-center">休憩</TableHead>
					<TableHead className="text-right">勤務時間</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{records.map((record) => (
					<TableRow key={record.date} className="hover:bg-muted/50">
						<TableCell className="font-medium">{formatDate(record.date)}</TableCell>
						<TableCell className="text-center">{formatTime(record.clockIn)}</TableCell>
						<TableCell className="text-center">{formatTime(record.clockOut)}</TableCell>
						<TableCell className="text-center text-yellow-700">
							{record.breakMinutes !== null && record.breakMinutes > 0
								? formatDuration(record.breakMinutes)
								: "-"}
						</TableCell>
						<TableCell className="text-right">
							{record.workMinutes !== null ? formatDuration(record.workMinutes) : "-"}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
