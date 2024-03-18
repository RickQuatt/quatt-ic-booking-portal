import classes from "./CICDetailSectionHeader.module.css";

export function DetailSectionHeader({ title }: { title: string }) {
  return (
    <div className={classes["detail-section-header"]}>
      <h3>{title}</h3>
      <hr />
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
