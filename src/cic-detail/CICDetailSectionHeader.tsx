import { CircleButton } from "../ui-components/button/Button";
import classes from "./CICDetailSectionHeader.module.css";

export function DetailSectionHeader({
  title,
  logo,
  onClick,
}: {
  title: string;
  logo?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={classes["detail-section-header"]}
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "1rem",
        borderBottom: "1px solid #737373",
      }}
    >
      {logo && <img src={logo} alt="Logo" style={{ height: "28px" }} />}
      <h3>{title}</h3>
      {onClick && <CircleButton text="+" onClick={onClick} />}
    </div>
  );
}

export function DetailSubSectionHeader({ title }: { title: string }) {
  return (
    <div className={classes["detail-sub-section-header"]}>
      <h4>{title}</h4>
      <hr />
    </div>
  );
}
