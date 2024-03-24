import classes from "./CICDetailSectionHeader.module.css";

export function DetailSectionHeader({
  title,
  logo,
}: {
  title: string;
  logo?: string;
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
      {logo && <img src={logo} alt="Logo" style={{ height: "36px" }} />}
      <h3>{title}</h3>
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
