import React, { useEffect, useState } from "react";
import { Button } from "../button/Button";
import classNames from "classnames";

import classes from "./EmergencyButton.module.css";
import Tooltip from "../tooltip/Tooltip";

export type NuclearButtonProps = {
  label?: string;
  buttonText?: string;
  successMessage?: string;
  enabled?: boolean;
  onEnable: () => Promise<{ success: boolean }>;
  onDisable: () => Promise<{ success: boolean }>;
  disabled?: boolean;
  isPolling?: boolean;
  pollingMessage?: string;
};

const EmergencyButton = ({
  label = "Emergency Backup Heating",
  buttonText = "Enable Emergency Backup Heating",
  successMessage = "Emergency Backup Heating Enabled",
  enabled,
  disabled,
  onDisable,
  onEnable,
  isPolling = false,
  pollingMessage = "Waiting for confirmation...",
}: NuclearButtonProps) => {
  const [isCoverOpen, setIsCoverOpen] = useState(enabled);
  const [isPressed, setIsPressed] = useState(enabled);

  const handleToggleCover = () => {
    setIsCoverOpen(!isCoverOpen);
    if (isPressed) {
      setIsPressed(false);
    }
  };

  const handleButtonPress = async () => {
    if (isCoverOpen && !isPressed) {
      const { success } = await onEnable();
      if (success) {
        setIsPressed(true);
        return;
      }
      alert("Failed to enable emergency backup heating");
    }
  };

  const handleDisable = async () => {
    const { success } = await onDisable();

    if (success) {
      setIsPressed(false);
      setIsCoverOpen(false);
      return;
    }
    alert("Failed to disable emergency backup heating");
  };

  useEffect(() => {
    if (enabled) {
      setIsPressed(true);
      setIsCoverOpen(true);
    } else {
      setIsPressed(false);
      setIsCoverOpen(false);
    }
  }, [enabled]);
  return (
    <div className={classes.container}>
      <h2 className={classes.header}>{label}</h2>

      <div className={classes.buttonContainer}>
        {/* Base Platform */}
        <div className={classes.basePlatform}></div>

        {/* Button with hazard stripes border */}
        <div className={classes.hazardBorder}>
          <button
            className={classNames(
              classes.button,
              isPressed && classes.buttonPressed,
            )}
            onClick={async () => await handleButtonPress()}
            disabled={!isCoverOpen || disabled}
            style={{
              cursor: isCoverOpen && !disabled ? "pointer" : "not-allowed",
            }}
          >
            <span className={classes.buttonText}>{buttonText}</span>
          </button>
        </div>

        {/* Safety Cover */}
        <div
          className={classNames(
            classes.safetyCover,
            isCoverOpen && classes.safetyCoverOpen,
          )}
          onClick={handleToggleCover}
        >
          {/* Hinge mechanism */}
          <div className={classes.hinge}>
            <div className={classes.hingeBolt}></div>
            <div className={classes.hingeBolt}></div>
            <div className={classes.hingeBolt}></div>
            <div className={classes.hingeBolt}></div>
          </div>

          <div className={classes.coverContent}>
            <span className={classes.coverText}>SAFETY COVER</span>
            <div className={classes.coverButton}>FLIP OPEN</div>
          </div>
        </div>
      </div>

      <div className={classes.statusMessage}>
        {isPolling ? (
          <p className={classes.pollingMessage}>{pollingMessage}</p>
        ) : isPressed ? (
          <p className={classes.alertMessage}>{successMessage}</p>
        ) : (
          <p className={classes.normalMessage}>
            {isCoverOpen
              ? "Safety disengaged. Ready to enable backup. Click cover to close."
              : "Safety cover engaged. Click to open."}
          </p>
        )}
      </div>
      {enabled && (
        <Tooltip
          text={!enabled ? "Emergency backup heating is disabled" : ""}
          showTooltip={!enabled}
        >
          <Button
            onClick={handleDisable}
            disabled={!enabled || isPolling || disabled}
          >
            {isPolling
              ? "Waiting for confirmation..."
              : "Disable Emergency Backup Heating"}
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

export default EmergencyButton;
