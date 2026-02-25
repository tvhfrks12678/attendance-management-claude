import { create } from "zustand"

// ビュー表示モードの型定義
// "simple"  = シンプルビュー（テーブル形式）
// "modern"  = モダンビュー（カレンダー形式）
type ViewMode = "simple" | "modern"

// A/B テスト用のランダム初期値
// 訪問ごとにどちらのビューが使いやすいかを検証できる
function getInitialViewMode(): ViewMode {
	return Math.random() < 0.5 ? "simple" : "modern"
}

interface ViewModeState {
	viewMode: ViewMode
	toggleViewMode: () => void
}

export const useViewModeStore = create<ViewModeState>((set) => ({
	viewMode: getInitialViewMode(),
	toggleViewMode: () =>
		set((state) => ({
			viewMode: state.viewMode === "simple" ? "modern" : "simple",
		})),
}))
