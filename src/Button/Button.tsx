
import React from 'react'

import classes from './Button.module.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {

}

export const Button = (props: ButtonProps) => {
  return (
    <button
      {...props}
      className={classes.button}
    />
  )
}

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {

}

export const ButtonLink = (props: ButtonLinkProps) => {
  return (
    <a
      {...props}
      className={classes.button}
    />
  )
}
