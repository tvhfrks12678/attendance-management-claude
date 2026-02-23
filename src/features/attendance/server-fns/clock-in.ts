import { createServerFn } from "@tanstack/react-start"
import { clockIn } from "../application/services/attendanceService"

export const postClockIn = createServerFn({ method: "POST" }).handler(clockIn)
