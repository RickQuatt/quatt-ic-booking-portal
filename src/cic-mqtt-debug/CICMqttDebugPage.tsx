import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AdminCic } from "../api-client/models";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { MessageList } from "./components/MessageList";
import { MqttControls } from "./components/MqttControls";
import { useMqttDebugStream } from "./hooks/useMqttDebugStream";
import classes from "./CICMqttDebugPage.module.css";

interface CICMqttDebugPageProps {
  data: AdminCic;
}

export function CICMqttDebugPage({ data: { id } }: CICMqttDebugPageProps) {
  const [isStreamEnabled, setIsStreamEnabled] = useState(false);

  const { messages, connectionStatus, error, clearMessages } =
    useMqttDebugStream({
      cicId: id,
      enabled: isStreamEnabled,
    });

  const handleStart = () => {
    setIsStreamEnabled(true);
    // connect() will be called automatically by the hook's useEffect
  };

  const handleStop = () => {
    setIsStreamEnabled(false);
    // disconnect() will be called automatically by the hook's useEffect
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
    <div className={classes.page}>
      <div className={classes.header}>
        <h2>
          MQTT Debugger -{" "}
          <Link href={`/cics/${id}`} className={classes.cicIdLink}>
            {id}
          </Link>
        </h2>
        <ConnectionStatus status={connectionStatus} error={error} />
      </div>

      <MqttControls
        isStreaming={isStreamEnabled}
        onStart={handleStart}
        onStop={handleStop}
        onClear={clearMessages}
        onExportMessages={handleExportMessages}
        messageCount={messages.length}
      />

      <MessageList messages={messages} />
    </div>
  );
}
