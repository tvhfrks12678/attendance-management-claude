import { createServerFn } from "@tanstack/react-start"
import { startBreak } from "../application/services/attendanceService"

export const postBreakStart = createServerFn({ method: "POST" }).handler(startBreak)
