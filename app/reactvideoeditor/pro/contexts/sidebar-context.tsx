import React, { createContext, useContext, useState } from "react";
import { OverlayType } from "../types";
import { useSidebar } from "../components/ui/sidebar";

// SakuEdit custom panel types (beyond standard RVE OverlayType)
export const SakuEditPanel = {
  SUBTITLE: 'sakuedit-subtitle' as const,
  CUT: 'sakuedit-cut' as const,
  STYLE: 'sakuedit-style' as const,
  AUDIO: 'sakuedit-audio' as const,
  AI: 'sakuedit-ai' as const,
}

export type SidebarPanelType = OverlayType | typeof SakuEditPanel[keyof typeof SakuEditPanel]

// Define the shape of our context data
type EditorSidebarContextType = {
  activePanel: SidebarPanelType; // Stores the currently active panel name
  setActivePanel: (panel: SidebarPanelType) => void; // Function to update the active panel
  setIsOpen: (open: boolean) => void;
};

// Create the context with undefined as initial value
const EditorSidebarContext = createContext<EditorSidebarContextType | undefined>(undefined);

// Custom hook to consume the editor sidebar context
export const useEditorSidebar = () => {
  const context = useContext(EditorSidebarContext);

  if (!context) {
    throw new Error("useEditorSidebar must be used within a SidebarProvider");
  }

  return context;
};

// Provider component that wraps parts of the app that need access to sidebar state
export const SidebarProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [activePanel, setActivePanel] = useState<SidebarPanelType>(OverlayType.VIDEO);
  const uiSidebar = useSidebar();

  const setIsOpen = (open: boolean) => {
    uiSidebar.setOpen(open);
  };

  const value = {
    activePanel,
    setActivePanel,
    setIsOpen,
  };

  return (
    <EditorSidebarContext.Provider value={value}>{children}</EditorSidebarContext.Provider>
  );
}; 