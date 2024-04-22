import { Ticket } from "../api-client/models";
import { FormField, FormSection } from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import hubspotLogo from "../../images/hubspot.svg";
import { formatDateTime } from "../utils/formatDate";

interface CICDetailProps {
  hubspotTickets: Ticket[] | null;
}

export function InstallationDetailTickets({ hubspotTickets }: CICDetailProps) {
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
                  <div>{`Last activity: ${formatDateTime(
                    ticket.hs_lastactivitydate,
                  )}`}</div>
                </div>
              ))}
          </div>
          {hubspotTickets && hubspotTickets.length === 0 && (
            <div style={{ textAlign: "center" }}>No tickets 👍</div>
          )}
        </FormField>
      </FormSection>
    </div>
  );
}
