import { useState, useEffect, useRef } from "react";
import { MqttDebugMessage } from "../hooks/useMqttDebugStream";
import { MessageDetail } from "./MessageDetail";
import classes from "./MessageList.module.css";

interface MessageListProps {
  messages: MqttDebugMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop } = containerRef.current;

    if (scrollTop > 100) {
      setAutoScroll(false);
    } else if (scrollTop === 0) {
      setAutoScroll(true);
    }
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessageId((prev) => (prev === messageId ? null : messageId));
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  const getDirectionInfo = (direction: "to_cloud" | "from_cloud") => {
    return direction === "to_cloud"
      ? { icon: "⬆️", label: "To Cloud", className: classes.toCloud }
      : { icon: "⬇️", label: "From Cloud", className: classes.fromCloud };
  };

  if (messages.length === 0) {
    return (
      <div className={classes.container}>
        <div className={classes.emptyState}>
          <p>No messages yet. Start streaming to see MQTT debug messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <div className={classes.headerLeft}>
          <h3>Messages ({messages.length})</h3>
          {!autoScroll && (
            <button
              className={classes.scrollToTop}
              onClick={() => {
                containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                setAutoScroll(true);
              }}
            >
              ↑ Scroll to latest
            </button>
          )}
        </div>
        <div className={classes.legend}>
          <div className={`${classes.legendItem} ${classes.toCloud}`}>
            <span>⬆️</span>
            <span>To Cloud</span>
          </div>
          <div className={`${classes.legendItem} ${classes.fromCloud}`}>
            <span>⬇️</span>
            <span>From Cloud</span>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className={classes.messageList}
        onScroll={handleScroll}
      >
        {messages.map((message) => {
          const directionInfo = getDirectionInfo(message.direction);
          const isExpanded = expandedMessageId === message.id;

          return (
            <div
              key={message.id}
              className={`${classes.message} ${directionInfo.className} ${message.isError ? classes.error : ""}`}
            >
              <div
                className={classes.messageHeader}
                onClick={() => toggleMessageExpansion(message.id)}
              >
                <div className={classes.messageInfo}>
                  <span className={classes.directionIcon}>
                    {directionInfo.icon}
                  </span>
                  <span className={classes.timestamp}>
                    [{formatTimestamp(message.timestamp)}]
                  </span>
                  <span className={classes.direction}>
                    {directionInfo.label}
                  </span>
                  <span className={classes.topic}>{message.topic}</span>
                  {message.isError && (
                    <span className={classes.errorBadge}>ERROR</span>
                  )}
                </div>
                <button className={classes.expandButton}>
                  {isExpanded ? "−" : "+"}
                </button>
              </div>

              {isExpanded && <MessageDetail message={message} />}
            </div>
          );
        })}
      </div>

      <div className={classes.footer}>
        <label className={classes.autoScrollLabel}>
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll to latest messages
        </label>
      </div>
    </div>
  );
}
