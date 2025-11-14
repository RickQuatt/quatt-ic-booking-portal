import React from "react";

import classes from "./Sidebar.module.css";
import { Button } from "../ui-components/button/Button";
import classNames from "classnames";
import { Link } from "wouter";

export function Sidebar() {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <>
      <Button
        className={classNames(
          classes["toggle-sidebar-button"],
          !isOpen && classes["toggle-sidebar-button-closed"],
        )}
        onClick={() => setIsOpen((isOpen) => !isOpen)}
      >
        ☰
      </Button>
      <div
        className={classNames(
          classes.sidebar,
          !isOpen && classes["sidebar-closed"],
        )}
      >
        <div className={classes["sidebar-content"]}>
          <Link href="/dashboard" className={classes["sidebar-button"]}>
            CIC Dashboard
          </Link>
          <Link href="/cics" className={classes["sidebar-button"]}>
            CIC List
          </Link>
          <Link href="/installers" className={classes["sidebar-button"]}>
            Installers
          </Link>
          <Link href="/installations" className={classes["sidebar-button"]}>
            Installations List
          </Link>
          <Link href="/dynamic-pricing" className={classes["sidebar-button"]}>
            Dynamic Pricing
          </Link>
          <Link href="/devices" className={classes["sidebar-button"]}>
            Device List
          </Link>
          <span className={classes["sidebar-button"]}>
            {import.meta.env.ENV}
          </span>
        </div>
      </div>
    </>
  );
}
