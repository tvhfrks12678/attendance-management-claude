import { useState } from "react"
import { Button } from "#/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog"
import { useClockIn, useClockOut } from "../hooks/useAttendance"
import type { AttendanceStatus } from "../../contracts/attendance"

interface ClockButtonProps {
	status: AttendanceStatus
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
	const [currentTime, setCurrentTime] = useState("")

	const clockIn = useClockIn()
	const clockOut = useClockOut()

	const isWorking = status === "working"
	const isFinished = status === "finished"

	function handleOpenDialog() {
		setCurrentTime(formatCurrentTime())
		setOpen(true)
	}

	function handleConfirm() {
		if (isWorking) {
			clockOut.mutate(undefined, { onSettled: () => setOpen(false) })
		} else {
			clockIn.mutate(undefined, { onSettled: () => setOpen(false) })
		}
	}

	const isPending = clockIn.isPending || clockOut.isPending

	if (isFinished) {
		return (
			<p className="text-center text-sm text-muted-foreground py-4">
				本日の打刻は完了しました
			</p>
		)
	}

	return (
		<>
			<Button
				onClick={handleOpenDialog}
				disabled={isPending}
				size="lg"
				className={`w-full py-8 text-lg font-bold ${
					isWorking
						? "bg-red-500 hover:bg-red-600 text-white"
						: "bg-green-500 hover:bg-green-600 text-white"
				}`}
			>
				{isWorking ? "🔴 退勤する" : "🟢 出勤する"}
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>{isWorking ? "退勤しますか？" : "出勤しますか？"}</DialogTitle>
					</DialogHeader>
					<p className="text-center text-muted-foreground">
						現在時刻: {currentTime}
					</p>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
							キャンセル
						</Button>
						<Button
							onClick={handleConfirm}
							disabled={isPending}
							className={
								isWorking
									? "bg-red-500 hover:bg-red-600 text-white"
									: "bg-green-500 hover:bg-green-600 text-white"
							}
						>
							{isPending ? "処理中..." : isWorking ? "退勤する" : "出勤する"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
