import { z } from "zod"

export const AttendanceStatusSchema = z.enum(["not_started", "working", "finished"])
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>

export const TodayResponseSchema = z.object({
	date: z.string(),
	status: AttendanceStatusSchema,
	clockIn: z.string().nullable(),
	clockOut: z.string().nullable(),
	workMinutes: z.number().nullable(),
})
export type TodayResponse = z.infer<typeof TodayResponseSchema>

export const ClockInResponseSchema = z.object({
	success: z.boolean(),
	clockIn: z.string().optional(),
	message: z.string(),
})
export type ClockInResponse = z.infer<typeof ClockInResponseSchema>

export const ClockOutResponseSchema = z.object({
	success: z.boolean(),
	clockOut: z.string().optional(),
	workMinutes: z.number().optional(),
	message: z.string(),
})
export type ClockOutResponse = z.infer<typeof ClockOutResponseSchema>

export const HistoryResponseSchema = z.object({
	records: z.array(TodayResponseSchema),
})
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>
