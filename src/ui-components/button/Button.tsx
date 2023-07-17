import React from 'react'
import classNames from 'classnames'

import classes from './Button.module.css'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "danger"
}

export const Button = ({
  color,
  type="button",
  ...restProps
}: ButtonProps) => {
  return (
    <button
      {...restProps}
      type={type}
      className={classNames(classes.button, color && classes[color])}
    />
  )
}

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  color?: "danger"
  disabled?: boolean;
}

export const ButtonLink = ({
  color,
  disabled,
  className,
  ...restProps
}: ButtonLinkProps) => {
  return (
    <a
      {...restProps}
      className={classNames(
        classes.button,
        color && classes[color],
        disabled && classes.disabled,
        className
      )}
    />
  );
};
