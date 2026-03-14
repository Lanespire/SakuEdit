import * as React from "react";
import {
  Film,
  Music,
  Type,
  Subtitles,
  ImageIcon,
  FolderOpen,
  Sticker,
  Layout,
  ChevronsLeft,
  Settings,
} from "lucide-react";

// Import OverlayType directly from types to avoid export issues
import { OverlayType } from "../../types";

// Import hooks and contexts directly
import { useEditorSidebar } from "../../contexts/sidebar-context";
import { useEditorContext } from "../../contexts/editor-context";

// Import overlay panels directly
import { VideoOverlayPanel } from "../overlay/video/video-overlay-panel";
import { TextOverlaysPanel } from "../overlay/text/text-overlays-panel";
import SoundsOverlayPanel from "../overlay/sounds/sounds-overlay-panel";
import { CaptionsOverlayPanel } from "../overlay/captions/captions-overlay-panel";
import { ImageOverlayPanel } from "../overlay/images/image-overlay-panel";
import { LocalMediaPanel } from "../overlay/local-media/local-media-panel";
import { StickersPanel } from "../overlay/stickers/stickers-panel";
import { TemplateOverlayPanel } from "../overlay/templates/template-overlay-panel";
import { SettingsPanel } from "../settings/settings-panel";

// Import UI components directly
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";

interface DefaultSidebarProps {
  /** Custom logo element to display in the header */
  logo?: React.ReactNode;
  /** Footer text to display at the bottom of the sidebar */
  footerText?: string;
  /** Array of overlay types to disable/hide from the sidebar */
  disabledPanels?: OverlayType[];
  /** Whether to show icon titles in the sidebar */
  showIconTitles?: boolean;
}

const DEFAULT_SIDEBAR_WIDTH = 448;

/**
 * DefaultSidebar Component
 *
 * A dual-sidebar layout component for the video editor application.
 * Consists of two parts:
 * 1. A narrow icon-based sidebar on the left for main navigation
 * 2. A wider content sidebar that displays the active panel's content
 *
 * @component
 */
export const DefaultSidebar: React.FC<DefaultSidebarProps> = ({
  logo,
  disabledPanels = [],
  showIconTitles = false,
}) => {
  const { activePanel, setActivePanel, setIsOpen } = useEditorSidebar();
  const { open, width: sidebarWidth, setWidth } = useSidebar();
  const { setSelectedOverlayId, selectedOverlayId, overlays } = useEditorContext();
  const [isResizingSidebar, setIsResizingSidebar] = React.useState(false);
  const resizeStartXRef = React.useRef(0);
  const resizeStartWidthRef = React.useRef(sidebarWidth);

  React.useEffect(() => {
    if (!isResizingSidebar) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - resizeStartXRef.current;
      setWidth(resizeStartWidthRef.current + deltaX);
    };

    const stopResizing = () => {
      setIsResizingSidebar(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizingSidebar, setWidth]);

  const handleResizeStart = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!open) {
        return;
      }

      event.preventDefault();
      resizeStartXRef.current = event.clientX;
      resizeStartWidthRef.current = sidebarWidth;
      setIsResizingSidebar(true);
    },
    [open, sidebarWidth]
  );

  const handleResizeReset = React.useCallback(() => {
    setWidth(DEFAULT_SIDEBAR_WIDTH);
  }, [setWidth]);

  // Get the selected overlay to check its type
  const selectedOverlay = selectedOverlayId !== null 
    ? overlays.find(overlay => overlay.id === selectedOverlayId) 
    : null;

  // Only show back button if there's a selected overlay AND it matches the active panel type
  const shouldShowBackButton = selectedOverlay && selectedOverlay.type === activePanel;
  
  const getPanelTitle = (type: OverlayType): string => {
    switch (type) {
      case OverlayType.VIDEO:
        return "動画";
      case OverlayType.TEXT:
        return "テキスト";
      case OverlayType.SOUND:
        return "音声";
      case OverlayType.CAPTION:
        return "字幕";
      case OverlayType.IMAGE:
        return "画像";
      case OverlayType.LOCAL_DIR:
        return "アップロード";
      case OverlayType.STICKER:
        return "ステッカー";
      case OverlayType.TEMPLATE:
        return "テンプレート";
      case OverlayType.SETTINGS:
        return "設定";
      default:
        return "不明";
    }
  };

  const navigationItems = [
    {
      title: getPanelTitle(OverlayType.VIDEO),
      url: "#",
      icon: Film,
      panel: OverlayType.VIDEO,
      type: OverlayType.VIDEO,
    },
    {
      title: getPanelTitle(OverlayType.TEXT),
      url: "#",
      icon: Type,
      panel: OverlayType.TEXT,
      type: OverlayType.TEXT,
    },
    {
      title: getPanelTitle(OverlayType.SOUND),
      url: "#",
      icon: Music,
      panel: OverlayType.SOUND,
      type: OverlayType.SOUND,
    },
    {
      title: getPanelTitle(OverlayType.CAPTION),
      url: "#",
      icon: Subtitles,
      panel: OverlayType.CAPTION,
      type: OverlayType.CAPTION,
    },
    {
      title: getPanelTitle(OverlayType.IMAGE),
      url: "#",
      icon: ImageIcon,
      panel: OverlayType.IMAGE,
      type: OverlayType.IMAGE,
    },
    {
      title: getPanelTitle(OverlayType.STICKER),
      url: "#",
      icon: Sticker,
      panel: OverlayType.STICKER,
      type: OverlayType.STICKER,
    },
    {
      title: getPanelTitle(OverlayType.LOCAL_DIR),
      url: "#",
      icon: FolderOpen,
      panel: OverlayType.LOCAL_DIR,
      type: OverlayType.LOCAL_DIR,
    },
    {
      title: getPanelTitle(OverlayType.TEMPLATE),
      url: "#",
      icon: Layout,
      panel: OverlayType.TEMPLATE,
      type: OverlayType.TEMPLATE,
    },
  ].filter((item) => !disabledPanels.includes(item.type));

  /**
   * Renders the appropriate panel component based on the active panel selection
   * @returns {React.ReactNode} The component corresponding to the active panel
   */
  const renderActivePanel = () => {
    switch (activePanel) {
      case OverlayType.TEXT:
        return <TextOverlaysPanel />;
      case OverlayType.SOUND:
        return <SoundsOverlayPanel />;
      case OverlayType.VIDEO:
        return <VideoOverlayPanel />;
      case OverlayType.CAPTION:
        return <CaptionsOverlayPanel />;
      case OverlayType.IMAGE:
        return <ImageOverlayPanel />;
      case OverlayType.STICKER:
        return <StickersPanel />;
      case OverlayType.LOCAL_DIR:
        return <LocalMediaPanel />;
      case OverlayType.TEMPLATE:
        return <TemplateOverlayPanel />;
      case OverlayType.SETTINGS:
        return <SettingsPanel />;
      default:
        return null;
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}
    >
      {/* First sidebar */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r border-border "
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:pb-4 md:pt-4 ">
                <a href="#">
                  <div className="flex aspect-square size-9 items-center justify-center rounded-lg">
                    {logo || (
                      <img
                        src="/logo.svg"
                        alt="SakuEdit ロゴ"
                        width={27}
                        height={27}
                      />
                    )}
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="border-t border-border">
          <SidebarGroup className="pt-3">
            {navigationItems.map((item) => (
              <TooltipProvider key={item.title} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => {
                        setActivePanel(item.panel);
                        setIsOpen(true);
                      }}
                      size="lg"
                      className="flex flex-col items-center gap-2 px-1.5 py-2.5"
                      data-active={activePanel === item.panel}
                    >
                      <item.icon className="h-4 w-4" strokeWidth={1.25} />
                      {showIconTitles && (
                        <span className="text-[8px] leading-none">
                          {item.title}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-border  ">
          <SidebarMenu>
            <div className="flex items-center justify-center">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => {
                        setActivePanel(OverlayType.SETTINGS);
                        setIsOpen(true);
                      }}
                      size="lg"
                      className="flex flex-col items-center gap-2 px-1.5 py-2.5"
                      data-active={activePanel === OverlayType.SETTINGS}
                    >
                      <Settings className="h-4 w-4" strokeWidth={1.25} />
                      {showIconTitles && (
                        <span className="text-[8px] leading-none">
                          設定
                        </span>
                      )}
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">設定</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Second sidebar */}
      <Sidebar collapsible="none" className="relative hidden min-w-0 flex-1 bg-background md:flex">
      <SidebarHeader className="gap-3.5 border-b border-border px-4 py-3">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <h3 className="font-extralight text-sidebar-foreground">
                {activePanel ? getPanelTitle(activePanel) : ""} 
              </h3>
              {shouldShowBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedOverlayId(null)}
                  aria-label="一覧に戻る"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </SidebarHeader>
        <div
          aria-label="サイドバー幅を調整"
          className="absolute inset-y-0 right-0 z-20 hidden w-2 cursor-ew-resize md:block"
          onMouseDown={handleResizeStart}
          onDoubleClick={handleResizeReset}
          title="ドラッグで幅調整 / ダブルクリックで初期化"
        >
          <div
            className={`mx-auto h-full w-px transition-colors ${
              isResizingSidebar ? "bg-primary" : "bg-border"
            }`}
          />
        </div>
        <SidebarContent className="min-w-0 bg-background px-2 pt-1 pr-3">
          {renderActivePanel()}
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
};
