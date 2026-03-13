# SakuEdit AGENTS

## 目的
- このリポジトリのゴールは、`localhost:3000` 上で「ユーザー登録 -> プロジェクト作成 -> 動画アップロード or YouTube URL 取り込み -> スタイル分析 -> 字幕生成 -> 無音カット -> 編集画面確認 -> mp4 書き出し/ダウンロード」までを、課金を除いて一通り完結できる状態に保つこと。
- UI モックではなく、ローカルで実処理が走り、データが保存され、再訪時に状態が復元されることを優先する。

## Source Of Truth
- 画面仕様: `docs/spec.md`
- 技術方針: `docs/tech-stack.md`
- 個別機能仕様: `docs/*.md`
- 既知障害と再発防止: `docs/bug-report-*.md`
- 特定領域の手順や判断基準: `.agents/skills/*/SKILL.md`

## 維持する前提
- Next.js 16 / React 19 / App Router
- Tailwind CSS 4
- Prisma + SQLite
- Better Auth
- FFmpeg / FFprobe
- Remotion
- AI 利用は `.env` の `OPENROUTER_API_KEY` を前提にしてよい
- ASR は Remotion whisper-cpp を優先し、必要時のみローカル `whisper` CLI にフォールバックしてよい

## 実装の基本ルール
- クリティカルパスに mock、dummy、placeholder、TODO を残さない。
- UI だけ直して API、DB、ファイル保存、権限制御を放置しない。
- 無関係なリファクタを混ぜない。まず end-to-end を通す。
- background job は後回しでよいが、最初から同期処理でもローカル完動を優先する。
- 同期処理でも `Project.status`、`progress`、`progressMessage`、`lastError` は更新する。
- 変更した領域に対応する `docs/` と `.agents/skills/` を確認してから実装する。
- 新しい仕様や再発防止ルールを見つけたら、コードだけでなく関連ドキュメントも更新する。

## 実装時の必須整合
- 動画の保存場所と DB 上の `storagePath` は upload、analyze、process、download の全経路で一致させる。
- 参考動画 URL と編集対象の動画 URL を混同しない。
- スタイル分析は URL 文字列ではなく、動画本体、transcript、metadata を元に行う。
- ASR は実際の音声データを使う。擬似実装を完了扱いにしない。
- 無音カットは検出だけで終わらせず、実際の出力動画に反映する。
- 料金変更は UI だけでなく、Prisma schema、seed、server-side quota、feature gate を同時に更新する。

## 壊れやすいポイント
- `upload` と `process` が別のファイル配置を前提にしやすい。
- `process` の成功レスポンスだけ実装され、`download` ルートが欠けやすい。
- `analyzeStyle()` に URL 文字列だけを渡す仮実装が入りやすい。
- `transcribeAudio()` が placeholder のまま残りやすい。
- Home 画面の `youtubeUrl` フローが project 作成だけで止まりやすい。
- 料金ページだけ更新され、プラン制御が古いまま残りやすい。

## 完了条件
- `npm run build` が成功する。
- Prisma migration と初期データ投入がローカルで再現できる。
- ユーザー登録とログインが成功する。
- ローカル動画ファイルからプロジェクト作成と処理完了まで到達できる。
- YouTube URL からの取り込みでもプロジェクト作成と処理完了まで到達できる。
- 字幕、スタイル分析、無音カット、書き出しが実処理で動く。
- 編集画面が DB 上の `project`、`video`、`subtitle`、`style` を読み込んで表示できる。
- mp4 と必要なら SRT をダウンロードできる。
- 主要フローの E2E、または再現性の高い手動検証手順がある。

## 禁止事項
- モックデータのまま「動いた」としない。
- route のレスポンスだけ作って実ファイルを生成しない。
- URL 文字列を分析して「動画分析」と呼ばない。
- ASR placeholder を残したまま完了扱いしない。
- upload と process で別のファイル配置を使わない。
- 料金の source of truth を UI のみで持たない。
