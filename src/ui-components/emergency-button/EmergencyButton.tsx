import React, { useState } from "react";
import { Button } from "../button/Button";
import classNames from "classnames";

import classes from "./EmergencyButton.module.css";

export type NuclearButtonProps = {
  label?: string;
  buttonText?: string;
  successMessage?: string;
  enabled?: boolean;
  onEnable?: () => void;
  onReset?: () => void;
};

const EmergencyButton = ({
  label = "Emergency Backup Heating",
  buttonText = "Enable Emergency Backup Heating",
  successMessage = "Emergency Backup Heating Enabled",
  enabled = true,
}: NuclearButtonProps) => {
  const [isCoverOpen, setIsCoverOpen] = useState(enabled);
  const [isPressed, setIsPressed] = useState(enabled);

  const handleToggleCover = () => {
    setIsCoverOpen(!isCoverOpen);
    if (isPressed) {
      setIsPressed(false);
    }
  };

  const handleButtonPress = () => {
    if (isCoverOpen && !isPressed) {
      setIsPressed(true);
    }
  };

  const handleReset = () => {
    setIsCoverOpen(false);
    setIsPressed(false);
  };

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
            onClick={handleButtonPress}
            disabled={!isCoverOpen}
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
        {isPressed ? (
          <p className={classes.alertMessage}>{successMessage}</p>
        ) : (
          <p className={classes.normalMessage}>
            {isCoverOpen
              ? "Safety disengaged. Ready to enable backup. Click cover to close."
              : "Safety cover engaged. Click to open."}
          </p>
        )}
      </div>

      <Button onClick={handleReset}>Reset Emergency Backup Heating</Button>
    </div>
  );
};

export default EmergencyButton;
