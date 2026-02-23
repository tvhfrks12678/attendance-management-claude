import { createServerFn } from "@tanstack/react-start"
import { endBreak } from "../application/services/attendanceService"

export const postBreakEnd = createServerFn({ method: "POST" }).handler(endBreak)
