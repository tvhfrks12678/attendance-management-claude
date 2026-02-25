import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CalendarView } from "./CalendarView";

afterEach(() => {
	cleanup();
});

const records = [
	{
		date: "2026-01-01",
		status: "finished" as const,
		clockIn: "2026-01-01T00:00:00.000Z",
		clockOut: "2026-01-01T09:00:00.000Z",
		workMinutes: 540,
		breaks: [],
		breakMinutes: 0,
	},
];

describe("CalendarView", () => {
	it("ja-JP locale では祝日名を表示する", () => {
		render(
			<CalendarView
				records={records}
				locale="ja-JP"
				initialDate={new Date(2026, 0, 1)}
			/>,
		);
		expect(screen.getByText("元日")).toBeDefined();
	});

	it("en-US locale では日本の祝日名を表示しない", () => {
		render(
			<CalendarView
				records={records}
				locale="en-US"
				initialDate={new Date(2026, 0, 1)}
			/>,
		);
		expect(screen.queryByText("元日")).toBeNull();
	});
});
