import { useState } from "react";
import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import { darkTheme } from "@uiw/react-json-view/dark";
import { Maximize2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface ThemedJsonViewProps {
  value: object | undefined;
  collapsed?: boolean | number;
  displayDataTypes?: boolean;
  displayObjectSize?: boolean;
  enableClipboard?: boolean;
  style?: React.CSSProperties;
  onCopied?: (text: string, node?: object) => void;
  showFullscreenButton?: boolean;
  title?: string;
}

export function ThemedJsonView({
  value,
  collapsed = 2,
  displayDataTypes = false,
  displayObjectSize = false,
  enableClipboard = true,
  style,
  onCopied,
  showFullscreenButton = true,
  title = "JSON View",
}: ThemedJsonViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const themeStyles = isDark ? darkTheme : lightTheme;

  if (value === undefined) {
    return null;
  }

  const baseStyle = {
    ...themeStyles,
    backgroundColor: "transparent",
    fontSize: "12px",
    lineHeight: "1.4",
    fontFamily: "monospace",
  };

  return (
    <div className="relative">
      {showFullscreenButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-1 right-0 z-10 h-7 w-7 opacity-60 hover:opacity-100"
          onClick={() => setIsFullscreen(true)}
          title="Open fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}

      <JsonView
        value={value}
        style={{ ...baseStyle, ...style }}
        collapsed={collapsed}
        displayDataTypes={displayDataTypes}
        displayObjectSize={displayObjectSize}
        enableClipboard={enableClipboard}
        onCopied={onCopied}
      />

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="flex h-[100vh] w-[100vw] max-w-none flex-col bg-white dark:bg-dark-foreground">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <JsonView
              value={value}
              style={{ ...baseStyle, fontSize: "13px" }}
              displayDataTypes={displayDataTypes}
              displayObjectSize={displayObjectSize}
              enableClipboard={enableClipboard}
              onCopied={onCopied}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
