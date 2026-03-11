import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import type { components } from "@/openapi-client/types/api/v1";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { MessageList } from "./components/MessageList";
import { MqttControls } from "./components/MqttControls";
import { useMqttDebugStream } from "./hooks/useMqttDebugStream";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";
import { $api } from "@/openapi-client/context";
import { toast } from "@/lib/toast";

type AdminCic = components["schemas"]["AdminCic"];

interface MQTTDebuggerPageProps {
  data: AdminCic;
}

/**
 * MQTT Debugger Page
 * Real-time MQTT message streaming and debugging interface for CICs
 */
export function MQTTDebuggerPage({ data: { id } }: MQTTDebuggerPageProps) {
  const [isStreamEnabled, setIsStreamEnabled] = useState(false);

  const { messages, connectionStatus, error, clearMessages } =
    useMqttDebugStream({
      cicId: id,
      enabled: isStreamEnabled,
    });

  const sendCommandMutation = $api.useMutation(
    "post",
    "/admin/cic/{cicId}/command",
  );

  const handleStartLiveView = useCallback(async () => {
    try {
      await sendCommandMutation.mutateAsync({
        params: { path: { cicId: id } },
        body: { type: "startLiveView" },
      });
      toast.success("Live view command sent successfully (30 minutes)");
    } catch {
      toast.error("Failed to start live view session.");
    }
  }, [id, sendCommandMutation]);

  const handleStart = () => {
    setIsStreamEnabled(true);
  };

  const handleStop = () => {
    setIsStreamEnabled(false);
  };

  const handleExportMessages = () => {
    if (messages.length === 0) return;

    const exportData = messages.map((message) => ({
      timestamp: message.timestamp,
      direction: message.direction,
      topic: message.topic,
      payload: message.payload,
      isError: message.isError,
      id: message.id,
      messageSize: message.messageSize,
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `mqtt-debug-${id}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Auto-start streaming when component mounts
    handleStart();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href={`/cics/${id}`}>
                <a className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                  <ArrowLeft className="h-4 w-4" />
                  Back to CIC
                </a>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                MQTT Debugger
              </h1>
              <Link href={`/cics/${id}`}>
                <a className="rounded-md bg-gray-100 px-2 py-1 font-mono text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-dark-foreground dark:text-gray-100 dark:hover:bg-gray-700">
                  {id}
                </a>
              </Link>
            </div>
            <ConnectionStatus status={connectionStatus} error={error} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="animate"
        className="container mx-auto px-4 py-6"
      >
        <div className="space-y-6">
          <MqttControls
            isStreaming={isStreamEnabled}
            onStart={handleStart}
            onStop={handleStop}
            onClear={clearMessages}
            onExportMessages={handleExportMessages}
            onStartLiveView={handleStartLiveView}
            messageCount={messages.length}
          />

          <MessageList messages={messages} />
        </div>
      </motion.div>
    </div>
  );
}
