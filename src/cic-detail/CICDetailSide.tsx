import { AdminCic } from "../api-client/models";
import { Button, ButtonLink } from "../ui-components/button/Button";
import { FormField, FormFieldTitle, FormFieldValue, FormSection } from "../ui-components/form/Form";
import { useModalState } from "../ui-components/modal/useModalState";
import { AdvancedSettingsModal } from "./AdvancedSettingsModal";
import classes from "./CICDetail.module.css";
import { getGrafanaLink, getHubspotSearchOrderLink, getMenderLink } from "./getLinks";

export function CICDetailSide({
  cicData
}: {
  cicData: AdminCic
}) {
  const {
    isOpen: isAdvancedSettingsModalOpen,
    open: openAdvancedSettingsModal,
    close: closeAdvancedSettingsModal,
  } = useModalState();

  return (
    <div className={classes["detail-section"]}>
      <AdvancedSettingsModal
        isOpen={isAdvancedSettingsModalOpen}
        closeModal={closeAdvancedSettingsModal}
        cicId={cicData.id}
        cicData={cicData}
      />
      <FormSection>
        <ButtonLink
          href={
            cicData.orderNumber
              ? getHubspotSearchOrderLink(cicData.orderNumber)
              : undefined
          }
          target="_blank"
          disabled={!cicData.orderNumber}
        >
          Hubspot Search Order
        </ButtonLink>
        <ButtonLink href={getMenderLink(cicData.id)} target="_blank">
          Mender
        </ButtonLink>
        <ButtonLink href={getGrafanaLink(cicData.id)} target="_blank">
          Grafana
        </ButtonLink>
        <FormField>
          <FormFieldTitle>Supervisory Control Mode</FormFieldTitle>
          <FormFieldValue value={cicData.supervisoryControlMode} />
        </FormField>
        <Button color="danger" onClick={openAdvancedSettingsModal}>
          Advanced settings
        </Button>
      </FormSection>
    </div>
  );
}