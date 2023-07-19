import React from "react";

export const useModalState = (defaultState?: boolean) => {
  const [isOpen, setIsOpen] = React.useState(() => {
    return defaultState ?? false;
  });

  const toggleIsOpen = React.useCallback(() => {
    setIsOpen((isOpen) => !isOpen);
  }, []);

  const open = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, toggleIsOpen, open, close };
};
