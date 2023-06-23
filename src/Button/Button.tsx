import React from 'react'
import classNames from 'classnames'

import classes from './Button.module.css'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "danger"
}

export const Button = (props: ButtonProps) => {
  return (
    <button
      {...props}
      className={classNames(classes.button, props.color && classes[props.color])}
    />
  )
}

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  color?: "danger"
  disabled?: boolean;
}

export const ButtonLink = (props: ButtonLinkProps) => {
  return (
    <a
      {...props}
      className={classNames(classes.button, props.color && classes[props.color], props.disabled && classes.disabled)}
    />
  )
}
