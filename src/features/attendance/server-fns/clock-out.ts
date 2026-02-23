import { createServerFn } from "@tanstack/react-start"
import { clockOut } from "../application/services/attendanceService"

export const postClockOut = createServerFn({ method: "POST" }).handler(clockOut)
