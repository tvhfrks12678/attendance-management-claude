# Claude Code 用 実装指示書 — 出勤管理アプリ

## 前提
- このファイルと attendance-spec.md を両方読んでから作業を開始すること
- attendance-spec.md にディレクトリ構造、API仕様、データ、UI仕様が記載されている
- フェーズごとに検証を行い、全ステップ成功するまで次に進まないこと

---

## 技術スタック
- TanStack Start（フルスタック）
- React 19 + TypeScript
- shadcn/ui + Tailwind CSS v4
- zustand（クライアント状態管理）
- @tanstack/react-query（サーバーデータ取得）
- zod（バリデーション）
- 将来のDB: Turso (libSQL) + Drizzle ORM

---

## 重要な設計ルール（必ず守ること）

1. **UIは createServerFn を直接呼ばない。TanStack Query で `/api/attendance/*` を fetch するだけ**
2. **domain/ と application/ はフレームワーク非依存**（React, TanStack Start のインポート禁止）
3. **contracts/attendance.ts が API の型の唯一の真実**（zod schema から型を導出）
4. **時刻の扱い**: サーバー側で現在時刻を取得する（クライアントの時刻を信用しない）
5. **打刻の整合性**: 出勤していないのに退勤はできない等のバリデーションは domain で行う
6. **infrastructure/repositories/ の実装を差し替えるだけで Turso に移行できること**

---

## フェーズ1: プロジェクト初期化 + 最小構成で動かす

### やること
1. TanStack Start プロジェクトを作成
2. shadcn/ui をセットアップ（button, card, badge, table, dialog, separator を追加）
3. 以下のファイルを作成:
   - `src/features/attendance/contracts/attendance.ts`（zod schema + 型定義）
   - `src/features/attendance/domain/entities/attendance.ts`（内部データ型）
   - `src/features/attendance/domain/ports/attendanceRepository.ts`（interface）
   - `src/features/attendance/domain/ports/clock.ts`（interface: 現在時刻の抽象化）
   - `src/features/attendance/infrastructure/data/attendanceData.ts`（ベタ書きデータ）
   - `src/features/attendance/infrastructure/repositories/inMemoryAttendanceRepository.ts`
   - `src/features/attendance/infrastructure/clock/systemClock.ts`
   - `src/features/attendance/infrastructure/getRepository.ts`
   - `src/features/attendance/infrastructure/getClock.ts`
   - `src/features/attendance/application/services/attendanceService.ts`（フレームワーク非依存）
4. Server Routes を作成:
   - `app/routes/api/attendance/today.ts`（GET: 今日の勤怠状態を取得）
   - `app/routes/api/attendance/clock-in.ts`（POST: 出勤打刻）
   - `app/routes/api/attendance/clock-out.ts`（POST: 退勤打刻）
   - `app/routes/api/attendance/history.ts`（GET: 過去の勤怠履歴）
5. 最低限の AttendancePage.tsx を作成（打刻ボタンとステータスが表示されるだけでOK）
6. `app/routes/index.tsx` から AttendancePage をインポート

### フェーズ1 の検証（必ず全て実行すること）
```bash
pnpm install
npx tsc --noEmit          # 型エラー 0件
pnpm build                # ビルド成功
pnpm dev &                # バックグラウンドで起動
sleep 5                   # サーバー起動を待つ
curl -s http://localhost:3000/ | head -20           # HTMLが返る
curl -s http://localhost:3000/api/attendance/today   # JSON（今日の勤怠状態）が返る
curl -s -X POST http://localhost:3000/api/attendance/clock-in  # JSON（出勤打刻結果）が返る
curl -s http://localhost:3000/api/attendance/today   # ステータスが「勤務中」に変わっている
curl -s -X POST http://localhost:3000/api/attendance/clock-out # JSON（退勤打刻結果）が返る
curl -s http://localhost:3000/api/attendance/history  # JSON（履歴一覧）が返る
kill %1                   # devサーバー停止
```

**検証結果を報告すること。エラーがあれば修正して再検証。全て成功するまで完了としない。**

---

## フェーズ2: ドメインロジック + テスト

### やること
1. `src/features/attendance/domain/logic/attendance.ts` を実装
   - `canClockIn(today: AttendanceDay): boolean`（出勤可能か判定）
   - `canClockOut(today: AttendanceDay): boolean`（退勤可能か判定）
   - `getStatus(today: AttendanceDay): AttendanceStatus`（現在のステータスを導出）
2. `src/features/attendance/domain/logic/worktime.ts` を実装
   - `calculateWorkDuration(clockIn: Date, clockOut: Date): WorkDuration`（勤務時間を計算）
   - `formatDuration(minutes: number): string`（「8時間30分」形式にフォーマット）
3. テストを書く（vitest を導入）
   - `canClockIn` のテスト: 未出勤→true、勤務中→false、退勤済み→false
   - `canClockOut` のテスト: 未出勤→false、勤務中→true、退勤済み→false
   - `getStatus` のテスト: 各状態を正しく返すか
   - `calculateWorkDuration` のテスト: 正常系、日跨ぎ
   - `formatDuration` のテスト: 0分、60分、90分、480分

### フェーズ2 の検証
```bash
pnpm add -D vitest
# package.json の scripts に "test": "vitest run" を追加
pnpm test                 # 全テスト通る
npx tsc --noEmit          # 型エラー 0件
```

---

## フェーズ3: UI 作り込み

### やること
1. zustand store を作成: `src/features/attendance/presentation/hooks/useAttendance.ts`
   - 状態: todayRecord, history[], isLoading, error
   - アクション: clockIn, clockOut, refreshToday, fetchHistory
2. TanStack Query で /api を叩く hooks を useAttendance.ts 内に実装
3. UIコンポーネントを実装（shadcn/ui を使用）:
   - `StatusCard.tsx`: 現在のステータス（未出勤/勤務中/退勤済み）+ 出退勤時刻
   - `ClockButton.tsx`: 出勤/退勤ボタン（ステータスに応じて切り替え）
   - `WorkSummary.tsx`: 今日の勤務時間サマリー
   - `HistoryTable.tsx`: 過去の勤怠履歴テーブル
   - `CurrentTime.tsx`: 現在時刻のリアルタイム表示
4. `AttendancePage.tsx` で全コンポーネントを組み立て

### UIの注意点
- 現在時刻をリアルタイムで画面上部に表示する（1秒ごとに更新）
- 出勤ボタン: 未出勤時のみ押せる。押すと「勤務中」に変わる
- 退勤ボタン: 勤務中のみ押せる。押すと「退勤済み」に変わる
- 退勤済み: 両ボタン無効化。勤務時間を表示
- 履歴テーブル: 日付、出勤時刻、退勤時刻、勤務時間を表示
- 打刻時に確認ダイアログを表示（「出勤しますか？」「退勤しますか？」）

### フェーズ3 の検証
```bash
npx tsc --noEmit          # 型エラー 0件
pnpm build                # ビルド成功
pnpm dev &
sleep 5
curl -s http://localhost:3000/ | head -50   # 出勤管理ページのHTMLが返る
kill %1
```

**加えて、以下の手動確認ポイントを報告すること:**
- / にアクセスしてステータスと打刻ボタンが表示されるか
- 出勤ボタンを押して「勤務中」に変わるか
- 退勤ボタンを押して「退勤済み」に変わり勤務時間が表示されるか
- 履歴テーブルに過去の記録が表示されるか
- 退勤後は両ボタンが無効化されるか

---

## フェーズ4: スタイリング仕上げ

### やること
1. レスポンシブ対応（モバイルファースト）
2. ステータスごとのビジュアルフィードバック
   - 未出勤: グレー背景
   - 勤務中: 緑色の背景 + パルスアニメーション
   - 退勤済み: 青色の背景 + チェックアイコン
3. 打刻ボタンの視覚的な区別
   - 出勤: 緑系の大きなボタン
   - 退勤: 赤系の大きなボタン
4. 履歴テーブルのスタイリング（ストライプ、ホバー効果）
5. 全体的な見た目の調整（余白、フォントサイズ、カード影）
6. ダークモード対応

### フェーズ4 の検証
```bash
npx tsc --noEmit
pnpm build
pnpm test
```

---

## 全フェーズ共通のルール

### エラー対応
- エラーが出たら原因を特定して修正し、そのフェーズの検証を最初からやり直すこと
- 「動きました」ではなく、各コマンドの実行結果（成功/失敗 + エラー内容）を報告すること
- 全ステップが通るまで完了とみなさないこと

### コード品質
- any の使用禁止（型を明示すること）
- console.log でのデバッグを残さないこと
- 未使用の import を残さないこと

### ファイルの命名規則
- コンポーネント: PascalCase（StatusCard.tsx）
- hooks/関数: camelCase（useAttendance.ts, attendanceService.ts）
- 型/interface: PascalCase（AttendanceDay, AttendanceRepository）
- ディレクトリ: kebab-case

### Turso 移行を意識した設計
- repository の interface は domain/ports/ に定義
- infrastructure/repositories/ に実装を置く
- getRepository.ts で実装を切り替える（今は inMemory、後で drizzle に差し替え）
- clock の interface も domain/ports/ に定義し、テスト時にモック可能にする
- application/services/ は repository interface にのみ依存すること

---

## 最終確認チェックリスト

完了時に以下の全てが満たされていることを確認して報告すること:

- [ ] `pnpm install` がエラーなく完了する
- [ ] `npx tsc --noEmit` が型エラー 0件
- [ ] `pnpm build` が成功する
- [ ] `pnpm test` が全テスト通る
- [ ] `pnpm dev` で開発サーバーが起動する
- [ ] GET /api/attendance/today が今日の勤怠状態を返す
- [ ] POST /api/attendance/clock-in が出勤打刻結果を返す
- [ ] POST /api/attendance/clock-out が退勤打刻結果を返す
- [ ] GET /api/attendance/history が履歴一覧を返す
- [ ] / ページでステータスと打刻ボタンが表示される
- [ ] 出勤 → 退勤のフローが正しく動作する
- [ ] 退勤後にボタンが無効化される
- [ ] domain/ と application/ に React や TanStack Start のインポートがない
- [ ] contracts/attendance.ts に zod schema が定義されている
- [ ] infrastructure/repositories/ の実装を差し替えるだけで DB 移行が可能な設計になっている
