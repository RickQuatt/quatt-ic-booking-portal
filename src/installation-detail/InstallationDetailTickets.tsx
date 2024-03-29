import { Ticket } from "../api-client/models";
import { FormField, FormSection } from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import hubspotLogo from "../../images/hubspot.svg";
import { formatDateTimeString } from "../utils/formatDate";

interface CICDetailProps {
  hubsoptTickets: Ticket[] | null;
}

const fakeTickets = [
  {
    subject: "QUATT3674,noodnummer, systeem gaat niet aan,",
    hubspot_owner_id: "Xander Homan",
    hs_pipeline_stage: "Solved ✅ (→Send Survey)",
    hs_object_id: "2032777464",
    hs_lastactivitydate: "2023-11-20T22:09:21.000Z",
  },
  {
    subject:
      "Quatt3674 - Quatt systeem doet het niet. Krijgt de CV niet aan. Geen CV, geen warm water",
    hubspot_owner_id: "Ricardo Dijksteel",
    hs_pipeline_stage: "Closed (No Survey) ❌",
    hs_object_id: "2085067254",
    hs_lastactivitydate: "2023-12-02T12:06:32.674Z",
  },
];

export function InstallationDetailTickets({ hubsoptTickets }: CICDetailProps) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader logo={hubspotLogo} title="Tickets" />
      <FormSection>
        <FormField>
          <div className={classes["detail-section-api-cards"]}>
            {fakeTickets &&
              fakeTickets.map((ticket) => (
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
                  <div>{`Owner: ${ticket.hubspot_owner_id}`}</div>
                  <div>{`Status: ${ticket.hs_pipeline_stage}`}</div>
                  <div>{`Last activity: ${formatDateTimeString(
                    ticket.hs_lastactivitydate,
                  )}`}</div>
                </div>
              ))}
          </div>
          {fakeTickets && fakeTickets.length === 0 && (
            <div style={{ textAlign: "center" }}>No tickets 👍</div>
          )}
        </FormField>
      </FormSection>
    </div>
  );
}
