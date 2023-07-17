import React from "react";

import classes from "./CICDetail.module.css";
import { AdminCic } from "../api-client/models";
import { CICDetailMain } from "./CICDetailMain";
import { CICDetailExtra } from "./CICDetailExtra";
import { CICDetailSide } from "./CICDetailSide";
import { CICDetailJson } from "./CICDetailJson";
import { CICDetailNetworkConnection } from "./CICDetailNetworkConnection";
import { CICDetailBoilerInfo } from "./CICDetailBoilerInfo";
import { CICDetailThermostatInfo } from "./CICDetailThermostatInfo";
import { CICDetailHouseInfo } from "./CICDetailHouseInfo";
import { ButtonLink } from "../ui-components/button/Button";
import { Link } from "wouter";

interface CICDetailProps {
  data: AdminCic;
}

export function CICDetail({ data }: CICDetailProps) {
  const cicData = data;

  return (
    <div className={classes["detail-sections"]}>
      <div className={classes["detail-sections-left"]}>
        <CICDetailMain cicData={cicData} />
        <CICDetailNetworkConnection cicData={cicData} />
        <CICDetailBoilerInfo cicData={cicData} />
        <CICDetailThermostatInfo cicData={cicData} />
        <CICDetailHouseInfo cicData={cicData} />
        <CICDetailExtra cicData={cicData} />
        <CICDetailJson cicData={cicData} />
      </div>
      <div className={classes["detail-sections-right"]}>
        <CICDetailSide cicData={cicData} />
      </div>
      <BackButton />
    </div>
  );
}

function BackButton() {
  return (
    <Link href={`/cics`} className={classes['back-button']}>
      <ButtonLink className={classes['back-button']}>← Back to list</ButtonLink>
    </Link>
  )
}
