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

      // Store reader reference for cleanup
      eventSourceRef.current = { close: () => reader.cancel() };

      const readStream = async () => {
        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

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
                  console.error("Failed to parse SSE message:", parseError);
                }
              }
            }
          }
        } catch (streamError) {
          console.error("Stream reading error:", streamError);
          setConnectionStatus("error");
          setError("Connection lost. Retrying...");

          // Auto-reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (enabled) {
              connect();
            }
          }, 3000);
        }
      };

      readStream();
    } catch (err) {
      setConnectionStatus("error");
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [cicId, enabled, addMessage]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
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
