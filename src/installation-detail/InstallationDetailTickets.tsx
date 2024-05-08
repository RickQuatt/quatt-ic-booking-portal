import { useQuery } from "react-query";
import { Ticket } from "../api-client/models";
import hubspotLogo from "../../images/hubspot.svg";
import { formatDateTime } from "../utils/formatDate";
import { useApiClient } from "../api-client/context";
import classes from "./InstallationDetail.module.css";
import { Loader } from "../ui-components/loader/Loader";
import { FormField, FormSection } from "../ui-components/form/Form";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";

interface CICDetailProps {
  installationId: string;
}

export function InstallationDetailTickets({ installationId }: CICDetailProps) {
  const apiClient = useApiClient();

  const { data: hubspotData, status: hubspotStatus } = useQuery(
    ["installationHubspotTickets", installationId],
    () => {
      return apiClient.adminGetInstallationTickets({
        installationId: installationId,
      });
    },
  );

  const hubspotTickets = hubspotData?.result;

  const getTicketOwner = (ticket: Ticket | null): string => {
    return [
      ticket?.hubspot_owner_id.firstname,
      ticket?.hubspot_owner_id.lastname,
    ]
      .join(" ")
      .trim();
  };

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader logo={hubspotLogo} title="Tickets" />
      <FormSection>
        <FormField>
          <div className={classes["detail-section-api-cards"]}>
            {hubspotStatus === "error" && (
              <div style={{ textAlign: "center" }}>No tickets 👍</div>
            )}
            {hubspotStatus === "loading" ? (
              <Loader />
            ) : (
              <>
                {hubspotTickets &&
                  hubspotTickets.map((ticket) => (
                    <div
                      style={{ cursor: "pointer" }}
                      className={classes["detail-section"]}
                      key={ticket.hs_object_id}
                      onClick={() =>
                        window.open(
                          `https://app-eu1.hubspot.com/contacts/25848718/record/0-5/${ticket.hs_object_id}`,
                        )
                      }
                    >
                      <div className={classes["detail-section-bold"]}>
                        {ticket.subject}
                      </div>
                      <div>{`Owner: ${getTicketOwner(ticket)}`}</div>
                      <div>{`Status: ${ticket.hs_pipeline_stage.label}`}</div>
                      <div>{`Created at: ${formatDateTime(
                        ticket.createdate,
                      )}`}</div>
                    </div>
                  ))}
                {hubspotTickets && hubspotTickets.length === 0 && (
                  <div style={{ textAlign: "center" }}>No tickets 👍</div>
                )}
              </>
            )}
          </div>
        </FormField>
      </FormSection>
    </div>
  );
}
