import React from "react";
import classes from "./Select.module.css";

export interface SelectProps extends React.ComponentPropsWithRef<"select"> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(selectProps, ref) {
    return (
      <div className={classes.select}>
        <select ref={ref} {...selectProps}>
          {selectProps.children}
        </select>
      </div>
    );
  },
);
