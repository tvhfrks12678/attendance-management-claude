import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Separator } from "#/components/ui/separator"
import { useAttendanceHistory, useTodayAttendance } from "./hooks/useAttendance"
import { CalendarView } from "./parts/CalendarView"
import { CurrentTime } from "./parts/CurrentTime"
import { HistoryTable } from "./parts/HistoryTable"
import { StatusCard } from "./parts/StatusCard"
import { useViewModeStore } from "./store/viewModeStore"

export function AttendancePage() {
	const today = useTodayAttendance()
	const history = useAttendanceHistory()
	const { viewMode } = useViewModeStore()

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-lg mx-auto px-4 py-8 space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold">出勤管理</h1>
				</div>

				<Card>
					<CardContent className="pt-6">
						<CurrentTime />
					</CardContent>
				</Card>

				{today.isPending ? (
					<Card>
						<CardContent className="py-8 text-center text-muted-foreground">
							読み込み中...
						</CardContent>
					</Card>
				) : today.isError ? (
					<Card>
						<CardContent className="py-8 text-center text-destructive">
							データの取得に失敗しました
						</CardContent>
					</Card>
				) : today.data ? (
					<StatusCard record={today.data} />
				) : null}

				<Separator />

				<Card>
					<CardHeader>
						<CardTitle className="text-base">勤怠履歴</CardTitle>
					</CardHeader>
					<CardContent>
						{history.isPending ? (
							<p className="text-center text-muted-foreground py-4">読み込み中...</p>
						) : history.isError ? (
							<p className="text-center text-destructive py-4">
								履歴の取得に失敗しました
							</p>
						) : history.data ? (
							viewMode === "simple" ? (
								<HistoryTable records={history.data.records} />
							) : (
								<CalendarView records={history.data.records} />
							)
						) : null}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
