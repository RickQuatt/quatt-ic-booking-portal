import { QueryObserverResult } from "@tanstack/react-query";
import classes from "./ErrorText.module.css";
import { ResponseError } from "../../api-client/runtime";

interface ErrorTextProps {
  text: string;
  error?: unknown;
  retry?: () => Promise<QueryObserverResult<unknown, Error>>;
}

function ErrorText({ text, error, retry }: ErrorTextProps) {
  let errorString = JSON.stringify(error);

  if (error instanceof ResponseError) {
    errorString = `Error status: ${error.response.status} - ${error.response.statusText}`;
  }

  return (
    <div className={classes["error-text-container"]}>
      <p>{text}</p>
      {!!error && <p>{errorString}</p>}
      {retry && <button onClick={retry}>Retry</button>}
    </div>
  );
}

export default ErrorText;
