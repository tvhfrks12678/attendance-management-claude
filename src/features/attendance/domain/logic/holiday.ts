const MONDAY = 1;
const SUNDAY = 0;

const holidayCache = new Map<number, Map<string, string>>();

function toKey(month: number, day: number): string {
	return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getNthWeekdayOfMonth(
	year: number,
	monthIndex: number,
	weekday: number,
	nth: number,
): number {
	const firstDay = new Date(year, monthIndex, 1).getDay();
	const offset = (weekday - firstDay + 7) % 7;
	return 1 + offset + (nth - 1) * 7;
}

function getVernalEquinoxDay(year: number): number {
	return Math.floor(
		20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
	);
}

function getAutumnalEquinoxDay(year: number): number {
	return Math.floor(
		23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
	);
}

function addHoliday(
	map: Map<string, string>,
	month: number,
	day: number,
	name: string,
): void {
	map.set(toKey(month, day), name);
}

function createBaseJapaneseHolidays(year: number): Map<string, string> {
	const map = new Map<string, string>();

	addHoliday(map, 1, 1, "元日");

	if (year >= 2000) {
		addHoliday(map, 1, getNthWeekdayOfMonth(year, 0, MONDAY, 2), "成人の日");
	} else {
		addHoliday(map, 1, 15, "成人の日");
	}

	addHoliday(map, 2, 11, "建国記念の日");
	if (year >= 2020) addHoliday(map, 2, 23, "天皇誕生日");

	addHoliday(map, 3, getVernalEquinoxDay(year), "春分の日");
	addHoliday(map, 4, 29, "昭和の日");
	addHoliday(map, 5, 3, "憲法記念日");
	addHoliday(map, 5, 4, "みどりの日");
	addHoliday(map, 5, 5, "こどもの日");

	if (year >= 2003) {
		addHoliday(map, 7, getNthWeekdayOfMonth(year, 6, MONDAY, 3), "海の日");
	} else if (year >= 1996) {
		addHoliday(map, 7, 20, "海の日");
	}

	if (year >= 2016) {
		addHoliday(map, 8, 11, "山の日");
	}

	if (year >= 2003) {
		addHoliday(map, 9, getNthWeekdayOfMonth(year, 8, MONDAY, 3), "敬老の日");
	} else if (year >= 1966) {
		addHoliday(map, 9, 15, "敬老の日");
	}

	addHoliday(map, 9, getAutumnalEquinoxDay(year), "秋分の日");

	if (year >= 2020) {
		addHoliday(
			map,
			10,
			getNthWeekdayOfMonth(year, 9, MONDAY, 2),
			"スポーツの日",
		);
	} else if (year >= 2000) {
		addHoliday(map, 10, getNthWeekdayOfMonth(year, 9, MONDAY, 2), "体育の日");
	} else if (year >= 1966) {
		addHoliday(map, 10, 10, "体育の日");
	}

	addHoliday(map, 11, 3, "文化の日");
	addHoliday(map, 11, 23, "勤労感謝の日");

	return map;
}

function createJapaneseHolidayMap(year: number): Map<string, string> {
	const map = createBaseJapaneseHolidays(year);

	for (let month = 1; month <= 12; month++) {
		const daysInMonth = new Date(year, month, 0).getDate();
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month - 1, day);
			if (date.getDay() === SUNDAY && map.has(toKey(month, day))) {
				let substituteDay = day + 1;
				while (substituteDay <= daysInMonth) {
					const key = toKey(month, substituteDay);
					if (!map.has(key)) {
						map.set(key, "振替休日");
						break;
					}
					substituteDay += 1;
				}
			}
		}
	}

	for (let month = 1; month <= 12; month++) {
		const daysInMonth = new Date(year, month, 0).getDate();
		for (let day = 2; day < daysInMonth; day++) {
			const prevKey = toKey(month, day - 1);
			const key = toKey(month, day);
			const nextKey = toKey(month, day + 1);
			const date = new Date(year, month - 1, day);

			if (
				date.getDay() !== SUNDAY &&
				date.getDay() !== 6 &&
				!map.has(key) &&
				map.has(prevKey) &&
				map.has(nextKey)
			) {
				map.set(key, "国民の休日");
			}
		}
	}

	return map;
}

function getJapaneseHolidayName(date: Date): string | null {
	const year = date.getFullYear();
	let map = holidayCache.get(year);
	if (!map) {
		map = createJapaneseHolidayMap(year);
		holidayCache.set(year, map);
	}

	return map.get(toKey(date.getMonth() + 1, date.getDate())) ?? null;
}

function shouldUseJapaneseHoliday(locale: string): boolean {
	const normalized = locale.toLowerCase();
	return normalized.startsWith("ja") || normalized.endsWith("-jp");
}

export function getHolidayNameByLocale(
	date: Date,
	locale: string,
): string | null {
	if (shouldUseJapaneseHoliday(locale)) {
		return getJapaneseHolidayName(date);
	}
	return null;
}
