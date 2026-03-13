'use client'

interface EditorHeaderProps {
  projectName: string
  isEditingName: boolean
  editNameValue: string
  isSaving: boolean
  isExporting: boolean
  lastSavedText: string
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSaveDraft: () => void
  onOpenExport: () => void
  onOpenThumbnailModal?: () => void
  onGoToProjects: () => void
  onStartEditingName: () => void
  onNameValueChange: (value: string) => void
  onFinishEditingName: () => void
  onCancelEditingName: () => void
}

function ToolbarIconButton({
  title,
  disabled = false,
  onClick,
  icon,
}: {
  title: string
  disabled?: boolean
  onClick: () => void
  icon: string
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-md border border-transparent transition-colors ${
        disabled
          ? 'cursor-not-allowed text-white/20'
          : 'text-white/72 hover:border-white/10 hover:bg-white/8 hover:text-white'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  )
}

export default function EditorHeader({
  projectName,
  isEditingName,
  editNameValue,
  isSaving,
  isExporting,
  lastSavedText,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveDraft,
  onOpenExport,
  onOpenThumbnailModal,
  onGoToProjects,
  onStartEditingName,
  onNameValueChange,
  onFinishEditingName,
  onCancelEditingName,
}: EditorHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#4a3428] bg-[#1d1612] px-2">
      <div className="flex items-center gap-1.5">
        <ToolbarIconButton title="プロジェクト一覧" onClick={onGoToProjects} icon="folder_open" />

        <div className="mx-1 h-5 w-px bg-white/10" />

        <div className="flex items-center gap-1">
          <div className="flex size-8 items-center justify-center rounded-md bg-white/6 text-primary">
            <span className="material-symbols-outlined text-[18px]">movie_edit</span>
          </div>

          {isEditingName ? (
            <input
              type="text"
              value={editNameValue}
              onChange={(event) => onNameValueChange(event.target.value)}
              onBlur={onFinishEditingName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onFinishEditingName()
                if (event.key === 'Escape') onCancelEditingName()
              }}
              className="w-[220px] rounded-md border border-white/15 bg-white/8 px-2 py-1 text-sm text-white outline-none focus:border-primary"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={onStartEditingName}
              className="max-w-[220px] rounded-md px-2 py-1 text-sm font-medium text-white/88 transition-colors hover:bg-white/6 hover:text-white"
              title={projectName}
            >
              <span className="block truncate">{projectName}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <ToolbarIconButton title="元に戻す" disabled={!canUndo} onClick={onUndo} icon="undo" />
        <ToolbarIconButton title="やり直し" disabled={!canRedo} onClick={onRedo} icon="redo" />
        <ToolbarIconButton title="下書き保存" onClick={onSaveDraft} icon="save" />

        <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

        <div className="hidden items-center gap-1 rounded-md bg-white/6 px-2 py-1 text-[11px] text-white/52 sm:flex">
          <span className="material-symbols-outlined text-[14px]">{isSaving ? 'sync' : 'cloud_done'}</span>
          <span>{lastSavedText}</span>
        </div>

        {onOpenThumbnailModal && (
          <button
            type="button"
            onClick={onOpenThumbnailModal}
            className="flex h-9 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            data-test-id="thumbnail-generate-button"
          >
            <span className="material-symbols-outlined text-[16px]">image</span>
            <span className="hidden sm:inline">サムネ生成</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenExport}
          disabled={isExporting}
          className="ml-1 flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          data-test-id="main-export-button"
        >
          <span className={`material-symbols-outlined text-[16px] ${isExporting ? 'animate-spin' : ''}`}>
            {isExporting ? 'sync' : 'download'}
          </span>
          <span className="hidden sm:inline">{isExporting ? '書き出し中' : '書き出し'}</span>
        </button>
      </div>
    </header>
  )
}
