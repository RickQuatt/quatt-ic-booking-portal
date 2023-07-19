import React from "react";

export const useContextWithCheck = <T>(context: React.Context<T>) => {
  const value = React.useContext(context);

  if (value === undefined) {
    throw new Error(`The Provider for ${context.displayName} was not found`);
  }

  return value as Exclude<T, undefined>;
};
