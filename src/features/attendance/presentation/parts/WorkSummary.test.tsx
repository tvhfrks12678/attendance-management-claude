// React Testing Library (RTL) の render と screen をインポート
// render: コンポーネントを仮想 DOM にマウントする関数
// screen: マウントされた DOM を検索するクエリ集合
import { render, screen } from "@testing-library/react"
// Vitest のテスト構造 API をインポート
import { describe, expect, it } from "vitest"
// テスト対象のコンポーネントをインポート
import { WorkSummary } from "./WorkSummary"

// WorkSummary コンポーネントのテスト用 props を作るヘルパー
// TodayResponse 型の必須フィールドをすべて含む「最小限の有効データ」
const baseRecord = {
	date: "2026-02-25", // 日付文字列
	status: "working" as const, // ステータス（TypeScript の const アサーション）
	clockIn: "2026-02-25T09:00:00.000Z", // 出勤時刻（ISO 文字列）
	clockOut: null, // 退勤時刻（まだ退勤していない）
	workMinutes: null, // 勤務時間（退勤前は null）
	breaks: [], // 休憩リスト
	breakMinutes: null, // 休憩時間合計（休憩なし）
}

describe("WorkSummary", () => {
	it("clockIn があるとき、出勤時刻が表示される", () => {
		// clockIn が設定されているとき「出勤時刻」のラベルが表示されることを確認する。
		// コンポーネントは clockIn !== null のとき出勤時刻行をレンダリングする。

		render(<WorkSummary record={baseRecord} />)
		// ↑ WorkSummary を jsdom の仮想 DOM にマウントする

		const label = screen.getByText("出勤時刻")
		// ↑ DOM から "出勤時刻" というテキストを持つ要素を取得する
		//   要素が見つからなければ例外を投げてテスト失敗になる（getBy* の特性）

		expect(label).toBeDefined()
		// ↑ 要素が存在することを確認（getByText が返した時点で存在は保証されるが
		//   明示的に書くことで「何を確認したいか」が読み手に伝わる）
	})

	it("clockOut が null のとき、退勤時刻は表示されない", () => {
		// clockOut が null のとき「退勤時刻」行が DOM に存在しないことを確認する。
		// 「存在しないこと」のテストには queryByText を使う（存在しない場合に null を返す）。

		render(<WorkSummary record={{ ...baseRecord, clockOut: null }} />)
		// ↑ baseRecord をコピーして clockOut を明示的に null に設定

		const label = screen.queryByText("退勤時刻")
		// ↑ queryByText: 要素が見つからなかった場合 null を返す
		//   (getByText と違い、要素がなくてもテストは失敗しない)

		expect(label).toBeNull()
		// ↑ 要素が存在しない（null）ことを確認
	})

	it("workMinutes = 480 のとき、勤務時間 '8時間' が表示される", () => {
		// workMinutes の数値が formatDuration を通して正しく表示されることを確認する。
		// formatDuration(480) = "8時間" という変換が UI に反映されているかを検証する。

		render(
			<WorkSummary
				record={{
					...baseRecord, // baseRecord をベースにする
					clockOut: "2026-02-25T18:00:00.000Z", // 退勤時刻を設定
					workMinutes: 480, // 8時間 = 480分
					status: "finished" as const, // 退勤済みステータス
				}}
			/>,
		)

		const label = screen.getByText("勤務時間")
		// ↑ "勤務時間" ラベルが表示されることを確認

		expect(label).toBeDefined()
		// ↑ ラベルが存在することを確認

		const value = screen.getByText("8時間")
		// ↑ formatDuration(480) の結果 "8時間" が表示されることを確認
		//   ドメインロジック (formatDuration) と UI の結合を間接的に検証している

		expect(value).toBeDefined()
		// ↑ "8時間" という文字列が DOM に存在することを確認
	})
})
