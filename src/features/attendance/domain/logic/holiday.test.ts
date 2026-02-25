import { describe, expect, it } from "vitest";
import { getHolidayNameByLocale } from "./holiday";

describe("getHolidayNameByLocale", () => {
	it("ja-JP locale のとき日本の祝日名を返す", () => {
		const result = getHolidayNameByLocale(new Date(2026, 0, 1), "ja-JP");
		expect(result).toBe("元日");
	});

	it("英語ロケールでは日本の祝日を返さない", () => {
		const result = getHolidayNameByLocale(new Date(2026, 0, 1), "en-US");
		expect(result).toBeNull();
	});

	it("日曜祝日の振替休日を返す", () => {
		// 2029-02-11 (建国記念の日) は日曜日、翌 02-12 が振替休日
		const result = getHolidayNameByLocale(new Date(2029, 1, 12), "ja");
		expect(result).toBe("振替休日");
	});
});
