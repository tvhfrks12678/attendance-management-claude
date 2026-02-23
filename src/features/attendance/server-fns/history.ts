import { createServerFn } from "@tanstack/react-start"
import { getHistory } from "../application/services/attendanceService"

export const fetchHistory = createServerFn({ method: "GET" }).handler(getHistory)
