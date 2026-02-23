import { Badge } from "#/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Separator } from "#/components/ui/separator"
import type { TodayResponse } from "../../contracts/attendance"
import { ClockButton } from "./ClockButton"
import { WorkSummary } from "./WorkSummary"

interface StatusCardProps {
	record: TodayResponse
}

const statusConfig = {
	not_started: {
		label: "未出勤",
		variant: "secondary" as const,
		cardClass: "border-gray-200",
	},
	working: {
		label: "🟢 勤務中",
		variant: "default" as const,
		cardClass: "border-green-400 bg-green-50",
	},
	finished: {
		label: "✅ 退勤済み",
		variant: "outline" as const,
		cardClass: "border-blue-400 bg-blue-50",
	},
}

export function StatusCard({ record }: StatusCardProps) {
	const config = statusConfig[record.status]

	return (
		<Card className={`${config.cardClass} transition-colors`}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between text-base">
					<span>本日のステータス</span>
					<Badge variant={config.variant}>{config.label}</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{record.status !== "not_started" && (
					<>
						<WorkSummary record={record} />
						<Separator />
					</>
				)}
				<ClockButton status={record.status} />
			</CardContent>
		</Card>
	)
}
