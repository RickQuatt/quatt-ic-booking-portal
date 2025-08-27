import { useState, useEffect, useRef, useCallback } from "react";
import { auth } from "../../firebase";

export interface MqttDebugMessage {
  id: string;
  direction: "to_cloud" | "from_cloud";
  cicId: string;
  topic: string;
  payload: unknown;
  timestamp: string;
  isError?: boolean;
  errorDetails?: string;
}

export interface SSEMessage {
  type: "connection" | "mqtt-debug" | "heartbeat" | "error";
  message?: string;
  timestamp: string;
  data?: {
    direction: "to_cloud" | "from_cloud";
    cicId: string;
    topic: string;
    payload: unknown;
    timestamp: string;
    isError?: boolean;
    errorDetails?: string;
  };
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

interface UseMqttDebugStreamOptions {
  cicId: string;
  enabled?: boolean;
}

interface UseMqttDebugStreamReturn {
  messages: MqttDebugMessage[];
  connectionStatus: ConnectionStatus;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
}

const MAX_MESSAGES = 1000;

export function useMqttDebugStream({
  cicId,
  enabled = false,
}: UseMqttDebugStreamOptions): UseMqttDebugStreamReturn {
  const [messages, setMessages] = useState<MqttDebugMessage[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<{ close: () => void | Promise<void> } | null>(
    null,
  );
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageIdCounter = useRef(0);
  const isStreamActiveRef = useRef(false);

  const addMessage = useCallback((message: MqttDebugMessage) => {
    setMessages((prev) => {
      const newMessages = [message, ...prev];
      return newMessages.slice(0, MAX_MESSAGES);
    });
  }, []);

  const connect = useCallback(async () => {
    if (eventSourceRef.current || !cicId) return;

    try {
      setConnectionStatus("connecting");
      setError(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      const baseUrl = import.meta.env.VITE_API_BASE_PATH as string;
      const url = `${baseUrl}/admin/mqtt-debug/stream?cicId=${encodeURIComponent(cicId)}`;

      // Use fetch with ReadableStream for SSE with authentication
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        // No timeout for SSE - we want persistent connections
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      setConnectionStatus("connected");
      setError(null);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      isStreamActiveRef.current = true;

      // Store reader reference for cleanup
      eventSourceRef.current = {
        close: () => {
          isStreamActiveRef.current = false;
          return reader.cancel();
        },
      };

      let buffer = "";

      const readStream = async () => {
        try {
          while (isStreamActiveRef.current) {
            let readResult;
            try {
              readResult = await reader.read();
            } catch (readError) {
              if (!isStreamActiveRef.current) {
                // Stream was intentionally closed, don't treat as error
                break;
              }
              throw readError;
            }

            const { done, value } = readResult;

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete lines from buffer
            const lines = buffer.split("\n");
            // Keep the last line in buffer if it doesn't end with newline
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = line.slice(6); // Remove 'data: ' prefix
                  if (data.trim() === "") continue; // Skip empty data

                  const sseMessage: SSEMessage = JSON.parse(data);

                  if (sseMessage.type === "mqtt-debug" && sseMessage.data) {
                    const message: MqttDebugMessage = {
                      id: `${++messageIdCounter.current}`,
                      direction: sseMessage.data.direction,
                      cicId: sseMessage.data.cicId,
                      topic: sseMessage.data.topic,
                      payload: sseMessage.data.payload,
                      timestamp: sseMessage.data.timestamp,
                      isError: sseMessage.data.isError,
                      errorDetails: sseMessage.data.errorDetails,
                    };
                    addMessage(message);
                  } else if (sseMessage.type === "error") {
                    setError(sseMessage.message || "Unknown error occurred");
                  }
                } catch (parseError) {
                  console.error(
                    "Failed to parse SSE message:",
                    parseError,
                    "Data:",
                    line,
                  );
                }
              }
            }
          }
        } catch (streamError) {
          // Don't treat intentional stream closure as error
          if (!isStreamActiveRef.current) {
            return;
          }

          console.error("Stream reading error:", streamError);

          // Better error message based on error type
          let errorMessage = "Connection lost. Retrying...";
          if (
            streamError instanceof TypeError &&
            streamError.message.includes("Load failed")
          ) {
            errorMessage = "Network connection failed. Retrying...";
          } else if (
            streamError instanceof DOMException &&
            streamError.name === "AbortError"
          ) {
            errorMessage = "Connection aborted. Retrying...";
          }

          setConnectionStatus("error");
          setError(errorMessage);

          // Clean up current connection properly
          if (eventSourceRef.current) {
            try {
              await eventSourceRef.current.close();
            } catch (closeError) {
              console.debug("Error closing stream during cleanup:", closeError);
            }
            eventSourceRef.current = null;
          }

          // Auto-reconnect after 3 seconds if still enabled
          if (enabled && isStreamActiveRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, 3000);
          }
        }
      };

      readStream();
    } catch (err) {
      setConnectionStatus("error");

      // Provide better error messages based on error type
      let errorMessage = "Failed to connect";
      if (err instanceof TypeError && err.message.includes("Load failed")) {
        errorMessage = "Network error - please check your connection";
      } else if (err instanceof DOMException && err.name === "AbortError") {
        errorMessage = "Connection timeout - server may be unavailable";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Clear the stream reference on connection error
      eventSourceRef.current = null;
    }
  }, [cicId, enabled, addMessage]);

  const disconnect = useCallback(async () => {
    isStreamActiveRef.current = false;

    if (eventSourceRef.current) {
      try {
        await eventSourceRef.current.close();
      } catch (closeError) {
        // Ignore close errors - stream might already be closed
        console.debug("Stream close error (ignored):", closeError);
      }
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnectionStatus("disconnected");
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (enabled && connectionStatus === "disconnected") {
      connect();
    } else if (!enabled && connectionStatus !== "disconnected") {
      disconnect();
    }
  }, [enabled, connect, disconnect, connectionStatus]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    connectionStatus,
    error,
    connect,
    disconnect,
    clearMessages,
  };
}
