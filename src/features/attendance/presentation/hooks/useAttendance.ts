import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchHistory } from "../../server-fns/history"
import { fetchToday } from "../../server-fns/today"
import { postClockIn } from "../../server-fns/clock-in"
import { postClockOut } from "../../server-fns/clock-out"

export const QUERY_KEYS = {
	today: ["attendance", "today"] as const,
	history: ["attendance", "history"] as const,
}

export function useTodayAttendance() {
	return useQuery({
		queryKey: QUERY_KEYS.today,
		queryFn: () => fetchToday(),
	})
}

export function useAttendanceHistory() {
	return useQuery({
		queryKey: QUERY_KEYS.history,
		queryFn: () => fetchHistory(),
	})
}

export function useClockIn() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () => postClockIn(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["attendance"] })
		},
	})
}

export function useClockOut() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () => postClockOut(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["attendance"] })
		},
	})
}
