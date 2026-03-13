# ローカル開発 / 本番デプロイ手順

## 目的

現状の SakuEdit は、processing を `VideoProcessor` worker 経由で実行します。  
このドキュメントは、ローカル開発と本番デプロイで何を準備し、どの順番で確認すればよいかをまとめたものです。

---

## ローカル開発

### 1. 必須環境変数を揃える

最低限、以下を `.env` に設定します。

```env
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."
TURSO_DATABASE_NAME="your-database"
DATABASE_URL="file:./dev.db"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret"
OPENROUTER_API_KEY="..."
```

補足:

- `PROCESSING_WORKER_TOKEN` は現状 `BETTER_AUTH_SECRET` を流用します
- `DATABASE_URL` は Prisma CLI 用です
- runtime 接続自体は Turso を使います

### 2. `sst dev` の runtime bootstrap を理解する

`sst dev` では Lambda Layer は使われず、関数はローカル実行されます。  
そのため起動時に `.sst/runtime/video-processing/...` へローカル runtime を自動展開します。

自動展開の対象:

- `ffmpeg`
- `ffprobe`
- `whisper.cpp`
- Whisper model
- `yt-dlp` がローカルに見つかればそれも取り込む

補足:

- `Remotion CLI` はローカル `node_modules` を使います
- worker 起動時に runtime install は行いません
- 初回の `sst dev` は whisper runtime の準備で時間がかかります

### 3. 必要なら runtime 関連 env を設定する

ローカル固定パスで動かす場合は、必要に応じて以下を設定します。

```env
PROCESSING_RUNTIME_ROOT=/opt
WHISPER_ROOT=/opt/whisper
WHISPER_MODEL=base
WHISPER_MODEL_PATH=/opt/whisper/models/ggml-base.bin
WHISPER_CPP_VERSION=1.7.4
```

補足:

- 実装は `PROCESSING_RUNTIME_ROOT` と `/opt` を優先して見に行きます
- `WHISPER_ROOT` を明示すればそちらが優先されます
- `ffmpeg` と `ffprobe` は `PATH`、`/opt/homebrew/bin`、`/usr/local/bin` も自動検出します
- `yt-dlp` も `PATH`、`/opt/homebrew/bin`、`/usr/local/bin` を自動検出します

### 4. Prisma を反映する

```bash
npx prisma generate
```

必要に応じて migration を作成し、生成された SQL を Turso に適用します。

```bash
npx prisma migrate dev --name <migration-name>
export MIGRATION_SQL_PATH="prisma/migrations/<timestamp>_<migration-name>/migration.sql"
npm run db:migrate:apply
```

### 5. SST 開発環境を起動する

```bash
npx sst dev --stage dev
```

### 6. 動作確認を行う

最低限、以下を確認します。

1. ユーザー登録とログイン
2. 動画アップロード
3. 処理開始
4. 編集画面で進捗が見える
5. 完了後に字幕、サムネイル、出力動画が見える
6. mp4 ダウンロードが通る

### 7. build を確認する

```bash
npm run build
```

---

## 本番デプロイ

### 1. 本番用の DB / Secret を用意する

最低限、以下を本番用に揃えます。

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `OPENROUTER_API_KEY`

### 2. `VideoProcessor` の runtime 供給方法を決める

今のコードは次のどちらにも対応できます。

- Lambda Layer を使う
- container image を使う

推奨方針:

- まずは Lambda Layer か container image のどちらかで runtime を固定する
- deploy 後に短尺動画の smoke test を通す

### 3. Lambda Layer を使う場合

Layer には少なくとも以下を含めます。

- `ffmpeg`
- `ffprobe`
- `whisper.cpp`
- Whisper model
- `yt-dlp` を本番で使うならそれも含める

補足:

- `sst.config.ts` は Linux 上で `sst deploy` する場合、Pulumi `aws.lambda.LayerVersion` で managed layer を自動作成します
- Linux 以外から deploy する場合は `VIDEO_PROCESSOR_LAYER_ARNS` で既存 layer ARN を渡します
- `sst dev` では layer は使われません

Layer を発行したら、その ARN を env に設定します。

```env
VIDEO_PROCESSOR_LAYER_ARNS=arn:aws:lambda:ap-northeast-1:123456789012:layer:sakuedit-runtime:1
PROCESSING_RUNTIME_ROOT=/opt
WHISPER_ROOT=/opt/whisper
WHISPER_MODEL=base
WHISPER_MODEL_PATH=/opt/whisper/models/ggml-base.bin
```

補足:

- 現在の実装は `/opt` を読めるようになっています
- `Web` 側には重い runtime env を流さず、`VideoProcessor` 側にだけ寄せています

### 4. デプロイする

```bash
npx sst deploy --stage production
```

### 5. デプロイ後に smoke test をする

最低限、以下を確認します。

1. ログインできる
2. 動画アップロードできる
3. `VideoProcessor` が起動する
4. 音声抽出、字幕生成、無音カット、レンダリング、サムネイル生成が完走する
5. 編集画面で成果物が見える
6. mp4 / SRT / thumbnail が取得できる

### 6. 冪等性を確認する

同じ project で再実行して、以下を確認します。

- active job が増殖しない
- artifact path が増殖しない
- `projects/{projectId}/artifacts/{pipelineVersion}/...` に上書き再生成される

---

## 実装上の注意

- `VideoProcessor` は起動時に self-check を行います
- `ffmpeg` `ffprobe` `Remotion CLI` `whisper` が足りない場合は、処理途中ではなく起動直後に失敗します
- 成果物は deterministic path に保存されます
- download / thumbnail は latest completed job を優先参照します

---

## 関連ファイル

- `sst.config.ts`
- `infra/video-processor/handler.ts`
- `lib/video-processor.ts`
- `lib/remotion-whisper-adapter.ts`
- `lib/process-project.ts`
- `lib/server/processing-jobs.ts`
- `docs/deployment.md`
