import React, { useState } from "react";
import classes from "./Tooltip.module.css";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  showTooltip: boolean;
}

function Tooltip({ text, children, showTooltip }: TooltipProps) {
  const [isHoveringOver, setIsHoveringOver] = useState(false);
  const show = showTooltip && isHoveringOver;
  const toggleTooltip = () => {
    setIsHoveringOver((prevValue) => !prevValue);
  };

  return (
    <div
      className={classes["tooltip-container"]}
      onMouseEnter={toggleTooltip}
      onMouseLeave={toggleTooltip}
    >
      {children}
      {show && <span className={classes.tooltip}>{text}</span>}
    </div>
  );
}

export default Tooltip;
