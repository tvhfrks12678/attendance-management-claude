// Playwright のテスト API をインポート
// test: テストケースを定義する関数
// expect: アサーション（検証）を書く関数
import { expect, test } from "@playwright/test"

// 勤怠ページの E2E テスト
// ブラウザを実際に起動して、ユーザー操作に近い形でアプリを検証する
test.describe("勤怠ページ", () => {
	test("ページロード: '本日のステータス' 見出しが表示される", async ({ page }) => {
		// このテストの目的:
		// アプリが正常に起動し、メインコンテンツが表示されることを確認する。
		// 最初に確認すべき「アプリが生きているか」の基本テスト。

		await page.goto("/")
		// ↑ playwright.config.ts の baseURL (http://localhost:3000) に対して "/" を開く
		//   await: ページの読み込みが完了するまで待機

		await expect(page.getByText("本日のステータス")).toBeVisible()
		// ↑ page.getByText(): ページ内から指定テキストを持つ要素を取得
		//   .toBeVisible(): 要素が表示されている（hidden や display:none でない）ことを確認
		//   await: DOM の更新・アニメーションが完了するまで自動的にリトライする
	})

	test("初期状態: ステータスバッジに '未出勤' が表示される", async ({ page }) => {
		// このテストの目的:
		// サーバー起動直後（インメモリストアが空）の初期状態を確認する。
		// status = "not_started" のとき "未出勤" バッジが表示されることを検証する。

		await page.goto("/")
		// ↑ トップページを開く

		await expect(page.getByText("未出勤")).toBeVisible()
		// ↑ StatusCard の Badge に "未出勤" が表示されることを確認
		//   statusConfig["not_started"].label = "未出勤" のマッピングを間接的に検証している
	})

	test("出勤ボタンクリック: '出勤しますか？' ダイアログが表示される", async ({ page }) => {
		// このテストの目的:
		// ユーザーが「出勤する」ボタンをクリックしたとき、
		// 確認ダイアログが開くことをブラウザレベルで検証する。
		// RTL テストと異なり、実際のクリックイベント・状態変化・DOM 更新が連動して動くかを確認できる。

		await page.goto("/")
		// ↑ トップページを開く

		await page.getByRole("button", { name: "🟢 出勤する" }).click()
		// ↑ page.getByRole(): アクセシビリティロール（role="button"）で要素を取得する
		//   name オプション: ボタンのラベルテキストで絞り込む
		//   .click(): ボタンをクリックする（ユーザーの実際のクリックをシミュレート）

		await expect(page.getByText("出勤しますか？")).toBeVisible()
		// ↑ クリック後に Dialog が開き、タイトル "出勤しますか？" が表示されることを確認
		//   Radix UI の Dialog は DOM にマウント後にアニメーションするため、
		//   Playwright の自動リトライ（最大 5 秒）が役に立つ
	})
})
