import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import QRCode from "react-qr-code";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";

export function InstallationDetailCICQR({ cicId }: { cicId: string }) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="📷 CIC QR" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Active CIC</FormFieldTitle>
          <FormFieldValue value={cicId} />
        </FormField>
        <QRCode
          size={156}
          style={{
            height: "auto",
            maxWidth: "80%",
            width: "80%",
            margin: "0 auto",
          }}
          value={"https://app.quatt.io/cic/" + cicId}
          viewBox={`0 0 256 256`}
        />
      </FormSection>
    </div>
  );
}
