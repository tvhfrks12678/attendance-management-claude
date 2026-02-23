import { z } from "zod"

export const AttendanceStatusSchema = z.enum(["not_started", "working", "on_break", "finished"])
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>

export const BreakPeriodSchema = z.object({
	breakStart: z.string(),
	breakEnd: z.string().nullable(),
})
export type BreakPeriod = z.infer<typeof BreakPeriodSchema>

export const TodayResponseSchema = z.object({
	date: z.string(),
	status: AttendanceStatusSchema,
	clockIn: z.string().nullable(),
	clockOut: z.string().nullable(),
	workMinutes: z.number().nullable(),
	breaks: z.array(BreakPeriodSchema),
	breakMinutes: z.number().nullable(),
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
	breakMinutes: z.number().optional(),
	message: z.string(),
})
export type ClockOutResponse = z.infer<typeof ClockOutResponseSchema>

export const BreakStartResponseSchema = z.object({
	success: z.boolean(),
	breakStart: z.string().optional(),
	message: z.string(),
})
export type BreakStartResponse = z.infer<typeof BreakStartResponseSchema>

export const BreakEndResponseSchema = z.object({
	success: z.boolean(),
	breakEnd: z.string().optional(),
	breakMinutes: z.number().optional(),
	message: z.string(),
})
export type BreakEndResponse = z.infer<typeof BreakEndResponseSchema>

export const HistoryResponseSchema = z.object({
	records: z.array(TodayResponseSchema),
})
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>
