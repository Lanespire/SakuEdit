import { Search, AlertCircle } from "lucide-react";

interface MediaEmptyStateProps {
  type: 'no-adaptors' | 'no-results' | 'initial';
  mediaType: string; // e.g., "videos", "images"
  activeTabName?: string;
}

/**
 * MediaEmptyState - Shared empty state component
 * 
 * Provides consistent empty state messaging and styling across all media panels.
 * Handles different types of empty states with appropriate icons and messages.
 */
export const MediaEmptyState: React.FC<MediaEmptyStateProps> = ({
  type,
  mediaType,
  activeTabName,
}) => {
  const mediaTypeLabel =
    mediaType === 'videos'
      ? '動画'
      : mediaType === 'images'
        ? '画像'
        : mediaType === 'audio'
          ? '音声'
          : mediaType;

  if (type === 'no-adaptors') {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-center">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>{mediaTypeLabel} は利用できません</p>
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-center">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>
          {mediaTypeLabel} が見つかりません
          {activeTabName ? ` (${activeTabName})` : ""}
        </p>
        <p className="text-sm mt-1">別の検索語を試してください</p>
      </div>
    );
  }

  // Initial state
  return (
    <div className="flex flex-col font-extralight items-center justify-center py-8 text-muted-foreground text-center">
      <Search className="h-8 w-8 mb-2" />
      <p className="text-sm text-center">
        検索して {mediaTypeLabel} を探してください
      </p>
      <p className="text-xs text-center mt-1">
        上の入力欄にキーワードを入力します
      </p>
    </div>
  );
}; 
