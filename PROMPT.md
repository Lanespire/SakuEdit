# SakuEdit ローカル完動化 指示書

## 目的
このリポジトリを、`localhost:3000` 上で「ユーザー登録 -> プロジェクト作成 -> 動画アップロード or YouTube URL取り込み -> スタイル分析 -> 字幕生成 -> 無音カット -> 編集画面確認 -> mp4書き出し/ダウンロード」まで、課金を除いて一通り完結できる状態にすること。

単なる UI モック完成ではなく、ローカル環境で実際に処理が走り、データが保存され、再訪時にも状態が復元されることをゴールとする。

---

## `/spawn-team` 前提の実行ルール
この指示書を使う Claude は、作業開始時にできるだけ早く `/spawn-team` を使い、単独で長時間実装を進めないこと。目的は「探索・実装・検証」を並列化して最短でローカル完動に到達すること。

### 最初の一手
以下の方針で `/spawn-team` を使うこと。

1. 最初に現状確認を 5-10 分で終える
2. その時点で未実装点を整理し、すぐ `/spawn-team` で並列着手する
3. 1 人で全部読むより、担当を分けて先に詰める
4. クリティカルパスを止める要素から先に潰す

### 推奨チーム構成
最低 4 名、可能なら 5 名で並列化する。

#### 1. backend-owner
責務:
- Prisma schema / migration / seed
- auth / subscription / usage log
- `app/api/projects/route.ts`
- `app/api/upload/route.ts`
- `app/api/process/route.ts`
- `app/api/download/[projectId]/route.ts`

#### 2. media-pipeline-owner
責務:
- `lib/video-processor.ts`
- ffmpeg / ffprobe / yt-dlp を使う取り込み・変換・書き出し
- 無音カット
- サムネイル生成
- mp4 / srt 出力

#### 3. ai-owner
責務:
- `lib/ai.ts`
- 実 ASR
- スタイル分析
- subtitle 生成
- analysis 結果の DB 保存

#### 4. frontend-owner
責務:
- `app/home/page.tsx`
- `app/styles/page.tsx`
- `app/processing/[id]/page.tsx`
- `app/edit/[id]/page.tsx`
- `app/projects/page.tsx`
- API 接続の最終統合

#### 5. qa-owner
責務:
- 手動確認フローの整備
- Playwright
- AgentBrowser での実動作確認
- build / lint / e2e の失敗原因切り分け

### 実行順
#### Wave 1: 探索と設計固定
- backend-owner: upload/process/download の破綻点を確定
- media-pipeline-owner: ffmpeg/yt-dlp/remotion の実装方針を確定
- ai-owner: 実 ASR と style analysis の接続先を確定
- frontend-owner: 現在の画面フローと API 断点を確定
- qa-owner: 完動判定シナリオを先に固定

#### Wave 2: クリティカルパス実装
- backend-owner と media-pipeline-owner で upload -> process -> download を通す
- ai-owner で transcript -> subtitle -> style を通す
- frontend-owner で Home -> Styles -> Processing -> Edit を通す
- qa-owner で都度 localhost 実機確認

#### Wave 3: 制限・品質・検証
- pricing/plan/usage enforcement
- E2E
- build 安定化
- 最終レビュー

### 競合回避ルール
- 同じファイルを複数人で触らない
- 役割ごとに ownership を固定する
- 共有インターフェースだけ先に決める
  - projectId
  - storagePath
  - analysis result shape
  - subtitle shape
  - export result shape
- mock で先に進める場合でも、クリティカルパスでは最終的に必ず実処理へ差し替える

### 高速化ルール
- 美しさより、まず end-to-end を通す
- background job は後回しでよい。まず同期処理で完動させる
- 無関係なリファクタをしない
- 料金表示変更だけで終わらせず、plan seed と quota enforcement まで同時に揃える
- 各 wave の終わりで必ず `npm run build` と主要動作確認を回す

---

## この指示書の前提

### 維持する技術スタック
- Next.js 16 / React 19 / App Router
- Tailwind CSS 4
- Prisma + SQLite
- Better Auth
- FFmpeg / FFprobe
- Remotion
- AI 利用は `.env` の `OPENROUTER_API_KEY`, `DEEPGRAM_API_KEY` を前提にしてよい

### ローカル完動の定義
以下をすべて満たして初めて「完了」とみなす。

1. `npm run build` が成功する
2. Prisma マイグレーションと初期データ投入がローカルで再現できる
3. ユーザー登録/ログインが成功する
4. ローカル動画ファイルからプロジェクトを作成し、処理完了まで到達できる
5. YouTube URL からの取り込みでもプロジェクトを作成し、処理完了まで到達できる
6. 字幕・スタイル分析・無音カット・書き出しが実処理で動く
7. 編集画面が DB 上の project / video / subtitle / style を読み込んで表示できる
8. mp4 と必要なら SRT をダウンロードできる
9. 主要フローの E2E か少なくとも再現性の高い手動検証手順がある
10. クリティカルパスにモック、ダミー、placeholder、TODO が残らない

---

## 現状の問題点
このセクションは実装開始前に必ず読むこと。現在のコードベースは「画面は多いが、処理系は未接続」が多い。

### 1. アップロードと処理の接続が壊れている
- `app/api/upload/route.ts` はアップロードファイルを `uploads/videos/{userId}/...` に保存して DB に `storagePath` を書く
- `app/api/process/route.ts` は DB を見ずに `uploads/{projectId}/input.mp4` を前提にしている
- このままでは upload と process が同じファイルを見ない

### 2. ダウンロード API が存在しない
- `app/api/process/route.ts` は成功時に `/api/download/${projectId}` を返す
- しかし `app/api` 配下に download route がない

### 3. ASR が仮実装
- `lib/ai.ts` の `transcribeAudio()` は「本物の音声認識」ではない
- base64 の先頭 100 文字だけを chat completion に渡す placeholder であり、実際の字幕生成基盤にならない

### 4. スタイル分析が実動画を見ていない
- `app/api/analyze/route.ts` は `referenceUrl` をそのまま `analyzeStyle(referenceUrl)` に渡している
- これは動画の内容や transcript ではなく、URL 文字列を分析しているだけ

### 5. 無音カットが未完成
- `lib/video-processor.ts` は silence を検出するが、実際の cut filter は未実装
- コメントにも「今回は基本処理のみ」とある

### 6. ホーム画面の URL フローが未接続
- `app/home/page.tsx` では `youtubeUrl` が入っても、実際には URL ソースの upload/download 処理に進んでいない
- project 作成後に `/styles` へ飛ぶだけで、元動画の確保が完了しない

### 7. 料金設計を UI だけ変えても、サーバー側の使用量制御が存在しない
- Prisma schema には `Plan` / `Subscription` / `UsageLog` はある
- ただし料金ページと一致する seed / quota enforcement / feature gate が見当たらない

---

## 料金・プランの最新方針
ローカル完動化と合わせて、料金 UI とサーバー側の制御ロジックもこの方針にそろえること。

### Source of truth
料金ページだけでなく、Prisma の plan data / seed / quota check / feature gating も同じ値に合わせる。

### 新プラン
#### Free
- `¥0 / 月`
- 月 90 分まで処理
- 1 本あたり最大 10 分
- 720p
- ウォーターマークあり
- プリセットスタイル 3 種
- 字幕生成 / 無音カットあり
- スタイル学習なし
- SRT なし
- サムネイルなし

#### Pro
- `¥2,480 / 月`
- 月 600 分まで処理
- 1 本あたり最大 30 分
- 1080p
- ウォーターマークなし
- スタイル保存 20 件
- スタイル学習 月 10 回
- SRT あり
- サムネイル生成あり
- 優先処理あり

#### Business
- `¥8,980 / 月`
- 月 2,400 分まで処理
- 1 本あたり最大 90 分
- 1080p
- ウォーターマークなし
- スタイル保存 100 件
- スタイル学習 月 50 回
- SRT / サムネイルあり
- 優先キューあり
- チーム共有 3 席まで

#### Enterprise
- `要相談`
- 固定の「無制限」をデフォルトで売らない
- 4K / SLA / 専用キュー / 請求書払い / 超過従量は個別設計

### 必要なスキーマ調整
現在の `Plan.maxVideoMinutes` は「1 本の最大分数」に見える。以下のように役割を分けること。
- `maxSingleVideoMinutes`
- `monthlyProcessingMinutes`
- `monthlyStyleAnalysisCount`
- `styleSlots`
- `maxQuality`
- `hasWatermark`
- `hasSrtExport`
- `hasThumbnail`
- `hasPriorityQueue`
- `teamSeats`

必要なら migration を追加し、seed も更新すること。

---

## 実装方針

### 最優先ポリシー
- クリティカルパスにモック禁止
- 「あとで background job をつなぐ」は禁止
- ローカルで確実に動くなら、まず同期処理でもよい
- ただし DB 上の status/progress 更新は残すこと
- UI の文言よりも、実処理のつながりを優先すること

### 動画/音声パイプラインの推奨構成
ローカル完動を優先し、以下の構成を第一候補にする。

1. 入力の統一
   - すべて `uploads/projects/{projectId}/` に保存する
   - `input.mp4`, `source-audio.wav`, `thumbnail.jpg`, `output.mp4`, `subtitles.srt`, `analysis.json` などを明示的に分ける

2. ローカルファイル upload
   - `app/api/upload/route.ts` で保存
   - DB の `Video.storagePath` に保存先を入れる
   - duration, size, mimeType, thumbnail を埋める

3. YouTube URL 取り込み
   - `yt-dlp` を使ってローカルに mp4 を保存
   - 動画 metadata を DB に保存
   - `yt-dlp` が必要ならインストール手順を README/PROMPT に書く

4. 音声抽出
   - FFmpeg で wav へ抽出

5. 実 ASR
   - 本物の音声データを使う
   - ZAI の audio endpoint が使えるならそれを使う
   - 使えないなら OpenRouter 経由の ASR か、ローカルで導入可能な whisper 系 CLI を使う
   - いずれにせよ placeholder 実装は削除

6. スタイル分析
   - 参考動画 URL しかない場合は、まず transcript / metadata / title / description を抽出してから分析する
   - `analyzeStyle()` に URL 文字列だけを渡さない

7. 字幕生成
   - transcript から DB の `Subtitle` を作成
   - export 時に SRT も出せるようにする

8. 無音カット
   - detect だけでなく、実際に cut した出力を作る
   - 最初は「カット区間の算出 -> trim/concat」でもよい

9. 書き出し
   - `output.mp4` を生成
   - `/api/download/[projectId]` などの download route を実装する

10. 編集画面
   - projectId ベースで video / subtitles / style / timeline を取得できるようにする
   - ダミーデータを残さない

### 非同期実行について
ローカル完動が先なので、最初は route handler 内の同期処理でもよい。
ただし以下は守ること。
- Project.status を `UPLOADING -> ANALYZING -> PROCESSING -> COMPLETED/ERROR` で更新
- progress と progressMessage を更新
- 失敗時は `lastError` を残す

---

## 実装タスク順

### Task 1: ローカル開発環境の再現手順を固める
- `.env.example` がないなら用意
- 必要な env を明記
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_BETTER_AUTH_URL`
- `OPENROUTER_API_KEY`
- `DEEPGRAM_API_KEY`
- `DEEPGRAM_MODEL`
- `UPLOAD_DIR`
- 必須バイナリを明記
  - `ffmpeg`
  - `ffprobe`
  - `yt-dlp`（YouTube URL 対応するなら必須）

### Task 2: Prisma / seed / auth をローカルで確実に動かす
- migration を整理
- plan seed を新料金設計で投入
- Free プランの初期付与方針を決める
- signup / signin / session 維持を確認

### Task 3: upload と process のファイル設計を統一
- `storagePath` を source of truth にするか、`uploads/projects/{projectId}` を source of truth にするか決める
- どちらかに統一し、全 API が同じ前提で動くようにする

### Task 4: ローカルファイルからのフローを end-to-end で通す
- Home 画面からファイル upload
- project 作成
- metadata 抽出
- ASR
- subtitle 保存
- style 適用
- process
- export
- download

### Task 5: YouTube URL フローを通す
- Home 画面の `youtubeUrl` を実際の download 処理へ接続
- 参考動画 URL と、編集対象の URL を混同しない
- `referenceUrl` は style 学習用、`youtubeUrl` は入力ソース用として整理

### Task 6: スタイル分析を本物にする
- 参考動画の transcript / metadata を使う
- URL 文字列だけを渡す実装を削除
- style 結果を DB の `Style` と `AnalysisJob` に保存

### Task 7: 無音カットと字幕バーンインを完成させる
- detect だけで終わらせない
- timeline と字幕データに基づいて出力 mp4 を生成
- 少なくとも 720p / 1080p で動かす

### Task 8: download / export を完成させる
- `/api/download/[projectId]` 実装
- mp4, SRT, thumbnail を返せるようにする
- ExportJob を DB に保存する

### Task 9: 料金プランの利用制限をサーバーで強制する
- `UsageLog` を実際に書く
- 月間処理分数を加算する
- Free / Pro / Business の超過時は API で弾く
- UI も plan の制限に従って出し分ける

### Task 10: テスト
- 最低限の Playwright を追加/修正
- signup
- file upload
- style select
- processing 完了
- export / download

---

## 明示的に直すべきファイル候補
- `app/home/page.tsx`
- `app/styles/page.tsx`
- `app/edit/[id]/page.tsx`
- `app/processing/[id]/page.tsx`
- `app/api/projects/route.ts`
- `app/api/upload/route.ts`
- `app/api/analyze/route.ts`
- `app/api/process/route.ts`
- `app/api/download/[projectId]/route.ts` を新規作成
- `lib/ai.ts`
- `lib/video-processor.ts`
- `lib/auth.ts`
- `prisma/schema.prisma`
- seed スクリプトがなければ追加

---

## 完了条件

### 技術的完了条件
- `npm install` 後にセットアップ手順だけで起動できる
- `npx prisma migrate dev` が通る
- `npm run build` が通る
- ローカルでサインアップ/サインイン可能
- file upload フローが完了する
- YouTube URL フローが完了する
- 編集画面が DB データを読み込む
- export 後に mp4 をダウンロードできる
- critical path に placeholder / TODO / fake API call がない

### 体験的完了条件
以下の手動シナリオを全通過すること。

1. 新規登録
2. ログイン
3. ローカル mp4 をアップロード
4. 参考 YouTube URL を入力
5. スタイル選択
6. 処理完了待ち
7. 編集画面で字幕確認
8. mp4 書き出し
9. mp4 ダウンロード
10. `/projects` に履歴が残る

さらに別シナリオとして、

1. YouTube URL を入力して素材動画として取り込む
2. 同様に処理/書き出しまで完了する

---

## 禁止事項
- モックデータのまま「動いた」としない
- route のレスポンスだけ作ってファイルを生成しない
- URL 文字列を分析して「動画分析」と呼ばない
- ASR placeholder を残したまま完了扱いしない
- upload と process で別のファイル配置を使わない
- 「無制限」固定額をローカル seed に入れない

---

## 最終出力
すべて完了したら、以下を必ずまとめて提示すること。

1. 変更したファイル一覧
2. ローカルセットアップ手順
3. 必須 env 一覧
4. 手動確認手順
5. 残課題があればその理由

すべての完了条件を満たした場合のみ、最後に `<promise>PROJECT COMPLETE</promise>` を出力すること。
