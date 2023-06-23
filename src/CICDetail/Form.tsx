import React from "react";

import classes from "./Form.module.css";
import { FieldError } from "react-hook-form";

export function FormSection({ children }: React.PropsWithChildren) {
  return <div className={classes["form-section"]}>{children}</div>;
}

export function FormField({ children }: React.PropsWithChildren) {
  return <div className={classes["form-field"]}>{children}</div>;
}

export function FormFieldTitle({ children }: React.PropsWithChildren) {
  return <span className={classes["form-field-title"]}>{children}</span>;
}

type FormFieldValueProps = {
  value?: string | number | boolean | null;
};
export function FormFieldValue({ value }: FormFieldValueProps) {
  return (
    <span className={classes["form-field-value"]}>{value ?? "N/A"}</span>
  );
}

type FormFieldJsonProps = {
  value?: object;
};
export function FormFieldJson({ value }: FormFieldJsonProps) {
  return (
    <pre className={classes["form-field-json"]}>
      <code>{JSON.stringify(value, null, 4)}</code>
    </pre>
  );
}

interface FormFieldInputProps extends React.ComponentPropsWithRef<"input"> {
  error?: FieldError;
}

export const FormFieldInput = React.forwardRef<
  HTMLInputElement,
  FormFieldInputProps
>(function FormFieldInput(
  { error, ...inputProps },
  ref
) {
  return (
    <>
      <input
        className={classes["form-field-input"]}
        ref={ref}
        {...inputProps}
      />
      {error && <p>{error.message}</p>}
    </>
  );
});

interface FormSelectProps extends React.ComponentPropsWithRef<"select"> {
  error?: FieldError;
}


export const FormSelectInput = React.forwardRef<
  HTMLSelectElement,
  FormSelectProps
>(function FormSelectInput(
  { error, children, ...selectProps },
  ref
) {
  return (
    <>
      <select ref={ref} {...selectProps}>
        {children}
      </select>
      {error && <p>{error.message}</p>}
    </>
  );
});