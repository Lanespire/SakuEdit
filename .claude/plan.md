# SST dev 完全動作 / 冪等 / 無料構成計画

## 目的
`npx sst dev --stage dev` を唯一の開発実行形態として成立させます。  
ローカルの Next プロセスだけで重処理が完結する状態をやめ、少なくとも「処理開始の起点」「処理状態の source of truth」「成果物保存」は SST 配下の AWS リソースと Turso に揃えます。

今回の到達目標は次です。
- `sst dev` 起動後にログイン、アップロード、処理開始、処理進捗表示、編集画面表示、ダウンロードまで一貫して動く
- 同じ project に対する二重起動やリロードで壊れない
- 無料構成を優先し、追加の有料 managed worker は増やさない

## 前提整理
### いま合っていない点
1. processing の本体が `app/api/process/start/route.ts` の `after()` から `runProjectProcessing()` を直接呼んでおり、SST の `VideoProcessor` を使っていない
2. `infra/video-processor/handler.ts` は現行 pipeline の代替になっていない
- `transcribe` action が switch に無い
- Prisma 更新、字幕生成、無音カット、Remotion render、thumbnail 保存が分散している
3. `sst dev` 中でも whisper 実行場所はローカル Next プロセスで、AWS 側へ寄っていない
4. project 単位の processing job source of truth がなく、`Project.status` だけで二重起動制御をしている
5. `docs/tech-stack.md` を含むドキュメントが現状実装とズレている

### 無料構成としての判断
- **採用**: `SST dev + Next.js + Lambda(Function URL) + S3 + Turso`
- **採用しない**: Remotion Lambda, Fargate, SQS 常設
- 理由:
  - `sst dev` の live mode で Lambda invocation をローカルへプロキシできる
  - 追加サービスを増やさずに、実行経路だけ AWS 方式へ寄せられる
  - まずは無料寄りに「開発経路を一本化」するのが優先

## 目標アーキテクチャ
### 実行経路
1. UI / API は Next.js (`sst.aws.Nextjs`)
2. `/api/process/start` は DB 更新だけを行い、`VideoProcessor` を invoke する
3. `VideoProcessor` が `runProjectProcessing()` 相当の pipeline を担当する
4. worker は S3 object key を materialize して処理し、成果物を S3 に deterministic key で保存する
5. UI は `project.progress`, `progressMessage`, `lastError` を poll して状態表示する

### source of truth
- DB: Turso
- バイナリ: S3
- ジョブ状態: `ProcessingJob` テーブル
- project は「現在の見える状態」、job は「実行の事実と冪等性」を持つ

## 実装方針
### 1. processing を worker 起点に切り替える
`app/api/process/start/route.ts` の `after()` を廃止し、以下に変更します。
- 認証と owner check
- 冪等キー生成
- `ProcessingJob` 作成または既存 job 再利用
- `Project.status/progress/progressMessage` 更新
- `VideoProcessor` を invoke
- レスポンスは常に `202 Accepted`

`app/api/process/route.ts` の `POST` は互換 API として残す場合でも、内部で同じ enqueue ロジックを使うよう統一します。直接 `runProjectProcessing()` は呼びません。

### 2. `ProcessingJob` テーブルを追加して冪等化する
Prisma schema に processing 専用テーブルを追加します。

保持したい最低限の項目:
- `id`
- `projectId`
- `status` (`QUEUED` / `RUNNING` / `COMPLETED` / `FAILED` / `CANCELED`)
- `pipelineVersion`
- `inputStoragePath`
- `inputFingerprint`
- `requestKey`
- `startedAt`
- `completedAt`
- `lastHeartbeatAt`
- `attempt`
- `errorMessage`
- `resultVideoPath`
- `resultThumbnailPath`

冪等ルール:
- 同一 `projectId + requestKey` の未完了 job があれば再作成しない
- `requestKey` は少なくとも `projectId + sourceStoragePath + updatedAt(or fingerprint) + pipelineVersion + options hash`
- 成果物 key はランダム名ではなく deterministic にする
  - `projects/{projectId}/artifacts/{pipelineVersion}/output.mp4`
  - `projects/{projectId}/artifacts/{pipelineVersion}/thumbnail.jpg`
  - `projects/{projectId}/artifacts/{pipelineVersion}/subtitles.srt`
- 同一入力で再実行しても「上書き再生成」になるだけで、別名ゴミを増やさない

### 3. `VideoProcessor` を現行 pipeline の実行主体にする
`infra/video-processor/handler.ts` は簡易 ffmpeg handler を捨て、`runProjectProcessing()` と責務を揃えた worker に置き換えます。

worker の責務:
- job load と ownership 確認
- project/video/style 読み込み
- S3 から input を materialize
- `extractAudio`
- `transcribeAudio`
- `generateSubtitles`
- subtitle save
- `detectSilence`
- `processVideo`
- `generateThumbnail`
- waveform save
- `Project` / `ProcessingJob` の進捗更新

ここで重要なのは、**実処理コードを API route から外し、worker からしか呼ばれない形に寄せる**ことです。  
必要なら `lib/process-project.ts` は「worker 本体」へ改名し、API から直接 import しないようにします。

### 4. `sst dev` での worker 実行を前提に env と link を厳密化する
次を strict にします。
- `sst.config.ts` で空文字 fallback をやめる
- `VideoProcessor` と `Web` の env を必須化する
- runtime では `Resource.VideoProcessor.url` と `Resource.VideoBucket.name` を唯一の source に寄せる

`VIDEO_PROCESSOR_URL` の hand-written env 注入より、SST link を優先します。  
`sst dev` の live mode により、Function URL 呼び出しはローカル worker へ到達するため、無料構成で dev 体験を維持できます。

### 5. whisper 実行を worker 内に閉じ込める
いまは whisper fallback を消してあるので、worker 内で `@remotion/install-whisper-cpp` が成功する前提を明確化します。

方針:
- Next 側では whisper を一切実行しない
- `transcribeAudio()` は worker からのみ使う
- 失敗時は `Project.lastError` と `ProcessingJob.errorMessage` に toolchain エラーを残す
- 同じ失敗を無限再試行しないよう `attempt` 上限を持つ

補足:
- これは「Lambda 上で必ず whisper が動く」保証ではなく、「`sst dev` の worker 経路に一本化する」ための整理
- 本番で Lambda 実行が厳しければ、将来的に container worker へ差し替えやすい形にする

### 6. 進捗更新を job ベースに揃える
Project だけでなく Job にも同じ進捗情報を残します。

進捗例:
- 0: queued
- 10: downloading source
- 20: extracting audio
- 35: transcribing audio
- 55: generating subtitles
- 70: detecting silence
- 80: rendering video
- 90: generating thumbnail / waveform
- 100: completed

これにより、UI は今後 `ProcessingJob` ベースの詳細表示へ拡張できます。  
まずは既存 UI を壊さないため `Project.progress` にも mirror します。

### 7. download / source-video / thumbnail / export の deterministic 化
いまの成果物パスに timestamp 混入がある箇所を整理します。

やること:
- `output_${Date.now()}.mp4` のような naming を廃止
- artifact key を固定化
- `project.currentOutputPath` 相当の参照を一箇所に集約
- download route は最新 completed job の output を返す

これで再処理後も「どの output を返すか」が曖昧になりません。

### 8. docs を現実装へ更新する
最低限更新する:
- `docs/tech-stack.md`
- `docs/spec.md`
- `docs/deployment.md`
- 必要なら `docs/bug-report-*.md`

反映内容:
- local 開発でも Turso/S3/SST を使う
- `/processing` ではなく editor 内 processing を正とする
- processing は worker 起点
- free/dev 構成では Remotion Lambda を使わない

## 実装ステップ
1. Prisma schema に `ProcessingJob` 追加、migration と seed 整理
2. job 作成・再利用ロジックを `lib/server/processing-jobs.ts` 的な単位に切り出す
3. `/api/process/start` と `/api/process` を enqueue/invoke 方式へ変更
4. `infra/video-processor/handler.ts` を現行 pipeline ベースで再実装
5. `runProjectProcessing()` を worker 専用 orchestration に整理
6. deterministic artifact path へ変更
7. `Project` と `ProcessingJob` の進捗同期実装
8. download/source/thumbnail/export の参照先を latest completed artifact に統一
9. `sst.config.ts` の env/link を strict に修正
10. docs 更新
11. 手動検証と E2E 的確認

## 検証計画
### 必須
- `npm run build`
- `npx prisma migrate deploy` または同等の schema 反映
- `npx sst dev --stage dev`
- ログイン
- 動画アップロード
- 処理開始を 2 回連打して二重 job にならないこと
- リロード後も progress が復元されること
- 完了後に editor で動画、字幕、thumbnail が見えること
- mp4 download が通ること

### 冪等性チェック
1. 同一 project で start を連打
2. 実行中にページ再読込
3. worker 失敗後に retry
4. 同じ source で再実行

期待値:
- active job は 1 つ
- artifact path は増殖しない
- 再実行時は同じ deterministic key を再生成

## この plan でやらないこと
- Remotion Lambda 導入
- Fargate / SQS / Step Functions 導入
- 本番スケール最適化
- whisper-cpp の Lambda 本番安定化保証

## リスク
1. `sst dev` の live function で whisper-cpp toolchain が不安定な可能性がある
2. Lambda handler と Next runtime の import 境界で Node-only 依存が漏れる可能性がある
3. `ProcessingJob` 導入に伴い既存 UI の status 判定にズレが出る可能性がある

## リスク対応
- worker 専用モジュールを明確に分離する
- progress/status は当面 `Project` に mirror して UI 破壊を避ける
- deterministic key と job table を先に入れて、まず冪等性を確保する
