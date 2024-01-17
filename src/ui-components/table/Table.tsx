import classNames from "classnames";
import classes from "./Table.module.css";

export function Table(
  props: React.PropsWithChildren<{
    gridClass: string;
  }>,
) {
  return (
    <table className={classNames(classes.table, props.gridClass)}>
      {props.children}
    </table>
  );
}

export function THead(props: React.PropsWithChildren) {
  return <thead className={classes.thead}>{props.children}</thead>;
}

export function TBody(props: React.PropsWithChildren) {
  return <tbody className={classes.tbody}>{props.children}</tbody>;
}

export function Tr(props: React.PropsWithChildren) {
  return <tr className={classes.tr}>{props.children}</tr>;
}

export function Th(props: React.PropsWithChildren) {
  return <th className={classes.th}>{props.children}</th>;
}

export function Td(
  props: React.PropsWithChildren<{
    noSidePadding?: boolean;
  }>,
) {
  return <td className={classes.td}>{props.children}</td>;
}

export function TdText(props: React.PropsWithChildren<{ color?: "danger" }>) {
  return (
    <span
      title={props.children as string}
      className={classNames(
        classes["tdh-text"],
        props.color && classes[props.color],
      )}
    >
      {props.children}
    </span>
  );
}
