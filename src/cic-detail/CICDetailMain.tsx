import { AdminCic } from "../api-client/models";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";
import { formatDate, formatDateDistance } from "../utils/formatDate";
import { DetailSectionHeader } from "./CICDetailSectionHeader";
import { Link } from "wouter";

export function CICDetailMain({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="Main CIC details" />
      <FormSection>
        <FormField>
          <FormFieldTitle>ID</FormFieldTitle>
          <FormFieldValue value={cicData.id} />
        </FormField>
        <FormField>
          <FormFieldTitle>Installation</FormFieldTitle>
          <Link href={`/installations/${cicData.installationUuid}`}>
            {cicData.installationId}
          </Link>
        </FormField>
        <FormField>
          <FormFieldTitle>Order number</FormFieldTitle>
          <FormFieldValue value={cicData.orderNumber} />
        </FormField>
        <FormField>
          <FormFieldTitle>Quatt build</FormFieldTitle>
          <FormFieldValue value={cicData.quattBuild} />
        </FormField>
        <FormField>
          <FormFieldTitle>Hwid (CIC hardware revision id)</FormFieldTitle>
          <FormFieldValue value={cicData.hwid} />
        </FormField>
        <FormField>
          <FormFieldTitle>Last connection status updated at</FormFieldTitle>
          <FormFieldValue
            value={formatDateDistance(cicData.lastConnectionStatusUpdatedAt)}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Status</FormFieldTitle>
          <FormFieldValue value={cicData.status} />
        </FormField>
        <FormField>
          <FormFieldTitle>Mender ID</FormFieldTitle>
          <FormFieldValue value={cicData.menderId} />
        </FormField>
        <FormField>
          <FormFieldTitle>Number of heat pumps</FormFieldTitle>
          <FormFieldValue value={cicData.numberOfHeatPumps} />
        </FormField>
        <FormField>
          <FormFieldTitle>Created at</FormFieldTitle>
          <FormFieldValue value={formatDate(cicData.createdAt)} />
        </FormField>
        {cicData.hasSoundSlider ? (
          <>
            <FormField>
              <FormFieldTitle>Day max sound level</FormFieldTitle>
              <FormFieldValue value={cicData.dayMaxSoundLevel} />
            </FormField>
            <FormField>
              <FormFieldTitle>Night max sound level</FormFieldTitle>
              <FormFieldValue value={cicData.nightMaxSoundLevel} />
            </FormField>
          </>
        ) : (
          <FormField>
            <FormFieldTitle>Silent mode status</FormFieldTitle>
            <FormFieldValue value={cicData.silentMode} />
          </FormField>
        )}
      </FormSection>
    </div>
  );
}
