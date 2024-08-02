import classes from "./ErrorText.module.css";

interface ErrorTextProps {
  text: string;
  error: unknown;
}

function ErrorText({ text, error }: ErrorTextProps) {
  return (
    <div className={classes["error-text-container"]}>
      <p>{text}</p>
      <p>{JSON.stringify(error)}</p>
    </div>
  );
}

export default ErrorText;
