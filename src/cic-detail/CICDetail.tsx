import React from "react";

import classes from "./CICDetail.module.css";
import { AdminCic } from "../api-client/models";
import { CICDetailMain } from "./CICDetailMain";
import { CICDetailExtra } from "./CICDetailExtra";
import { CICDetailSide } from "./CICDetailSide";

interface CICDetailProps {
  data: AdminCic;
}

export function CICDetail({ data }: CICDetailProps) {
  const cicData = data;

  return (
    <div className={classes["detail-sections"]}>
      <div className={classes["detail-sections-left"]}>
        <CICDetailMain cicData={cicData} />
        <CICDetailExtra cicData={cicData} />
      </div>
      <div className={classes["detail-sections-right"]}>
        <CICDetailSide cicData={cicData} />
      </div>
    </div>
  );
}
