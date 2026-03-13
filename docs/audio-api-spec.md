# SakuEdit 音声API技術仕様書

## 概要

AI動画編集アプリ「SakuEdit」に組み込むための、SE（効果音）およびBGM生成用APIの調査結果をまとめる。

---

## 1. Pixabay API（SE/効果音用）

### 基本情報

| 項目 | 内容 |
|------|------|
| 公式ドキュメント | https://pixabay.com/api/docs/ |
| 音声API対応状況 | **音楽/効果音の公開APIは現時点で未提供** |
| 提供中エンドポイント | 画像検索 (`/api/`) と動画検索 (`/api/videos/`) のみ |

### 詳細

Pixabayのサイト上では音楽（`/music/`）や効果音（`/sound-effects/`）のコンテンツが存在するが、**API経由でのアクセスは公式にはドキュメント化されていない**。

### 利用可能な情報

- **認証**: APIキー（Pixabayアカウントでログイン後に取得）
- **レート制限**: デフォルトで60秒あたり100リクエスト
  - `X-RateLimit-Limit`: 最大リクエスト数
  - `X-RateLimit-Remaining`: 残りリクエスト数
  - `X-RateLimit-Reset`: リセットまでの秒数
- **キャッシュ要件**: リクエスト結果を24時間キャッシュ必須
- **ライセンス**: Pixabay Content License（商用利用可、帰属表示推奨）
- **制限**: ホットリンク禁止、大量ダウンロード禁止

### 結論

**SakuEditへの統合は現時点では不可**。SE用途としては後述のFreesoundまたはElevenLabsを推奨。

---

## 2. Beatoven.ai API（BGM生成用）

### 基本情報

| 項目 | 内容 |
|------|------|
| 公式サイト | https://www.beatoven.ai/ |
| APIダッシュボード | https://sync.beatoven.ai/apiDashboard |
| API提供状況 | **API提供あり**（要アカウント登録） |

### 提供API

| API名 | 機能 |
|--------|------|
| Composition API（maestro） | テキストプロンプトからBGM生成 |
| SFX Generation API | テキストプロンプトから効果音生成 |
| Music Intelligence API | 音楽分析 |
| AI Music Search API | 音楽検索 |

### 料金プラン

| プラン | 月額 | ダウンロード可能時間 |
|--------|------|---------------------|
| Free | $0 | 5曲生成 |
| Creator | $6/月 | 15分/月 |
| Visionary | $10/月 | 30分/月 |
| Professional | $20/月 | 60分/月 |
| Pay-Per-Use | $3/追加 | 追加分 |

### 特徴

- テキストからBGM生成（Text-to-Music）
- テキストから効果音生成（Text-to-SFX）
- MP3/WAV形式でダウンロード
- **ロイヤリティフリーライセンス**付き（非排他的・永続的）
- 商用利用可能（マネタイズコンテンツOK）
- **制限**: Spotify/Apple Music等のストリーミングサービスへの直接配信は禁止
- Fairly Trained認定

### 認証方法

APIダッシュボード（https://sync.beatoven.ai/apiDashboard）でアカウント作成後、APIキーを取得。詳細なエンドポイント仕様はダッシュボード内のドキュメントで確認が必要。

### 推奨統合方法

```typescript
// Beatoven.ai統合イメージ（正確なAPIは要ダッシュボード確認）
const generateBGM = async (prompt: string, duration: number) => {
  const response = await fetch('https://sync.beatoven.ai/api/v1/compose', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BEATOVEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,          // "明るいポップなBGM、テンポ120BPM"
      duration,        // 秒数
      format: 'mp3',
    }),
  });
  return response;
};
```

### 結論

**BGM生成の有力候補**。API仕様の詳細確認にはアカウント登録が必要。コストパフォーマンスは良好（$20/月で60分）。

---

## 3. Freesound API（SE用 - 推奨）

### 基本情報

| 項目 | 内容 |
|------|------|
| ベースURL | `https://freesound.org/apiv2/` |
| ドキュメント | https://freesound.org/docs/api/ |
| APIキー申請 | https://freesound.org/apiv2/apply |
| ステータス | **完全に利用可能** |

### 認証方法

#### Token認証（検索・メタデータ取得用）

```bash
# GETパラメータとして
curl 'https://freesound.org/apiv2/search/text/?query=explosion&token=YOUR_API_KEY'

# Authorizationヘッダーとして
curl -H 'Authorization: Token YOUR_API_KEY' 'https://freesound.org/apiv2/search/text/?query=explosion'
```

#### OAuth2認証（ダウンロード・アップロード用）

1. ユーザーを `https://freesound.org/apiv2/oauth2/authorize/` にリダイレクト
   - パラメータ: `client_id`, `response_type=code`, `state`（任意）
2. コールバックURLで認証コード受信（有効期限10分）
3. `POST https://freesound.org/apiv2/oauth2/access_token/` でトークン交換
   - パラメータ: `client_id`, `client_secret`, `grant_type=authorization_code`, `code`
   - レスポンス: access_token, refresh_token, scope, expires_in（86399秒=24時間）

### 主要エンドポイント

#### テキスト検索

```
GET /apiv2/search/text/
```

| パラメータ | 型 | 説明 |
|-----------|------|------|
| query | string | 検索テキスト（タグ、名前、説明等を横断検索） |
| filter | string | Solr構文フィルタ（例: `duration:[0.5 TO 5]`） |
| sort | string | ソート順（score, duration_desc/asc, created_desc/asc, downloads_desc/asc, rating_desc/asc） |
| fields | string | 返却フィールド（カンマ区切り、デフォルト: id,name,tags,username,license） |
| page | int | ページ番号 |
| page_size | int | 1ページあたり件数（最大150） |
| group_by_pack | bool | 同一パック内の結果をグループ化 |

#### レスポンス例

```json
{
  "count": 1234,
  "next": "https://freesound.org/apiv2/search/text/?query=explosion&page=2",
  "previous": null,
  "results": [
    {
      "id": 12345,
      "name": "Explosion_Large.wav",
      "tags": ["explosion", "boom", "impact"],
      "username": "sounddesigner",
      "license": "Attribution",
      "duration": 3.5,
      "samplerate": 44100,
      "channels": 2,
      "avg_rating": 4.5,
      "num_downloads": 5000
    }
  ]
}
```

#### フィルタ例

```
# 0.5〜5秒のWAVまたはAIFF
filter=duration:[0.5 TO 5] type:(wav OR aiff)

# ピッチ指定
filter=pitch:[435 TO 445]

# カテゴリ指定
filter=tag:explosion
```

#### その他エンドポイント

| メソッド | エンドポイント | 認証 | 説明 |
|---------|-------------|------|------|
| GET | `/sounds/<id>/` | Token | サウンド詳細 |
| GET | `/sounds/<id>/similar/` | Token | 類似サウンド |
| GET | `/sounds/<id>/analysis/` | Token | 音声解析データ |
| GET | `/sounds/<id>/download/` | **OAuth2** | ダウンロード |
| GET | `/users/<username>/sounds/` | Token | ユーザーのサウンド一覧 |
| GET | `/packs/<id>/sounds/` | Token | パック内サウンド |
| GET | `/packs/<id>/download/` | **OAuth2** | パック一括DL |

### ライセンス

| ライセンス | 商用利用 | 帰属表示 |
|-----------|---------|---------|
| CC0（パブリックドメイン） | 可 | 不要 |
| CC-BY（帰属表示） | 可 | **必要** |
| CC-BY-NC（非商用） | **不可** | 必要 |

### 料金・制限

- **非商用利用**: 無料
- **商用利用**: UPF（ポンペウ・ファブラ大学）と個別交渉
- **レート制限**: 利用パターンに基づきFreesoundが設定（具体的数値は非公開）
- **制限事項**: API経由のスクレイピング禁止、サブライセンス禁止

### 推奨統合方法

```typescript
// Freesound SE検索統合
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY;
const FREESOUND_BASE = 'https://freesound.org/apiv2';

// 効果音検索
const searchSoundEffects = async (query: string, options?: {
  minDuration?: number;
  maxDuration?: number;
  license?: 'Attribution' | 'Creative Commons 0';
}) => {
  const params = new URLSearchParams({
    query,
    token: FREESOUND_API_KEY,
    fields: 'id,name,tags,license,duration,previews,download',
    page_size: '20',
  });

  if (options?.minDuration || options?.maxDuration) {
    const min = options.minDuration ?? 0;
    const max = options.maxDuration ?? 30;
    params.set('filter', `duration:[${min} TO ${max}]`);
  }

  const res = await fetch(`${FREESOUND_BASE}/search/text/?${params}`);
  return res.json();
};

// ダウンロード（OAuth2トークン必要）
const downloadSound = async (soundId: number, accessToken: string) => {
  const res = await fetch(`${FREESOUND_BASE}/sounds/${soundId}/download/`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  return res;
};
```

### 結論

**SE用途として最も実用的**。無料で利用可能、豊富なサウンドライブラリ。ただし商用利用時はライセンス確認が必須（CC0のもののみ使用するのが安全）。OAuth2実装が必要な点に注意。

---

## 4. ElevenLabs Sound Effects API（SE用 - 高品質）

### 基本情報

| 項目 | 内容 |
|------|------|
| エンドポイント | `POST https://api.elevenlabs.io/v1/sound-generation` |
| リージョン別 | US: `api.us.elevenlabs.io`, EU: `api.eu.residency.elevenlabs.io`, IN: `api.in.residency.elevenlabs.io` |
| ドキュメント | https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert |
| ステータス | **完全に利用可能** |

### 認証方法

```
xi-api-key: YOUR_API_KEY
```

ヘッダーにAPIキーを設定。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| text | string | Yes | 効果音の説明テキスト |
| duration_seconds | number | No | 生成時間（0.5〜30秒、省略時は自動判定） |
| prompt_influence | number | No | プロンプト忠実度（0〜1、デフォルト0.3） |
| loop | boolean | No | ループ対応（v2モデルのみ） |
| model_id | string | No | モデルID（デフォルト: `eleven_text_to_sound_v2`） |

#### クエリパラメータ

| パラメータ | 型 | 説明 |
|-----------|------|------|
| output_format | string | 出力形式（mp3_44100_128, pcm, ulaw, alaw, opus等） |

### リクエスト例

```typescript
const generateSoundEffect = async (text: string, durationSeconds?: number) => {
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,                    // "ドアをバタンと閉める音"
      duration_seconds: durationSeconds ?? undefined,
      prompt_influence: 0.5,
      model_id: 'eleven_text_to_sound_v2',
    }),
  });

  if (!response.ok) throw new Error(`ElevenLabs API error: ${response.status}`);

  // レスポンスはバイナリ音声データ（application/octet-stream）
  const audioBuffer = await response.arrayBuffer();
  return audioBuffer;
};
```

### レスポンス

- **200**: バイナリ音声ファイル（`application/octet-stream`）
- **422**: バリデーションエラー

### 料金

- **クレジットコスト**: duration指定時 **40クレジット/秒**
- duration未指定時は自動判定（コスト体系は異なる可能性あり）

#### ElevenLabs料金プラン

| プラン | 月額 | 備考 |
|--------|------|------|
| Free | $0 | 非商用利用のみ、帰属表示必要 |
| Starter | 有料 | 商用利用可、Voice Cloning可 |
| Creator | 有料 | 上位機能 |
| Pro | 有料 | 上位機能 |
| Scale | 有料 | 大規模利用向け |
| Business/Enterprise | 要問合せ | カスタム |

※具体的な月額・クレジット数は https://elevenlabs.io/pricing で要確認

### 対応出力形式

- MP3（各種ビットレート・サンプルレート）
- PCM
- ulaw / alaw
- Opus
- WAV（48kHz、非ループ時のみ）

### 機能

- 映画/トレーラー用シネマティックサウンドデザイン
- ゲーム/インタラクティブ体験用カスタムエフェクト
- 動画制作用フォーリー・アンビエントオーディオ
- ドラムパターン・シンセパッド等の音楽コンポーネント
- 複数パートの連続イベント描写

### プロンプトのコツ

- シンプルで明確な説明
- 連続する複雑な音は順序を記述
- 音響用語を活用（braam, whoosh, ambience, glitch等）
- 音楽的な指定も可能（BPM、キー、楽器等）

### 結論

**高品質SE生成には最適**。テキストから直接SE生成が可能で、既存ライブラリ検索が不要。ただしクレジットコスト（40/秒）に注意。Freesoundとの併用が理想的。

---

## 5. Mubert API（BGM生成用）

### 基本情報

| 項目 | 内容 |
|------|------|
| 公式サイト | https://mubert.com/api |
| API提供状況 | **API提供あり**（要問い合わせ） |
| ドキュメント | 一般公開されていない（営業担当との個別相談） |

### 料金

- サブスクリプション制（月額/年額）
- 年額プランで最大25%割引
- **具体的な金額は非公開**（「Book a call with our representative」で確認）

### 利用制限

- Content IDシステムへの楽曲登録禁止
- Spotify/Apple Music/Deezer/YouTube Music等のストリーミングサービスへの配信禁止
- 生成された音楽の著作権はMubert Inc.に帰属
- 個人利用のみライセンス（*.mubert.comドメイン上の音楽）

### 結論

**商用利用に制約が多く、SakuEditへの統合は推奨しない**。APIアクセスも要問い合わせで開発効率が低い。Beatoven.aiの方が適切。

---

## 6. Suno API（BGM生成用）

### 基本情報

| 項目 | 内容 |
|------|------|
| 公式サイト | https://suno.com |
| 公式API | **公式APIは一般公開されていない**（2026年3月時点） |
| 非公式ラッパー | https://github.com/gcui-art/suno-api |

### 非公式APIラッパーのエンドポイント

| エンドポイント | 機能 |
|-------------|------|
| `/api/generate` | テキストプロンプトから音楽生成 |
| `/api/custom_generate` | 歌詞・スタイル・タイトル指定の高度な生成 |
| `/api/generate_lyrics` | プロンプトから歌詞生成 |
| `/api/get` | ID指定で音楽取得 |
| `/api/get_limit` | アカウントのクォータ確認 |
| `/api/extend_audio` | 生成音声の延長 |
| `/api/generate_stems` | ボーカル/インストゥルメンタル分離 |
| `/api/get_aligned_lyrics` | 単語レベルのタイミングデータ取得 |
| `/api/concat` | 拡張セグメントの結合 |
| `/v1/chat/completions` | OpenAI互換エンドポイント |

### 非公式API認証

- Suno Webセッションのクッキーが必要（`SUNO_COOKIE`）
- 2Captcha APIキー（CAPTCHA自動解決用）
- Playwrightでブラウザ自動化

### 結論

**公式APIが未公開のため本番利用は推奨しない**。非公式ラッパーはSunoの利用規約に抵触する可能性がある。BGM生成にはBeatoven.aiを推奨。

---

## 総合比較・推奨構成

### SE（効果音）用

| API | 推奨度 | コスト | 特徴 |
|-----|--------|--------|------|
| **Freesound** | ★★★★★ | 無料（非商用）/ 要交渉（商用） | 豊富なライブラリ、CC0音源あり |
| **ElevenLabs** | ★★★★☆ | 40クレジット/秒 | テキストから生成、高品質 |
| Pixabay | ★☆☆☆☆ | - | 音声APIが未公開 |

### BGM生成用

| API | 推奨度 | コスト | 特徴 |
|-----|--------|--------|------|
| **Beatoven.ai** | ★★★★★ | $6〜20/月 | テキストからBGM生成、商用OK |
| Mubert | ★★☆☆☆ | 要問合せ | 商用制限多い、API非公開 |
| Suno | ★★☆☆☆ | - | 公式API未公開 |

### SakuEdit推奨アーキテクチャ

```
┌─────────────────────────────────┐
│         SakuEdit Editor         │
├─────────────────────────────────┤
│                                 │
│  SE（効果音）                    │
│  ├─ 第1選択: Freesound API      │ ← 既存SEライブラリ検索（CC0優先）
│  └─ 第2選択: ElevenLabs API     │ ← テキストからSE生成（カスタム用）
│                                 │
│  BGM（バックグラウンドミュージック）│
│  └─ 第1選択: Beatoven.ai API    │ ← テキストからBGM生成
│                                 │
└─────────────────────────────────┘
```

### 統合優先順位

1. **Phase 1**: Freesound API（SE検索・ダウンロード）
   - 理由: 無料、豊富なライブラリ、APIが成熟
   - 実装: Token認証 + OAuth2フロー

2. **Phase 2**: Beatoven.ai API（BGM生成）
   - 理由: テキストからBGM生成、商用OK、手頃な価格
   - 実装: APIダッシュボードで仕様確認後に統合

3. **Phase 3**: ElevenLabs Sound Effects API（カスタムSE生成）
   - 理由: テキストからSE生成可能で高品質だが、コストが高め
   - 実装: 既存のFreesoundで見つからない場合のフォールバック

### 注意事項

- Freesound: 商用利用はCC0ライセンスの音源のみ使用すること（filter=`license:"Creative Commons 0"`）
- Beatoven.ai: ストリーミングプラットフォームへの直接配信は禁止
- ElevenLabs: Freeプランは非商用のみ、商用利用にはStarterプラン以上が必要
- いずれのAPIもレスポンスのキャッシュ戦略を検討すること
