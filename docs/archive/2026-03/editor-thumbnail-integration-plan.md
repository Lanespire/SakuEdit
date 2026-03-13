# エディタ × サムネイル統合設計プラン

> **目標**: Remotion Editor Starter風の3カラムレイアウトに段階的に移行しつつ、サムネイルAI生成機能を自然に統合する

---

## 1. レイアウト方針（Codexレビュー反映）

### Before（現状）
```
┌────────────────────────────────────────────────────┐
│ EditorHeader (名前, Undo/Redo, 保存, 書き出し)      │
├────────────────────────────────────────────────────┤
│ Upper Panel (40%)                                   │
│ ┌─────────────────────┬──────────────────────────┐ │
│ │ VideoPlayer         │ IntegratedEditorPanel     │ │
│ │                     │ (字幕/AI/チャット)         │ │
│ └─────────────────────┴──────────────────────────┘ │
├─── Separator ──────────────────────────────────────┤
│ Lower Panel (60%)                                   │
│ ┌──────────────────────────────┬─────────────────┐ │
│ │ MultiTrackTimeline           │ PropertyPanel    │ │
│ │                              │ (240px固定)       │ │
│ └──────────────────────────────┴─────────────────┘ │
│ + AddItemPanel (スライドアウト)                      │
└────────────────────────────────────────────────────┘
```

### After（Remotionスターター風 部分移行）
```
┌──────────────────────────────────────────────────────────────┐
│ EditorHeader (名前, Undo/Redo, 保存, [サムネ生成], [書き出し])│
├────────┬─────────────────────────────────────┬───────────────┤
│ Left   │ Center                              │ Right         │
│ Side   │                                     │ Inspector     │
│ bar    │ VideoPlayer (Preview)               │               │
│        │                                     │ [選択中]      │
│ [テキスト] │                                  │ [AI]          │
│ [エフェクト]│                                 │ [字幕]        │
│ [メディア] │                                  │ [見どころ]    │
│ [図形]  │                                     │ [表示]        │
│ [オーディオ]│                                 │               │
│        ├─────────────────────────────────────┤               │
│        │ MultiTrackTimeline                  │               │
│        │                                     │               │
├────────┴─────────────────────────────────────┴───────────────┘
```

### キー決定事項

| 項目 | 決定 | 理由 |
|------|------|------|
| 全面3カラム移行 | **部分移行のみ** | Preview + Timeline の縦分割は playheadSeconds 共有で崩す理由がない |
| 左サイドバー | **常設化** | AddItemPanel のスライドアウトを EditorSidebar に昇格 |
| 右パネル | **IntegratedEditorPanel + PropertyPanel を統合** | 240px固定PropertyPanelが編集面積を圧迫している |
| サムネイル配置 | **ヘッダーボタン → モーダル** | プロジェクトの公開成果物であり、編集素材ではない |

---

## 2. サムネイル統合UX

### 2.1 エントリポイント

**ヘッダーに「サムネ生成」ボタンを追加**（書き出しボタンの左隣）

```
[← プロジェクト一覧] [プロジェクト名] ... [Undo][Redo] [保存] | [🖼 サムネ生成] [📤 書き出し]
```

- クリックで `ThumbnailGeneratorModal` を開く
- Pro以上のプランでのみ有効（Freeはアップグレード誘導）

### 2.2 フレームピッカー × タイムライン連動

**常時同期はしない。3つの操作を提供：**

1. モーダルを開いた時点の playhead 位置を初期選択フレームにする
2. 「現在位置を使う」ボタン（モーダル内からタイムラインの現在位置を取得）
3. 独自シークバーでフレームを手動選択

**重要**: 無音カット適用時に timeline time ≠ source time になるため、フレーム抽出APIには必ず **source time** を渡す。既存の `mapTimelineTimeToSourceTime()` を利用。

### 2.3 書き出し後フロー

**現状の問題**: `handleExport` 成功後にすぐ `window.location.href = downloadUrl` でダウンロード開始 → サムネ生成の導線がない。

**改善案**: ExportCompleteSheet（完了シート）を表示

```
┌─────────────────────────────────────────┐
│  ✓ 書き出し完了！                        │
│                                          │
│  [📥 動画をダウンロード]                  │
│  [🖼 サムネイルを生成]  ← NEW            │
│  [📝 SRTファイルを取得]                   │
│                                          │
│                          [閉じる]         │
└─────────────────────────────────────────┘
```

---

## 3. コンポーネント設計

### 3.1 新規コンポーネント

| ファイル | 責務 |
|---------|------|
| `components/editor/EditorSidebar.tsx` | 左サイドバー（AddItemPanel の常設版） |
| `components/editor/RightInspector.tsx` | 右インスペクタ（IntegratedEditorPanel + PropertyPanel 統合） |
| `components/editor/ExportCompleteSheet.tsx` | 書き出し完了シート |
| `components/thumbnail/ThumbnailGeneratorModal.tsx` | サムネ生成モーダル（設計書通り） |
| `components/thumbnail/ThumbnailTemplateGrid.tsx` | テンプレート選択 |
| `components/thumbnail/ThumbnailUploader.tsx` | 素材アップロード |
| `components/thumbnail/ThumbnailFramePicker.tsx` | フレーム選択 |
| `components/thumbnail/ThumbnailReferenceInput.tsx` | 参考入力 |
| `components/thumbnail/ThumbnailPreviewGrid.tsx` | 結果プレビュー |
| `components/thumbnail/ThumbnailPromptInput.tsx` | プロンプト入力 |

### 3.2 既存コンポーネント変更

| ファイル | 変更 |
|---------|------|
| `app/edit/[id]/page.tsx` | レイアウト3カラム化、サムネモーダル状態管理 |
| `components/editor/EditorHeader.tsx` | サムネ生成ボタン追加 |
| `components/editor/AddItemPanel.tsx` | → EditorSidebar に移行（段階的） |
| `components/editor/IntegratedEditorPanel.tsx` | → RightInspector に統合 |
| `components/editor/PropertyPanel.tsx` | → RightInspector の「選択中」タブに統合 |

### 3.3 状態管理

**サムネイル状態は composition-store に入れない**（undo/redo対象外）

```typescript
// lib/stores/thumbnail-store.ts（新規）
interface ThumbnailStoreState {
  isGenerating: boolean
  thumbnails: GeneratedThumbnail[]
  selectedThumbnailId: string | null
  generationMode: ThumbnailMode
  prompt: string
  options: ThumbnailOptions
  // actions
  generate: (request: ThumbnailGenerateRequest) => Promise<void>
  selectThumbnail: (id: string) => Promise<void>
  reset: () => void
}
```

---

## 4. データモデル（Codex指摘反映）

### 4.1 Source of Truth 統一

**問題**: `Video.thumbnailUrl`、`ExportJob.thumbnailUrl`、`Thumbnail.isSelected` と複数箇所にサムネ情報が散在

**解決**: `Project.selectedThumbnailId` を正本にする

```prisma
model Project {
  // ... 既存フィールド
  thumbnails          Thumbnail[]
  selectedThumbnailId String?       // ← 正本: 代表サムネイルID
}
```

### 4.2 API追加

| Endpoint | 変更 |
|---------|------|
| `GET /api/projects/[id]` | レスポンスに `thumbnails[]` と `selectedThumbnailId` を追加 |
| `POST /api/thumbnail/generate` | 新規 |
| `GET /api/thumbnail/generated/[id]` | 新規 |
| `POST /api/thumbnail/[id]/select` | 新規（Project.selectedThumbnailId を更新） |
| `GET /api/thumbnail/templates` | 新規 |
| `POST /api/thumbnail/extract-frames` | 新規 |

### 4.3 課金制御

**問題**: 設計書は `monthlyThumbnailCount` を要求しているが、現コードには未実装

**対応**: Phase 1 では `hasThumbnail: boolean` で簡易ゲーティング → Phase 2 で月次カウント制御

---

## 5. 実装フェーズ

### Phase A: エディタレイアウト3カラム化（前提作業）

| Step | タスク | ファイル |
|------|--------|---------|
| A-1 | EditorSidebar 作成（AddItemPanel の常設版） | `components/editor/EditorSidebar.tsx` |
| A-2 | RightInspector 作成（IntegratedEditorPanel + PropertyPanel 統合） | `components/editor/RightInspector.tsx` |
| A-3 | EditPage レイアウト変更（3カラム化） | `app/edit/[id]/page.tsx` |
| A-4 | 旧 AddItemPanel / PropertyPanel への参照を移行 | 各コンポーネント |

### Phase B: サムネイルバックエンド

| Step | タスク | ファイル |
|------|--------|---------|
| B-1 | Prisma スキーマ: Thumbnail モデル + Project.selectedThumbnailId | `prisma/schema.prisma` |
| B-2 | マイグレーション実行 | `prisma/migrations/` |
| B-3 | `lib/ai-thumbnail.ts` (OpenRouter + Gemini 3.1 画像生成) | `lib/ai-thumbnail.ts` |
| B-4 | `lib/thumbnail-templates.ts` (テンプレート定義) | `lib/thumbnail-templates.ts` |
| B-5 | API: POST /api/thumbnail/generate | `app/api/thumbnail/generate/route.ts` |
| B-6 | API: GET /api/thumbnail/generated/[id] | `app/api/thumbnail/generated/[id]/route.ts` |
| B-7 | API: POST /api/thumbnail/[id]/select | `app/api/thumbnail/[id]/select/route.ts` |
| B-8 | API: GET /api/thumbnail/templates | `app/api/thumbnail/templates/route.ts` |
| B-9 | API: POST /api/thumbnail/extract-frames | `app/api/thumbnail/extract-frames/route.ts` |
| B-10 | GET /api/projects/[id] にサムネ情報追加 | `app/api/projects/[id]/route.ts` |

### Phase C: サムネイルフロントエンド

| Step | タスク | ファイル |
|------|--------|---------|
| C-1 | thumbnail-store (Zustand) | `lib/stores/thumbnail-store.ts` |
| C-2 | ThumbnailGeneratorModal | `components/thumbnail/ThumbnailGeneratorModal.tsx` |
| C-3 | ThumbnailTemplateGrid | `components/thumbnail/ThumbnailTemplateGrid.tsx` |
| C-4 | ThumbnailUploader | `components/thumbnail/ThumbnailUploader.tsx` |
| C-5 | ThumbnailFramePicker + source time 変換 | `components/thumbnail/ThumbnailFramePicker.tsx` |
| C-6 | ThumbnailReferenceInput | `components/thumbnail/ThumbnailReferenceInput.tsx` |
| C-7 | ThumbnailPreviewGrid | `components/thumbnail/ThumbnailPreviewGrid.tsx` |
| C-8 | ThumbnailPromptInput | `components/thumbnail/ThumbnailPromptInput.tsx` |
| C-9 | EditorHeader にサムネ生成ボタン追加 | `components/editor/EditorHeader.tsx` |
| C-10 | EditPage にモーダル接続 | `app/edit/[id]/page.tsx` |

### Phase D: 書き出し後フロー

| Step | タスク | ファイル |
|------|--------|---------|
| D-1 | ExportCompleteSheet 作成 | `components/editor/ExportCompleteSheet.tsx` |
| D-2 | handleExport 改修（ダウンロード直行 → 完了シート表示） | `app/edit/[id]/page.tsx` |
| D-3 | ダッシュボードで代表サムネ表示 | `components/ProjectsDashboardClient.tsx` |

### Phase E: 課金制御・仕上げ

| Step | タスク | ファイル |
|------|--------|---------|
| E-1 | plans.ts に hasThumbnail 追加 | `lib/plans.ts` |
| E-2 | Free プラン向けアップグレード誘導UI | `components/thumbnail/ThumbnailGeneratorModal.tsx` |
| E-3 | E2Eテスト | `tests/` |

---

## 6. リスク管理

| リスク | 対策 |
|--------|------|
| source of truth 分裂 | `Project.selectedThumbnailId` を正本にし、`Video.thumbnailUrl` は参照用 |
| フレーム抽出の時間軸ズレ | `mapTimelineTimeToSourceTime()` で source time に変換してからAPI送信 |
| 課金制御の未整合 | Phase 1 は boolean ゲーティング、Phase 2 で月次カウント |
| ダッシュボード同時更新 | Phase D-3 で代表サムネ表示を対応 |
| APIレスポンス不足 | Phase B-10 で projects API にサムネ情報追加 |
| 参考YouTuber入力 | 既存 style analysis の visualProfile を優先入力にする |

---

## 7. チーム分担（spawn-team 用）

| エージェント | 担当 Phase | 主要タスク |
|-------------|-----------|-----------|
| **layout-engineer** | Phase A | エディタ3カラム化、EditorSidebar、RightInspector |
| **backend-engineer** | Phase B | Prisma, API, ai-thumbnail.ts |
| **thumbnail-frontend** | Phase C | モーダル、サブコンポーネント、store |
| **ux-engineer** | Phase D | 書き出し完了シート、ダッシュボード連携 |
| **qa-engineer** | Phase E | 課金制御、E2Eテスト |

### 依存関係
```
Phase A (レイアウト) ─→ Phase C (サムネFE) ─→ Phase D (書き出しフロー)
                          ↑
Phase B (バックエンド) ───┘
                                                Phase E (課金・テスト)
```

Phase A と Phase B は並行実行可能。Phase C は A + B の完了後。Phase D は C の後。Phase E は最後。
