import { useState } from "react"
import { Button } from "#/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog"
import { useClockIn, useClockOut, useEndBreak, useStartBreak } from "../hooks/useAttendance"
import type { AttendanceStatus } from "../../contracts/attendance"

interface ClockButtonProps {
	status: AttendanceStatus
}

type DialogAction = "clock-in" | "clock-out" | "break-start" | "break-end"

const dialogConfig: Record<DialogAction, { title: string; confirmLabel: string }> = {
	"clock-in": { title: "出勤しますか？", confirmLabel: "出勤する" },
	"clock-out": { title: "退勤しますか？", confirmLabel: "退勤する" },
	"break-start": { title: "休憩を開始しますか？", confirmLabel: "休憩開始" },
	"break-end": { title: "休憩を終了しますか？", confirmLabel: "休憩終了" },
}

function formatCurrentTime(): string {
	return new Date().toLocaleTimeString("ja-JP", {
		timeZone: "Asia/Tokyo",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	})
}

export function ClockButton({ status }: ClockButtonProps) {
	const [open, setOpen] = useState(false)
	const [action, setAction] = useState<DialogAction>("clock-in")
	const [currentTime, setCurrentTime] = useState("")

	const clockIn = useClockIn()
	const clockOut = useClockOut()
	const startBreak = useStartBreak()
	const endBreak = useEndBreak()

	const isPending =
		clockIn.isPending || clockOut.isPending || startBreak.isPending || endBreak.isPending

	function openDialog(a: DialogAction) {
		setAction(a)
		setCurrentTime(formatCurrentTime())
		setOpen(true)
	}

	function handleConfirm() {
		const opts = { onSettled: () => setOpen(false) }
		if (action === "clock-in") clockIn.mutate(undefined, opts)
		else if (action === "clock-out") clockOut.mutate(undefined, opts)
		else if (action === "break-start") startBreak.mutate(undefined, opts)
		else endBreak.mutate(undefined, opts)
	}

	const config = dialogConfig[action]

	if (status === "finished") {
		return (
			<p className="text-center text-sm text-muted-foreground py-4">
				本日の打刻は完了しました
			</p>
		)
	}

	return (
		<>
			<div className="space-y-3">
				{status === "not_started" && (
					<Button
						onClick={() => openDialog("clock-in")}
						disabled={isPending}
						size="lg"
						className="w-full py-8 text-lg font-bold bg-green-500 hover:bg-green-600 text-white"
					>
						🟢 出勤する
					</Button>
				)}

				{status === "working" && (
					<>
						<Button
							onClick={() => openDialog("break-start")}
							disabled={isPending}
							size="lg"
							variant="outline"
							className="w-full py-6 text-base font-bold border-yellow-400 text-yellow-700 hover:bg-yellow-50"
						>
							☕ 休憩開始
						</Button>
						<Button
							onClick={() => openDialog("clock-out")}
							disabled={isPending}
							size="lg"
							className="w-full py-8 text-lg font-bold bg-red-500 hover:bg-red-600 text-white"
						>
							🔴 退勤する
						</Button>
					</>
				)}

				{status === "on_break" && (
					<Button
						onClick={() => openDialog("break-end")}
						disabled={isPending}
						size="lg"
						className="w-full py-8 text-lg font-bold bg-yellow-500 hover:bg-yellow-600 text-white"
					>
						☕ 休憩終了
					</Button>
				)}
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>{config.title}</DialogTitle>
					</DialogHeader>
					<p className="text-center text-muted-foreground">現在時刻: {currentTime}</p>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
							キャンセル
						</Button>
						<Button
							onClick={handleConfirm}
							disabled={isPending}
							className={
								action === "clock-out"
									? "bg-red-500 hover:bg-red-600 text-white"
									: action === "clock-in"
										? "bg-green-500 hover:bg-green-600 text-white"
										: "bg-yellow-500 hover:bg-yellow-600 text-white"
							}
						>
							{isPending ? "処理中..." : config.confirmLabel}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
