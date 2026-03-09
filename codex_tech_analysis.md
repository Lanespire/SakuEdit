2026年3月9日時点の公式情報ベースで見ると、SakuEditの主用途には `OpenAI Whisper + Server-side processing` が最適です。先に一点だけ補足すると、Z.AIの現行ASRは `glm-5` ではなく `glm-asr-2512` です。`glm-5` はASR本体より、字幕整形やYouTuberスタイル分析に回すほうが自然です。既存の [docs/tech-stack.md](/Users/takahashimotoki/product/sakuedit/docs/tech-stack.md) はこの点を見直したほうがいいです。

日本語精度は、公式の横並びベンチマークが揃っていない項目があるため、一部は仕様と制約からの推定です。

**ASR比較**

| 候補 | 精度（日本語） | 処理速度 | コスト | オフライン対応 | 話者認識 | タイムコード生成 | ライセンス |
|---|---|---|---|---|---|---|---|
| OpenAI Whisper | 高い。多言語対応で日本語向き。比較対象の中では最も無難 | 中。`whisper-1` はストリーミング非対応 | APIは `$0.006/分`。OSS自前運用ならAPI課金なし | API利用は不可、OSS自前実行なら可 | なし。話者ラベルは `gpt-4o-transcribe-diarize` 側 | あり。`word` / `segment` の粒度を出せる | OSS版は MIT。API利用時はOpenAI利用規約 |
| Web Speech API | 中〜低。ブラウザ/OS依存が強く、日本語字幕の本番品質は不安定 | 高。リアルタイム向き | 無料 | 既定は不可。`processLocally` で一部オンデバイス可だが実験的 | なし | 実質なし。結果オブジェクトに編集用タイムコードがない | Web標準API。追加ライセンス費用なし |
| Z.AI ASR (`glm-asr-2512`) | 高め。ただし日本語の公開比較根拠はWhisperより薄い | 高。ストリーミング対応 | 約 `$0.0024/分` 相当でかなり安い | 不可 | なし（現行docs上） | なし（現行docs上、返却は `text` 中心） | プロプライエタリAPI、Z.AI利用規約 |

ASRでSakuEditに効く論点は `日本語精度` だけでなく `字幕編集用タイムコード` と `長尺耐性` です。ここで `Web Speech API` は弱く、`Z.AI ASR` は現行docs上 `30秒 / 25MB` 制限とタイムコード非対応がかなり痛いです。

**動画処理比較**

| 候補 | 処理速度 | クライアントCPU負荷 | サーバーコスト | 機能 | ブラウザ対応 | 開発難易度 |
|---|---|---|---|---|---|---|
| FFmpeg.wasm | 低。公式比較でもネイティブFFmpegより大幅に遅い | 非常に高い | 低い | 広い。トリミング、変換、字幕焼き込みまで可能 | 広め。ただしマルチスレッドは `SharedArrayBuffer` 前提 | 中 |
| WebCodecs | 高い。ブラウザ内codecを直接使える | 中〜高 | 低い | 低〜中。低レベルAPIなので字幕焼き込みやmuxは自前実装が重い | 限定的。MDNでも `Limited availability` | 高 |
| Server-side processing | 高くて安定。長尺や最終書き出しに強い | 低い | 中〜高 | 最も広い。無音検出、精密トリム、字幕焼き込み、Remotion書き出し向き | 非常に良い。ブラウザ差異を吸収できる | 中 |

SakuEditの要件だと、`無音トリミング` `字幕焼き込み` `テンポ再現` `Remotion編集` を全部まとめて安定させるには、クライアント完結よりサーバー側のネイティブ処理が圧倒的に有利です。

**結論**

推奨は `OpenAI Whisper + Server-side processing` です。

理由は単純で、SakuEditの主機能に必要な `高品質な日本語文字起こし` `編集可能なタイムコード` `長尺動画への安定対応` `Remotionとの接続` を一番素直に満たすからです。具体的には次の分担がきれいです。

1. ASR本体は `OpenAI Whisper`
2. 動画処理本体は `Server-side processing`
3. `glm-5` はASRではなく、字幕の整形、句読点補正、要約、YouTuberスタイル分析に使う
4. `Web Speech API` は本番ASRではなく、将来の「マイク入力での簡易修正」用途に限定する
5. `WebCodecs` は必要なら後から「ブラウザ内プレビュー高速化」にだけ使う

実装イメージとしては、`FFmpeg(サーバー)` で音声抽出と無音検出、`Whisper` で `word/segment` タイムコード付き文字起こし、結果をRemotionの字幕JSONに正規化し、`glm-5` で字幕圧縮やスタイル推定、最後に `Remotion + FFmpeg(サーバー)` で焼き込みとMP4書き出し、が一番筋が良いです。

補足すると、OpenAI系で精度最優先なら現時点では `gpt-4o-transcribe` 系のほうが新しいですが、今回の比較対象3つに限るなら `Whisper` が最適です。

**Sources:**
- [OpenAI Whisper model](https://developers.openai.com/api/docs/models/whisper-1)
- [OpenAI Audio Transcription API reference](https://platform.openai.com/docs/api-reference/audio/createTranscription)
- [OpenAI Pricing](https://developers.openai.com/api/docs/pricing)
- [OpenAI Whisper GitHub (MIT license)](https://github.com/openai/whisper)
- [MDN: SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [MDN: Using the Web Speech API](https://developer.mozilla.org/en-US/docs/web/api/web_speech_api/using_the_web_speech_api)
- [Z.AI Audio Transcriptions API](https://docs.z.ai/api-reference/audio/audio-transcriptions)
- [Z.AI GLM-ASR-2512 overview](https://docs.z.ai/guides/audio/glm-asr-2512)
- [Z.AI Pricing](https://docs.z.ai/guides/overview/pricing)
- [ffmpeg.wasm overview](https://ffmpegwasm.netlify.app/docs/overview/)
- [ffmpeg.wasm performance](https://ffmpegwasm.netlify.app/docs/performance/)
- [MDN: WebCodecs API](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [Remotion](https://www.remotion.dev/)