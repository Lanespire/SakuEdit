# Remotion / Mediabunny / npm package 破壊的置換計画

1. 置換を2レイヤーに分けて進めます。
- Layer A: media pipeline / render / captions / ASR を Remotion ecosystem + Mediabunny に寄せる
- Layer B: editor / timeline / undo-redo / waveform UI を既存 npm package または starter 実装ベースへ寄せる
- これは「リファクタ」ではなく、実質的に一部再実装です。

2. Layer A は今回の主実装対象にします。
- `lib/video-processor.ts` の `processVideo()` を FFmpeg の destructive cut + drawtext から外し、`renderWithRemotion()` と `VideoComposition` を主経路にします。
- `app/api/process/route.ts` もそれに合わせ、無音検出結果から `playbackSegments` を作って Remotion render に渡す構成へ変更します。
- `lib/ai.ts` / `remotion-captions-adapter.ts` に字幕責務を寄せ、SRT生成の重複を消します。
- `getVideoDuration()` / `getVideoMetadata()` はすでに `Mediabunny first` なので維持します。
- `thumbnail` / `waveform` は adapter が stub なので、今回のコードでは fallback を維持しつつ、呼び出し責務を整理します。

3. Layer B は「置換できるもの」と「置換しにくいもの」を分けて進めます。
- `@remotion/player` はすでに採用済みなので維持します。
- waveform 表示はすでに `wavesurfer.js` ベースなので、ここは package 化済みとみなします。
- undo / redo は `zustand` 手書き実装から `zundo` などの middleware へ寄せる余地があります。
- ただし timeline / subtitle block editing / marker overlay / cut segment mapping は Remotion / Mediabunny の責務外で、drop-in package 置換は困難です。
- ここを本当に置き換えるなら、単一パッケージ導入ではなく、外部 timeline editor ライブラリか editor starter 実装をベースに組み直す必要があります。

4. `Remotion Editor Starter` は参考実装として寄せますが、drop-in npm package としては扱いません。
- つまり「部品差し替え」ではなく、「レイアウトと編集モデルを借りて自前アプリへ移植する」前提で考えます。
- timeline / transport / inspector 構成は近づけられますが、現在の DB / state / API へ合わせるには統合作業が必要です。

5. 今回の実装フェーズは以下です。
- Phase 1: `processVideo()` と `app/api/process/route.ts` を Remotion render 主体に置換
- Phase 2: 字幕/SRT処理の一本化
- Phase 3: editor state の undo/redo を middleware ベースへ寄せる余地を評価
- Phase 4: timeline UI の package/starter 置換可否を別タスクで進める

6. 検証は変更箇所に絞ります。
- `npx eslint` で touched files を確認
- `process` と `export` の整合性を確認
- フル lint は既存生成物エラーのため成否判定に使わない

7. 破壊的変更として明示しておく点です。
- `processVideo()` の出力仕様が変わる可能性があります
- preview / export / processed output の見た目を `VideoComposition` 基準へ寄せます
- timeline UI の完全 package 置換は今回すぐには終わらない可能性があります

## 実施結果

### Phase 1 完了
- `lib/video-processor.ts` の `processVideo()` は FFmpeg の destructive cut + drawtext 経路をやめ、`renderWithRemotion()` + `VideoComposition` を主経路に変更しました。
- Remotion render がローカル動画を直接読めないため、一時 HTTP server を内部で立てて project source を配信する形にしました。
- `app/api/process/route.ts` は cut aggressiveness から dB threshold を解決し、無音検出結果を `{start,end}` で保存するよう修正しました。
- `app/api/export/route.ts` は `AISuggestion.SILENCE_CUT.isApplied` と保存済み silence regions から `playbackSegments` を組み立て、preview/process/export の cut 振る舞いを一致させました。

### Phase 2 完了
- SRT 生成は `lib/remotion-captions-adapter.ts` の `serializeSegmentsToSrt()` に一本化しました。
- `lib/ai.ts` の subtitle segment 型は `TimedTextSegment` を共有し、ASR -> subtitle shaping -> SRT の経路で同じ shape を使うようにしました。

### Phase 3 完了
- `lib/stores/editor-ui-store.ts` の undo/redo 対象更新は `setWithHistory()` に集約し、stack bookkeeping の重複を削除しました。
- 今回は `pushToHistory=false` を使う callsite が多いため、`zundo` への即時全面移行よりも、既存の制御粒度を保った middleware 風の抽象化を優先しました。

### Phase 4 完了
- timeline UI は現状 `EditorTimeline` / `AudioWaveformTrack` / `VideoPlayer` / `lib/editor.ts` の source-time <-> timeline-time mapping に強く依存しています。
- 特に package/starter へ drop-in 置換しづらい統合点は次の4つです。
  - silence overlay と `playbackSegments` ベースの cut preview
  - subtitle block editing と modal/edit API の接続
  - marker/highlight overlay と AI suggestion 反映
  - waveform 表示と source video preview URL の同期
- そのため、Phase 4 の結論は「今は drop-in package 置換不可、外部 starter を採るなら layout shell から段階移植」です。
