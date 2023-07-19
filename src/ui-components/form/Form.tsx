import React from "react";

import classes from "./Form.module.css";
import { FieldError } from "react-hook-form";
import { Input, InputProps } from "../input/Input";
import { Select, SelectProps } from "../select/Select";

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
  const stringValue = typeof value === "boolean" ? String(value) : value;
  return (
    <span className={classes["form-field-value"]}>{stringValue ?? "N/A"}</span>
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

const FormFieldError = ({ children }: React.PropsWithChildren) => {
  return <div className={classes["form-field-error"]}>⚠ {children}</div>;
};

interface FormFieldInputProps extends InputProps {
  error?: FieldError;
}

export const FormFieldInput = React.forwardRef<
  HTMLInputElement,
  FormFieldInputProps
>(function FormFieldInput({ error, ...inputProps }, ref) {
  return (
    <div>
      <Input ref={ref} {...inputProps} />
      {error && <FormFieldError>{error.message}</FormFieldError>}
    </div>
  );
});

interface FormSelectProps extends SelectProps {
  error?: FieldError;
}

export const FormSelectInput = React.forwardRef<
  HTMLSelectElement,
  FormSelectProps
>(function FormSelectInput({ error, ...selectProps }, ref) {
  return (
    <div>
      <Select ref={ref} {...selectProps} />
      {error && <FormFieldError>{error.message}</FormFieldError>}
    </div>
  );
});
