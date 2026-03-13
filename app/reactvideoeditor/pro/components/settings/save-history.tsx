import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent } from "../ui/card";
import { Trash2, RefreshCw, Download, FileVideo2, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";
import { getAllAutosaves, clearAutosave } from "../../utils/general/indexdb-helper";
import { useEditorContext } from "../../contexts/editor-context";

interface SaveRecord {
  id: string;
  editorState: any;
  timestamp: number;
}

/**
 * Save History Component
 * 
 * Displays a simplified table of autosave records from IndexedDB
 */
export const SaveHistory: React.FC = () => {
  const [saveRecords, setSaveRecords] = useState<SaveRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get context functions to restore state
  const { setOverlays, setAspectRatio, setPlaybackRate } = useEditorContext();

  const loadSaveHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await getAllAutosaves();
      setSaveRecords(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存履歴の読み込みに失敗しました');
      console.error('Error loading save history:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSave = async (record: SaveRecord) => {
    try {
      const { editorState } = record;
      
      // Apply the loaded state to the editor
      if (editorState.overlays && setOverlays) {
        setOverlays(editorState.overlays);
      }
      if (editorState.aspectRatio && setAspectRatio) {
        setAspectRatio(editorState.aspectRatio);
      }
      if (editorState.playbackRate && setPlaybackRate) {
        setPlaybackRate(editorState.playbackRate);
      }
      
      console.log('Loaded save from:', new Date(record.timestamp));
    } catch (err) {
      console.error('Error loading save:', err);
      setError('保存データの読み込みに失敗しました');
    }
  };

  const deleteSave = async (projectId: string) => {
    try {
      await clearAutosave(projectId);
      await loadSaveHistory();
    } catch (err) {
      console.error('Error deleting save:', err);
      setError('保存データの削除に失敗しました');
    }
  };

  const clearAllSaves = async () => {
    try {
      await Promise.all(saveRecords.map(record => clearAutosave(record.id)));
      await loadSaveHistory();
    } catch (err) {
      console.error('Error clearing all saves:', err);
      setError('保存履歴の一括削除に失敗しました');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    // For recent saves, use relative time
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: ja });
    }
    
    // For older saves, use formatted date
    return format(date, 'yyyy/MM/dd HH:mm', { locale: ja });
  };

  // Load save history on component mount
  useEffect(() => {
    loadSaveHistory();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extralight">保存履歴</h3>
        <div className="flex items-center gap-1">
          {saveRecords.length > 0 && (
            <Button
              onClick={clearAllSaves}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
              title="保存履歴をすべて削除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            onClick={loadSaveHistory}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="h-7 w-7 p-0"
            title="再読み込み"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-2.5">
            <div className="text-xs text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>保存履歴を読み込み中...</span>
          </div>
        </div>
      ) : saveRecords.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center text-center space-y-1.5">
              <FileVideo2 className="h-8 w-8 text-muted-foreground/40" />
              <div className="text-xs text-muted-foreground">
                保存履歴はまだありません
              </div>
              <div className="text-[11px] text-muted-foreground/60">
                自動保存されたプロジェクトがここに表示されます
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-52">
          <div className="rounded-md border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 text-muted-foreground font-extralight">比率</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-extralight">保存日時</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-extralight w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                {saveRecords.map((record) => (
                  <tr key={`${record.id}-${record.timestamp}`} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5">
                      {record.editorState.aspectRatio || '不明'}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatTimestamp(record.timestamp)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          onClick={() => loadSave(record)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary font-extralight"
                          title="この保存を読み込む"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => deleteSave(record.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive font-extralight"
                          title="この保存を削除"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}; 
