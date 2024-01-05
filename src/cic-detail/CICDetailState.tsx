import { AdminCic } from "../api-client/models";
import {
  TBody,
  THead,
  Table,
  Td,
  TdText,
  Th,
  Tr,
} from "../ui-components/table/Table";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";
import { formatDate } from "../utils/formatDate";

export function CICDetailState({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="State history" />
      {cicData.stateHistory && (
        <div className={classes["detail-section-table"]}>
          <Table gridClass={classes["table-grid"]}>
            <THead>
              <Tr>
                <Th>
                  <TdText>Starts at</TdText>
                </Th>
                <Th>
                  <TdText>Status</TdText>
                </Th>
              </Tr>
            </THead>
            <TBody>
              {cicData.stateHistory.map((state) => (
                <Tr>
                  <Td>
                    <TdText>{formatDate(state.startAt)}</TdText>
                  </Td>
                  <Td>
                    <TdText>{state.status}</TdText>
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
