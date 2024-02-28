import classes from "./Accordion.module.css";

import CaretRight from "../../assets/icons/caret-right.svg";
import classNames from "classnames";

interface AccordionProps extends React.PropsWithChildren {}

export function Accordion(props: AccordionProps) {
  return <div className={classes.accordion}>{props.children}</div>;
}

interface AccordionItemProps extends React.PropsWithChildren {
  title: string;
  additionalInfo?: string | null;
  isOpen?: boolean;
  onChangeIsOpen?: () => void;
}

export function AccordionItem({
  title,
  additionalInfo,
  isOpen = true,
  onChangeIsOpen,
  children,
}: AccordionItemProps) {
  return (
    <div className={classes["accordion-item"]}>
      <div className={classes["accordion-item-title"]} onClick={onChangeIsOpen}>
        {">"}
        <div>
          {title}
          {additionalInfo && (
            <>
              <br />
              <div>{additionalInfo}</div>
            </>
          )}
        </div>
      </div>
      <div
        className={classNames(
          classes["accordion-item-content"],
          isOpen && classes["is-open"],
        )}
      >
        {children}
      </div>
    </div>
  );
}
