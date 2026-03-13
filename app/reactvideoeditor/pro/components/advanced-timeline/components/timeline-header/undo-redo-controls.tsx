import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/app/reactvideoeditor/pro/components/ui/button';

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="flex items-center gap-1 border-r border-border pr-3 mr-2">
      <Button
        onClick={onUndo}
        disabled={!canUndo}
        variant="link"
        size="icon"
        className="h-8 w-8"
        title="元に戻す (Ctrl/Cmd + Z)"
        aria-label="直前の操作を元に戻す"
        onTouchStart={(e) => e.preventDefault()}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <Undo2 className="w-4 h-4 text-text-secondary" />
      </Button>
      
      <Button
        onClick={onRedo}
        disabled={!canRedo}
        variant="link"
        size="icon"
        className="h-8 w-8 text-text-secondary"
        title="やり直す (Ctrl/Cmd + Shift + Z)"
        aria-label="直前に戻した操作をやり直す"
        onTouchStart={(e) => e.preventDefault()}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <Redo2 className="w-4 h-4" />
      </Button>
    </div>
  );
}; 
