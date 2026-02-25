import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { TodayResponse } from "../../contracts/attendance";
import { getHolidayNameByLocale } from "../../domain/logic/holiday";
import { formatDuration } from "../../domain/logic/worktime";

interface CalendarViewProps {
	records: TodayResponse[];
	locale?: string;
	initialDate?: Date;
}

interface CalendarCell {
	day: number | null;
	key: string;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

// 曜日インデックスに対応するテキストカラーを返す
function getDayTextClass(dayOfWeek: number, isHoliday: boolean): string {
	if (isHoliday) return "text-rose-600";
	if (dayOfWeek === 0) return "text-red-500";
	if (dayOfWeek === 6) return "text-blue-500";
	return "";
}

// ステータスに応じた背景・ボーダーカラーを返す
function getStatusBg(status: TodayResponse["status"]): string {
	switch (status) {
		case "finished":
			return "bg-green-50 border-green-200";
		case "working":
			return "bg-blue-50 border-blue-200";
		case "on_break":
			return "bg-yellow-50 border-yellow-200";
		default:
			return "border-transparent";
	}
}

export function CalendarView({
	records,
	locale = "ja-JP",
	initialDate,
}: CalendarViewProps) {
	const today = initialDate ?? new Date();
	const [year, setYear] = useState(today.getFullYear());
	const [month, setMonth] = useState(today.getMonth()); // 0-indexed

	// date 文字列 → レコードの Map を作成（O(1) ルックアップ）
	const recordMap = new Map(records.map((r) => [r.date, r]));

	// 月の1日と日数を計算
	const firstDay = new Date(year, month, 1);
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const startDow = firstDay.getDay(); // 0 = 日曜日

	const prevMonth = () => {
		if (month === 0) {
			setYear(year - 1);
			setMonth(11);
		} else {
			setMonth(month - 1);
		}
	};

	const nextMonth = () => {
		if (month === 11) {
			setYear(year + 1);
			setMonth(0);
		} else {
			setMonth(month + 1);
		}
	};

	// カレンダーセルの配列: 月初前は null、各日は日付の数値
	const cells: CalendarCell[] = [
		...Array.from({ length: startDow }, (_, i) => ({
			day: null,
			key: `leading-empty-${year}-${month}-${i}`,
		})),
		...Array.from({ length: daysInMonth }, (_, i) => ({
			day: i + 1,
			key: `day-${year}-${month + 1}-${i + 1}`,
		})),
	];
	// 最終週を埋める
	const trailingEmptyCount = (7 - (cells.length % 7)) % 7;
	cells.push(
		...Array.from({ length: trailingEmptyCount }, (_, i) => ({
			day: null,
			key: `trailing-empty-${year}-${month}-${i}`,
		})),
	);

	return (
		<div>
			{/* 月ナビゲーション */}
			<div className="flex items-center justify-between mb-3">
				<button
					type="button"
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
					type="button"
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
							i === 0
								? "text-red-500"
								: i === 6
									? "text-blue-500"
									: "text-muted-foreground"
						}`}
					>
						{d}
					</div>
				))}
			</div>

			{/* 日付セル */}
			<div className="grid grid-cols-7 gap-0.5">
				{cells.map((cell) => {
					if (cell.day === null) {
						return <div key={cell.key} className="min-h-[52px]" />;
					}

					const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
					const date = new Date(year, month, cell.day);
					const holidayName = getHolidayNameByLocale(date, locale);
					const record = recordMap.get(dateStr);
					const isToday =
						cell.day === today.getDate() &&
						month === today.getMonth() &&
						year === today.getFullYear();

					return (
						<div
							key={cell.key}
							className={`rounded border min-h-[52px] p-1 text-xs ${
								record ? getStatusBg(record.status) : "border-transparent"
							} ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
						>
							<div
								className={`font-medium leading-none mb-1 ${getDayTextClass(
									date.getDay(),
									holidayName !== null,
								)}`}
							>
								{cell.day}
							</div>
							{holidayName && (
								<div className="text-[10px] text-rose-600 leading-tight">
									{holidayName}
								</div>
							)}
							{record?.status === "finished" && record.workMinutes !== null && (
								<div className="text-[10px] text-green-700 leading-tight">
									{formatDuration(record.workMinutes)}
								</div>
							)}
							{record?.status === "working" && (
								<div className="text-[10px] text-blue-600 leading-tight">
									勤務中
								</div>
							)}
							{record?.status === "on_break" && (
								<div className="text-[10px] text-yellow-600 leading-tight">
									休憩中
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
