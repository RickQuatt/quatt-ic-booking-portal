import {
  AdminInstallationDetail,
  InstallationType,
} from "../api-client/models";
import { isEmpty } from "lodash-es";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { formatDateDistance, formatDateTimeString } from "../utils/formatDate";
import { Link } from "wouter";

const installationTypeMap: {
  [key in InstallationType]: string;
} = {
  [InstallationType.Hybrid]: "Quatt Hybrid",
  [InstallationType.HybridDuo]: "Quatt Hybrid Duo",
  [InstallationType.AllElectric]: "Quatt All Electric",
  [InstallationType.AllElectricDuo]: "Quatt All Electric Duo",
  [InstallationType.HomeBattery]: "Home Battery",
  [InstallationType.Unknown]: "Unknown",
};

export function InstallationDetailExtraInformation({
  installation,
}: {
  installation: AdminInstallationDetail;
}) {
  const {
    activeCic,
    quattBuild,
    installedAt,
    lastConnectionStatusUpdatedAt,
    heatDeliverySystems,
    hwid,
    odu1Type,
    odu2Type,
  } = installation;

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="🔍 Extra information" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Active CIC</FormFieldTitle>
          <Link href={`/cics/${activeCic}`}>{activeCic}</Link>
        </FormField>
        <FormField>
          <FormFieldTitle>
            Installation Database ID (Not For Customers)
          </FormFieldTitle>
          <FormFieldValue value={installation.id} />
        </FormField>
        <FormField>
          <FormFieldTitle>Quatt build</FormFieldTitle>
          <FormFieldValue value={quattBuild} />
        </FormField>
        <FormField>
          <FormFieldTitle>Hwid (CIC hardware revision id)</FormFieldTitle>
          <FormFieldValue value={hwid} />
        </FormField>
        <FormField>
          <FormFieldTitle>ODU 1 Type</FormFieldTitle>
          <FormFieldValue value={odu1Type} />
        </FormField>
        {odu2Type && (
          <FormField>
            <FormFieldTitle>ODU 2 Type</FormFieldTitle>
            <FormFieldValue value={odu2Type} />
          </FormField>
        )}
        <FormField>
          <FormFieldTitle>Last connection</FormFieldTitle>
          <FormFieldValue
            value={formatDateDistance(lastConnectionStatusUpdatedAt)}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Installation date</FormFieldTitle>
          <FormFieldValue
            value={
              installedAt
                ? formatDateTimeString(installedAt.toISOString())
                : "N/A"
            }
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Installation type</FormFieldTitle>
          <FormFieldValue
            value={installationTypeMap[installation.installationType]}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Heating systems</FormFieldTitle>
          {!isEmpty(heatDeliverySystems)
            ? heatDeliverySystems?.map((system, index) => (
                <FormFieldValue value={system} key={index} />
              ))
            : "No known heating systems"}
        </FormField>
      </FormSection>
    </div>
  );
}
