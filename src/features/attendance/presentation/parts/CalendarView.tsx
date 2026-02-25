import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import type { TodayResponse } from "../../contracts/attendance"
import { formatDuration } from "../../domain/logic/worktime"

interface CalendarViewProps {
	records: TodayResponse[]
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const

// 曜日インデックスに対応するテキストカラーを返す
function getDayTextClass(colIndex: number): string {
	if (colIndex % 7 === 0) return "text-red-500"
	if (colIndex % 7 === 6) return "text-blue-500"
	return ""
}

// ステータスに応じた背景・ボーダーカラーを返す
function getStatusBg(status: TodayResponse["status"]): string {
	switch (status) {
		case "finished":
			return "bg-green-50 border-green-200"
		case "working":
			return "bg-blue-50 border-blue-200"
		case "on_break":
			return "bg-yellow-50 border-yellow-200"
		default:
			return "border-transparent"
	}
}

export function CalendarView({ records }: CalendarViewProps) {
	const today = new Date()
	const [year, setYear] = useState(today.getFullYear())
	const [month, setMonth] = useState(today.getMonth()) // 0-indexed

	// date 文字列 → レコードの Map を作成（O(1) ルックアップ）
	const recordMap = new Map(records.map((r) => [r.date, r]))

	// 月の1日と日数を計算
	const firstDay = new Date(year, month, 1)
	const daysInMonth = new Date(year, month + 1, 0).getDate()
	const startDow = firstDay.getDay() // 0 = 日曜日

	const prevMonth = () => {
		if (month === 0) {
			setYear(year - 1)
			setMonth(11)
		} else {
			setMonth(month - 1)
		}
	}

	const nextMonth = () => {
		if (month === 11) {
			setYear(year + 1)
			setMonth(0)
		} else {
			setMonth(month + 1)
		}
	}

	// カレンダーセルの配列: 月初前は null、各日は日付の数値
	const cells: (number | null)[] = [
		...Array(startDow).fill(null),
		...Array.from({ length: daysInMonth }, (_, i) => i + 1),
	]
	// 最終週を埋める
	while (cells.length % 7 !== 0) cells.push(null)

	return (
		<div>
			{/* 月ナビゲーション */}
			<div className="flex items-center justify-between mb-3">
				<button
					onClick={prevMonth}
					className="p-1.5 hover:bg-muted rounded-lg transition-colors"
					aria-label="前の月"
				>
					<ChevronLeft size={18} />
				</button>
				<span className="font-semibold">
					{year}年{month + 1}月
				</span>
				<button
					onClick={nextMonth}
					className="p-1.5 hover:bg-muted rounded-lg transition-colors"
					aria-label="次の月"
				>
					<ChevronRight size={18} />
				</button>
			</div>

			{/* 曜日ヘッダー */}
			<div className="grid grid-cols-7 mb-1">
				{WEEKDAYS.map((d, i) => (
					<div
						key={d}
						className={`text-center text-xs font-medium py-1 ${
							i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
						}`}
					>
						{d}
					</div>
				))}
			</div>

			{/* 日付セル */}
			<div className="grid grid-cols-7 gap-0.5">
				{cells.map((day, idx) => {
					if (day === null) return <div key={`empty-${idx}`} className="min-h-[52px]" />

					const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
					const record = recordMap.get(dateStr)
					const isToday =
						day === today.getDate() &&
						month === today.getMonth() &&
						year === today.getFullYear()

					return (
						<div
							key={dateStr}
							className={`rounded border min-h-[52px] p-1 text-xs ${
								record ? getStatusBg(record.status) : "border-transparent"
							} ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
						>
							<div className={`font-medium leading-none mb-1 ${getDayTextClass(idx)}`}>
								{day}
							</div>
							{record?.status === "finished" && record.workMinutes !== null && (
								<div className="text-[10px] text-green-700 leading-tight">
									{formatDuration(record.workMinutes)}
								</div>
							)}
							{record?.status === "working" && (
								<div className="text-[10px] text-blue-600 leading-tight">勤務中</div>
							)}
							{record?.status === "on_break" && (
								<div className="text-[10px] text-yellow-600 leading-tight">休憩中</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}
