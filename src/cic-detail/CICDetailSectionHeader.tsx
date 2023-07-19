import classes from "./CICDetailSectionHeader.module.css";

export function CICDetailSectionHeader({ title }: { title: string }) {
  return (
    <div className={classes["detail-section-header"]}>
      <h3>{title}</h3>
      <hr />
    </div>
  );
}
