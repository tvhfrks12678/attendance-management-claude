# Effect.ts 導入ログ

このディレクトリは Effect.ts（関数型プログラミングライブラリ）を
このプロジェクトに段階的に導入した記録です。

各ドキュメントは以下の構成になっています:

- **Before**: 変更前のコードとその問題点
- **After**: Effect.ts を使った後のコードと一行ごとの説明
- **Why**: なぜこの変更をしたか（型安全性・エラーの明示化・合成しやすさ）
- **概念メモ**: 登場する Effect.ts の概念を自分の言葉で説明

---

## 変更一覧

| ドキュメント | 対象ファイル | 導入した概念 |
|-------------|-------------|-------------|
| [01-option-pipe.md](./01-option-pipe.md) | `worktime.ts` | `Option`（値あり/なしの型表現）、`pipe`（左→右の関数合成） |
| [02-effect-typed-errors.md](./02-effect-typed-errors.md) | `attendanceService.ts` | `Effect`（非同期 + 型付きエラー）、`Effect.flatMap`、`Effect.match`、`Effect.runPromise` |

---

## 変更の全体像

```
worktime.ts
  calculateWorkDuration: WorkDuration → Option<WorkDuration>   ← Option 導入
  formatDuration: if/let → pipe(...)                           ← pipe 導入

attendanceService.ts
  clockOut: grossDuration.totalMinutes → pipe(Option.map, Option.getOrElse)  ← Option 活用
  clockIn: async/await → clockInEffect() + Effect.match + Effect.runPromise  ← Effect 導入
```

---

## 学習の順番

1. まず `01-option-pipe.md` を読む → `Option` と `pipe` の基本を理解する
2. 実際のコード `worktime.ts` を読んでコメントを確認する
3. `02-effect-typed-errors.md` を読む → `Effect` の型安全なエラーハンドリングを理解する
4. `attendanceService.ts` の `clockInEffect` と `clockIn` を読む
