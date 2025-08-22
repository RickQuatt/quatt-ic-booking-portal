import { useState, useMemo } from "react";
import { MqttDebugMessage } from "../hooks/useMqttDebugStream";
import classes from "./MessageDetail.module.css";

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

  const formattedPayload = useMemo(() => {
    const formatPayload = (payload: unknown): string => {
      if (typeof payload === "string") {
        try {
          return JSON.stringify(JSON.parse(payload), null, 2);
        } catch {
          return payload;
        }
      }
      return JSON.stringify(payload, null, 2);
    };

    return formatPayload(message.payload);
  }, [message.payload]);

  return (
    <div className={classes.detail}>
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <h4>Message Details</h4>
        </div>
        <div className={classes.grid}>
          <div className={classes.field}>
            <label>CIC ID:</label>
            <span className={classes.value}>{message.cicId}</span>
            <button
              className={classes.copyButton}
              onClick={() => copyToClipboard(message.cicId, "CIC ID")}
              title="Copy CIC ID"
            >
              📋
            </button>
          </div>
          <div className={classes.field}>
            <label>Direction:</label>
            <span
              className={`${classes.value} ${classes.direction} ${message.direction === "to_cloud" ? classes.toCloud : classes.fromCloud}`}
            >
              {message.direction === "to_cloud"
                ? "🔄 To Cloud"
                : "⬇️ From Cloud"}
            </span>
          </div>
          <div className={classes.field}>
            <label>Timestamp:</label>
            <span className={classes.value}>
              {new Date(message.timestamp).toLocaleString()}
            </span>
          </div>
          <div className={classes.field}>
            <label>Topic:</label>
            <span className={`${classes.value} ${classes.topic}`}>
              {message.topic}
            </span>
            <button
              className={classes.copyButton}
              onClick={() => copyToClipboard(message.topic, "Topic")}
              title="Copy Topic"
            >
              📋
            </button>
          </div>
        </div>
      </div>

      {message.isError && message.errorDetails && (
        <div className={classes.section}>
          <div className={classes.sectionHeader}>
            <h4 className={classes.errorHeader}>Error Details</h4>
          </div>
          <div className={classes.errorContent}>
            <pre className={classes.errorText}>{message.errorDetails}</pre>
          </div>
        </div>
      )}

      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <h4>Payload</h4>
          <div className={classes.payloadActions}>
            <button
              className={classes.copyButton}
              onClick={() => copyToClipboard(formattedPayload, "Payload")}
              title="Copy Payload"
            >
              📋 Copy
            </button>
          </div>
        </div>
        <div className={classes.payloadContent}>
          <pre className={classes.payload}>{formattedPayload}</pre>
        </div>
      </div>

      {copySuccess && (
        <div className={classes.copyNotification}>
          ✅ {copySuccess} copied to clipboard
        </div>
      )}
    </div>
  );
}
