import { Button } from "@/components/ui/Button";
import { Play, Square, Download, Trash2, Radio } from "lucide-react";

interface MqttControlsProps {
  isStreaming: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onExportMessages: () => void;
  onStartLiveView: () => void;
  messageCount: number;
}

export function MqttControls({
  isStreaming,
  onStart,
  onStop,
  onClear,
  onExportMessages,
  onStartLiveView,
  messageCount,
}: MqttControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-dark-foreground">
      <div className="flex items-center gap-2">
        {!isStreaming ? (
          <Button onClick={onStart} className="gap-2">
            <Play className="h-4 w-4" />
            Start Streaming
          </Button>
        ) : (
          <Button onClick={onStop} variant="destructive" className="gap-2">
            <Square className="h-4 w-4" />
            Stop Streaming
          </Button>
        )}
        <Button onClick={onStartLiveView} variant="outline" className="gap-2">
          <Radio className="h-4 w-4" />
          Start LiveView (30min)
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {messageCount} message{messageCount !== 1 ? "s" : ""}
        </span>
        {messageCount > 0 && (
          <>
            <Button
              onClick={onExportMessages}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export All
            </Button>
            <Button
              onClick={onClear}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
