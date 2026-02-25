import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
	// E2E テストファイルの場所
	testDir: "./e2e",

	// テスト失敗時のスクリーンショットを保存
	use: {
		// テスト対象のベース URL（ローカル開発サーバー）
		baseURL: "http://localhost:3000",
		// テスト失敗時のみスクリーンショットを撮る
		screenshot: "only-on-failure",
		// テスト失敗時のみトレースを記録
		trace: "on-first-retry",
	},

	// 使用するブラウザ（Chromium のみ）
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	// テスト実行前に開発サーバーを自動起動する設定
	webServer: {
		// 開発サーバー起動コマンド
		command: "pnpm run dev",
		// サーバーが起動したかチェックする URL
		url: "http://localhost:3000",
		// ローカル開発時は既存のサーバーを再利用する（毎回起動しない）
		reuseExistingServer: true,
		// サーバー起動の最大待機時間（ミリ秒）
		timeout: 30000,
	},
})
