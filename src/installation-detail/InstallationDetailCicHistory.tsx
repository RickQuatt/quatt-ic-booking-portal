import { AdminInstallationDetail } from "../api-client/models";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { formatDateTime } from "../utils/formatDate";
import {
  TBody,
  THead,
  Table,
  Td,
  TdText,
  Th,
  Tr,
} from "../ui-components/table/Table";

export function InstallationDetailCicHistory({
  installation,
}: {
  installation: AdminInstallationDetail;
}) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="🕐 CIC history" />
      {installation.cicState && (
        <div className={classes["detail-section-table"]}>
          <Table gridClass={classes["table-grid-cic-history"]}>
            <THead>
              <Tr>
                <Th>
                  <TdText>CIC</TdText>
                </Th>
                <Th>
                  <TdText>Starts at</TdText>
                </Th>
              </Tr>
            </THead>
            <TBody>
              {installation.cicState.map((state, index) => (
                <Tr key={index}>
                  <Td>
                    <TdText>{state.cicId}</TdText>
                  </Td>
                  <Td>
                    <TdText>{formatDateTime(state.startAt)}</TdText>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
