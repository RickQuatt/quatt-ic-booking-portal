import { useState, useMemo } from "react";
import { ThemedJsonView } from "@/components/shared/ThemedJsonView";
import { MqttDebugMessage } from "../hooks/useMqttDebugStream";
import { formatBytes } from "@/utils/formatBytes";
import { Button } from "@/components/ui/Button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageDetailProps {
  message: MqttDebugMessage;
}

export function MessageDetail({ message }: MessageDetailProps) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const parsedPayload = useMemo(() => {
    const parsePayload = (payload: unknown): unknown => {
      if (typeof payload === "string") {
        try {
          return JSON.parse(payload);
        } catch {
          return payload;
        }
      }
      return payload;
    };
    return parsePayload(message.payload);
  }, [message.payload]);

  const formattedPayload = useMemo(() => {
    if (typeof parsedPayload === "string") {
      return parsedPayload;
    }
    return JSON.stringify(parsedPayload, null, 2);
  }, [parsedPayload]);

  const CopyButton = ({ text, label }: { text: string; label: string }) => {
    const isCopied = copySuccess === label;
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => copyToClipboard(text, label)}
        className="h-6 w-6"
        title={`Copy ${label}`}
      >
        {isCopied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-4 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* Message Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Message Details
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              copyToClipboard(
                `CIC ID: ${message.cicId}\nDirection: ${message.direction === "to_cloud" ? "To Cloud" : "From Cloud"}\nTimestamp: ${new Date(message.timestamp).toLocaleString()}\nTopic: ${message.topic}\nMessage Size: ${formatBytes(message.messageSize || 0)}`,
                "All Details",
              )
            }
            className="gap-2"
          >
            <Copy className="h-3 w-3" />
            Copy All
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Device & Topic Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-dark-foreground">
            <h5 className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
              Device & Topic
            </h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  CIC ID:
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs font-medium text-gray-900 dark:text-gray-100">
                    {message.cicId}
                  </span>
                  <CopyButton text={message.cicId} label="CIC ID" />
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Topic:
                </span>
                <div className="flex items-center gap-1">
                  <span className="break-all font-mono text-xs font-medium text-gray-900 dark:text-gray-100">
                    {message.topic}
                  </span>
                  <CopyButton text={message.topic} label="Topic" />
                </div>
              </div>
            </div>
          </div>

          {/* Message Info Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-dark-foreground">
            <h5 className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
              Message Info
            </h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Direction:
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    message.direction === "to_cloud"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-green-600 dark:text-green-400",
                  )}
                >
                  {message.direction === "to_cloud"
                    ? "⬆️ To Cloud"
                    : "⬇️ From Cloud"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Timestamp:
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {new Date(message.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Size:
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {formatBytes(message.messageSize || 0)}
                  </span>
                  <CopyButton
                    text={formatBytes(message.messageSize || 0)}
                    label="Message Size"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Details */}
      {message.isError && message.errorDetails && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
          <h4 className="mb-2 text-sm font-semibold text-red-900 dark:text-red-100">
            Error Details
          </h4>
          <pre className="overflow-x-auto text-xs text-red-800 dark:text-red-200">
            {message.errorDetails}
          </pre>
        </div>
      )}

      {/* Payload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Payload
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(formattedPayload, "Payload")}
            className="gap-2"
          >
            <Copy className="h-3 w-3" />
            Copy
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-dark-foreground">
          {typeof parsedPayload === "string" ? (
            <pre className="font-mono text-xs text-gray-900 dark:text-gray-100">
              {parsedPayload}
            </pre>
          ) : parsedPayload !== null && typeof parsedPayload === "object" ? (
            <ThemedJsonView
              value={parsedPayload}
              collapsed={false}
              displayDataTypes={false}
              enableClipboard={true}
              onCopied={() => {
                setCopySuccess("JSON Value");
                setTimeout(() => setCopySuccess(null), 2000);
              }}
            />
          ) : (
            <pre className="font-mono text-xs text-gray-900 dark:text-gray-100">
              {String(parsedPayload)}
            </pre>
          )}
        </div>
      </div>

      {/* Copy Success Notification */}
      {copySuccess && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800 shadow-lg dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <Check className="h-4 w-4" />
          {copySuccess} copied to clipboard
        </div>
      )}
    </div>
  );
}
