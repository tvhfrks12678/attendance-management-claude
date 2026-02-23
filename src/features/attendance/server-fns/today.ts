import { createServerFn } from "@tanstack/react-start"
import { getToday } from "../application/services/attendanceService"

export const fetchToday = createServerFn({ method: "GET" }).handler(getToday)
