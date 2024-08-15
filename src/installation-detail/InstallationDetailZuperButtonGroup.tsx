import { ZuperService } from "../api-client/models";
import { getZuperJobLink } from "../cic-detail/getLinks";
import { ButtonLink } from "../ui-components/button/Button";

export function InstallationDetailZuperButtonGroup({
  zuperInstallationJobs,
  isLoadingJobs,
}: {
  zuperInstallationJobs?: ZuperService[];
  isLoadingJobs: boolean;
}) {
  const hasZuperInstallationJobs =
    zuperInstallationJobs && zuperInstallationJobs.length > 0;

  if (isLoadingJobs) {
    return <ButtonLink disabled>Loading Zuper jobs...</ButtonLink>;
  }

  return (
    <>
      {hasZuperInstallationJobs ? (
        zuperInstallationJobs.map(({ job_uid, job_category_name }) => (
          <ButtonLink
            key={job_uid}
            href={getZuperJobLink(job_uid)}
            target="_blank"
          >
            {`Zuper - ${job_category_name}`}
          </ButtonLink>
        ))
      ) : (
        <ButtonLink disabled>Zuper - No installation jobs</ButtonLink>
      )}
    </>
  );
}
