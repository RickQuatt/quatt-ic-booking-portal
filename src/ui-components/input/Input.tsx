import React from "react";
import classes from "./Input.module.css";

export interface InputProps extends React.ComponentPropsWithRef<"input"> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function FormFieldInput(inputProps, ref) {
    return <input className={classes.input} ref={ref} {...inputProps} />;
  },
);
