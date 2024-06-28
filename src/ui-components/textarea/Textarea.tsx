import React from "react";
import classes from "./Textarea.module.css";

export interface TextareaProps
  extends React.ComponentPropsWithRef<"textarea"> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function FormFieldTextarea(inputProps, ref) {
    return <textarea className={classes.textarea} ref={ref} {...inputProps} />;
  },
);
