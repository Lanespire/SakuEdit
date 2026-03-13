# SST Runtime Plan

## Goal

`npx sst dev --stage dev` と `sst deploy` の両方で、同じ processing pipeline が破綻せずに動く状態にする。

前提:

- DB は Turso を使う
- 入出力アセットは S3 を使う
- processing は `VideoProcessor` worker 経由で実行する
- 冪等性は `ProcessingJob` で担保する

## Current State

現状の processing 経路:

`/api/process/start` -> `enqueueProjectProcessing()` -> `invokeProcessingJob()` -> `VideoProcessor` -> `runProjectProcessing()`

この経路自体は `sst dev` でも `sst deploy` でも使い回せる。

ただし runtime 依存はまだ揃っていない。

- `sst dev` の `VideoProcessor` は実質ローカル実行なので、whisper / ffmpeg / remotion はローカル環境依存
- `sst deploy` の Lambda では、ローカル絶対パスや runtime install 前提は使えない
- 現状の `lib/remotion-whisper-adapter.ts` は `installWhisperCpp()` を実行するため、本番向きではない
- 現状の `sst.config.ts` はローカル `node_modules` や `.cache` のパスを前提にしていて、本番再現性がない

## What `sst dev` Needs

`sst dev` を安定して動かすには、次を満たす必要がある。

1. 必須 env を常に設定する

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `PROCESSING_WORKER_TOKEN`
- `VIDEO_BUCKET_NAME`
- `AWS_REGION`

2. ローカル machine に processing runtime を揃える

- `ffmpeg`
- `ffprobe`
- Remotion CLI
- whisper.cpp binary
- Whisper model

3. runtime install をやめる

`sst dev` は AWS 上で whisper が動くわけではなく、ローカル Node worker で動く。  
そのため `installWhisperCpp()` のような実行時セットアップは不安定で、開発のたびに壊れやすい。  
`sst dev` では「事前セットアップ済み binary を使う」形に固定する。

## What `sst deploy` Needs

`sst deploy` で本番稼働させるには、`VideoProcessor` を deploy-safe にする必要がある。

必要条件:

1. Lambda 実行環境内に processing runtime が同梱されていること
2. ローカル絶対パスに依存しないこと
3. runtime install を行わないこと
4. 作業ディレクトリは `/tmp` のみを使うこと
5. S3 から入力を取得し、S3 に成果物を戻すこと

実装方針:

- `VideoProcessor` は prebuilt runtime 前提にする
- runtime の供給方法は Lambda Layer か container image のどちらでもよい
- runtime には `ffmpeg`, `ffprobe`, Remotion CLI, whisper.cpp binary, model を事前同梱する
- `lib/remotion-whisper-adapter.ts` は install 処理を削除し、同梱済み binary のみ参照する
- `sst.config.ts` ではローカル `node_modules` や `.cache` を `Web` に流さない

## Local Dev Strategy

ローカル開発では、`sst dev` を次の意味で使う。

- AWS リソース: S3, Lambda URL, Turso を使う
- function 実行本体: ローカルの live worker を使う

このモードでは「本番完全一致」ではなく、「本番と同じ入出力経路で、ローカル runtime を使う」ことを目的にする。

やること:

1. `VideoProcessor` の呼び出し経路は今のまま維持する
2. whisper binary と model をローカルに固定配置する
3. `ffmpeg` / `whisper` の存在チェックを worker 起動時に明示する
4. 未セット env は即エラーにする

## Production Strategy

本番では `VideoProcessor` を AWS 上で自己完結させる。

最小構成:

1. Next.js
2. `VideoProcessor` Lambda
3. S3
4. Turso

この構成なら追加の Remotion Lambda や Fargate は必須ではない。  
ただし 15 分超の動画を確実に捌きたいなら、将来的には `transcribe` と `render` を別 job に分ける。

## Required Code Changes Before Deploy

### 1. Whisper runtime を固定化する

対象:

- `lib/remotion-whisper-adapter.ts`

やること:

- `installWhisperCpp()` を削除する
- `downloadWhisperModel()` を削除する
- `WHISPER_ROOT` もしくは layer 上の `/opt/whisper` を source of truth にする
- binary が無ければ即エラーにする

### 2. `sst.config.ts` を deploy-safe にする

対象:

- `sst.config.ts`

やること:

- ローカル `node_modules` の Remotion CLI パスを env に渡さない
- ローカル `.cache` パスを env に渡さない
- `VideoProcessor` 専用の runtime env / layer 設定だけを残す

### 3. `VideoProcessor` の runtime を同梱する

対象:

- `sst.config.ts`
- `infra/video-processor/handler.ts`
- runtime build files

やること:

- layer または image に `ffmpeg`, `ffprobe`, Remotion CLI, whisper.cpp, model を含める
- Lambda の `/tmp` だけで処理できることを確認する

### 4. 起動前 self-check を入れる

対象:

- `infra/video-processor/handler.ts`
- `lib/process-project.ts`

やること:

- env 不足
- S3 接続不能
- Turso 接続不能
- `ffmpeg` 不在
- whisper binary 不在

を最初に検査して、途中失敗ではなく即 fail させる。

## Deploy Checklist

デプロイ前に終わっているべきこと:

1. `sst dev --stage dev` で upload -> transcribe -> render -> thumbnail -> completed まで完走する
2. 同じ入力で再実行しても同じ `ProcessingJob` を再利用し、重複成果物を増やさない
3. whisper runtime が事前配置済みで、runtime install が走らない
4. `VideoProcessor` が layer もしくは container image で self-contained になっている
5. `sst deploy` 後に 1 本の短尺動画で smoke test が通る
6. `/api/download/:projectId` と `/api/thumbnail/:id` が S3 署名 URL ベースで動く
7. long-running render が 15 分を超えない条件を明文化する

## Recommendation

優先順位はこれで進める。

1. whisper の runtime install を削除する
2. `VideoProcessor` を layer または container image で self-contained にする
3. `sst dev` を固定 runtime 前提で安定化する
4. `sst deploy` で短尺 smoke test を通す
5. 長尺動画の制限か job 分割を決める

この順なら、ローカル開発と本番の差分を最小化したまま前に進められる。
