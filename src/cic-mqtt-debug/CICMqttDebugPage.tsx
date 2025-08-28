import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Auto-start streaming when component mounts
    handleStart();
  }, []);

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <h2>MQTT Debugger - {id}</h2>
        <ConnectionStatus status={connectionStatus} error={error} />
      </div>

      <MqttControls
        isStreaming={isStreamEnabled}
        onStart={handleStart}
        onStop={handleStop}
        onClear={clearMessages}
        messageCount={messages.length}
      />

      <MessageList messages={messages} />
    </div>
  );
}
