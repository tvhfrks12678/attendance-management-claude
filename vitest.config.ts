import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	test: {
		// test.projects でテストの種類ごとに環境を分ける（Vitest 3 推奨の書き方）
		projects: [
			{
				// Node.js 環境: ドメインロジック等の純粋関数テスト (.ts)
				plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
				test: {
					name: "node",
					include: ["src/**/*.test.ts"],
					environment: "node",
				},
			},
			{
				// jsdom 環境: React コンポーネントテスト (.tsx)
				plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
				test: {
					name: "jsdom",
					include: ["src/**/*.test.tsx"],
					environment: "jsdom",
				},
			},
		],
	},
})
