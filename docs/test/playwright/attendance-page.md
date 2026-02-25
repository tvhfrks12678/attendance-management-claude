# Playwright E2E テスト解説

**ファイル**: `e2e/attendance.spec.ts`
**設定**: `playwright.config.ts`

---

## Why: なぜこのテストを追加したか

Vitest（ユニットテスト）と RTL（コンポーネントテスト）では、実際のブラウザやサーバーを使わない。
そのため「画面を開いてボタンをクリックしたら本当に動くか」は確認できない。

Playwright E2E テストはブラウザを実際に起動し、ユーザーが操作するのと同じ経路でアプリを検証する。

| テスト | 確認すること |
|---|---|
| ページロード | サーバーが起動し、メインコンテンツが表示されること |
| 初期状態 | インメモリストア空の状態で "未出勤" バッジが表示されること |
| ボタン→ダイアログ | クリックでダイアログが開くインタラクションが動作すること |

---

## 設定ファイル (playwright.config.ts)

```typescript
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  // ↑ E2E テストファイルを探すディレクトリ

  use: {
    baseURL: "http://localhost:3000",
    // ↑ page.goto("/") が http://localhost:3000/ になる
    screenshot: "only-on-failure",
    // ↑ テスト失敗時のみスクリーンショットを保存（デバッグ用）
    trace: "on-first-retry",
    // ↑ リトライ時にトレース（クリック・ネットワーク等の記録）を保存
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // ↑ Desktop Chrome のビューポート・UA を模倣
    },
  ],

  webServer: {
    command: "pnpm run dev",
    // ↑ テスト実行前に開発サーバーを起動するコマンド
    url: "http://localhost:3000",
    // ↑ このURLが応答するまで待ってからテストを開始する
    reuseExistingServer: true,
    // ↑ すでにサーバーが起動していれば再利用する（ローカル開発時に便利）
    timeout: 30000,
    // ↑ サーバー起動の最大待機時間（30秒）
  },
})
```

---

## コード

```typescript
import { expect, test } from "@playwright/test"
// ↑ test: テストケース定義 / expect: アサーション API

test.describe("勤怠ページ", () => {
  // ↑ テストグループ。関連するテストをまとめる

  test("ページロード: '本日のステータス' 見出しが表示される", async ({ page }) => {
    // ↑ async: 非同期テスト（ブラウザ操作は await が必要）
    //   { page }: Playwright の Page オブジェクト（ブラウザタブ1枚に相当）

    await page.goto("/")
    // ↑ baseURL + "/" = http://localhost:3000/ を開く
    //   await: ページ読み込み完了まで待機

    await expect(page.getByText("本日のステータス")).toBeVisible()
    // ↑ page.getByText(): テキストで要素を取得
    //   .toBeVisible(): 要素が表示されているか確認
    //   Playwright の expect は自動リトライ付き（デフォルト 5 秒）
  })

  test("初期状態: ステータスバッジに '未出勤' が表示される", async ({ page }) => {
    await page.goto("/")
    // ↑ トップページを開く

    await expect(page.getByText("未出勤")).toBeVisible()
    // ↑ サーバー起動直後はインメモリストアが空のため
    //   status = "not_started" → バッジに "未出勤" が表示される
  })

  test("出勤ボタンクリック: '出勤しますか？' ダイアログが表示される", async ({ page }) => {
    await page.goto("/")
    // ↑ トップページを開く

    await page.getByRole("button", { name: "🟢 出勤する" }).click()
    // ↑ page.getByRole(): アクセシビリティロール + ラベルで要素を特定する
    //   getByRole("button") はボタン要素を探す
    //   name オプション: ボタンのテキスト（アクセシブルネーム）で絞り込む
    //   .click(): クリックイベントを発火

    await expect(page.getByText("出勤しますか？")).toBeVisible()
    // ↑ Dialog が開き、タイトルが表示されることを確認
    //   Playwright は要素が visible になるまで最大 5 秒リトライする
  })
})
```

---

## 概念メモ

### E2E テスト / ユニットテスト / コンポーネントテストの違い

```
テストピラミッド

        /\
       /  \
      / E2E \      ← 少ない・遅い・現実に近い（Playwright）
     /--------\
    /          \
   / Component  \  ← 中程度（React Testing Library）
  /--------------\
 /                \
/   Unit Tests     \   ← 多い・速い・隔離された（Vitest）
--------------------
```

- **ユニットテスト**: 純粋関数を Node.js で高速テスト。ブラウザ不要。
- **コンポーネントテスト**: jsdom 上で React をレンダリング。API 呼び出しはモック。
- **E2E テスト**: 本物のブラウザ + 本物のサーバー。最も現実に近いが遅い。

### Playwright の自動待機 (Auto-waiting)

通常の DOM 操作ではタイミング問題が起きやすい:

```typescript
// 危険: 要素がまだ表示されていない可能性
document.getElementById("dialog")?.textContent

// 安全: 表示されるまで最大 5 秒リトライ
await expect(page.getByText("出勤しますか？")).toBeVisible()
```

Playwright の `expect(...).toBeVisible()` は条件が満たされるまで自動でリトライする。
Radix UI の Dialog のようにアニメーションで表示される要素でも確実に検出できる。

### getByRole とアクセシビリティ

`page.getByRole("button", { name: "出勤する" })` は HTML の `role` 属性と
アクセシブルネームで要素を特定する。

```html
<!-- このボタンを getByRole("button", { name: "🟢 出勤する" }) で取得できる -->
<button>🟢 出勤する</button>
```

テキストや CSS クラスではなく「意味（ロール）」で要素を取得するため、
デザイン変更（クラス変更など）があってもテストが壊れにくい。
