import React, { useMemo } from "react";

import {
  AdminInstallationDetail,
  BaseCommissioningTest,
  BaseCommissioningTestStatusEnum,
  CommissioningStatusEnum,
  GetInstallerInstallationLatestCommissioning200Response,
} from "../api-client/models";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { useApiClient } from "../api-client/context";
import { useMutation, useQuery } from "@tanstack/react-query";
import ErrorText from "../ui-components/error-text/ErrorText";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
  FormFieldDate,
} from "../ui-components/form/Form";
import { Button } from "../ui-components/button/Button";
import { formatDistance, formatDistanceToNow } from "date-fns";

interface InstallationLatestCommissioningProps {
  installation: AdminInstallationDetail;
}

const currentTestStatus: BaseCommissioningTestStatusEnum[] = [
  BaseCommissioningTestStatusEnum.WaitingPrerequisite,
  BaseCommissioningTestStatusEnum.InProgress,
  BaseCommissioningTestStatusEnum.Ready,
  BaseCommissioningTestStatusEnum.Validated,
];

function toCommissioningStatusText(status: CommissioningStatusEnum): string {
  switch (status) {
    case CommissioningStatusEnum.Success:
      return "Commissioning was successful";
    case CommissioningStatusEnum.Failed:
      return "Commissioning has failed (timeout)";
    case CommissioningStatusEnum.InProgress:
      return "Tests in progress";
    case CommissioningStatusEnum.Ready:
      return "Tests are ready to be run (identification and configuration done)";
    case CommissioningStatusEnum.WaitingPrerequisite:
      return "Waiting for prerequisites (e.g. CIC not up to date)";
    case CommissioningStatusEnum.DevicesIdentification:
      return "Devices identification in progress";
    case CommissioningStatusEnum.Cancelled:
      return "Commissioning was cancelled";
    default:
      return "Unknown status";
  }
}

function toCommissioningTestStatusText(
  status: BaseCommissioningTestStatusEnum,
): string {
  switch (status) {
    case BaseCommissioningTestStatusEnum.Success:
      return "Test successful";
    case BaseCommissioningTestStatusEnum.Failed:
      return "Test failed";
    case BaseCommissioningTestStatusEnum.InProgress:
      return "Test in progress";
    case BaseCommissioningTestStatusEnum.Ready:
      return "Test is ready to be started by installer";
    case BaseCommissioningTestStatusEnum.Waiting:
      return "Test waiting (cannot be started by installer)";
    case BaseCommissioningTestStatusEnum.Cancelled:
      return "Test was cancelled";
    case BaseCommissioningTestStatusEnum.Validated:
      return "Test was validated by cloud (waiting for installer validation)";
    case BaseCommissioningTestStatusEnum.WaitingPrerequisite:
      return "Test is started by waiting for prerequisites (eg. pre-pump) to run validation";
    default:
      return "Unknown status";
  }
}

function getCurrentTest(
  tests: BaseCommissioningTest[],
): BaseCommissioningTest | null {
  if (!tests || tests.length === 0) {
    return null;
  }
  const currentTest = tests.find((test) =>
    currentTestStatus.find((status) => status === test.status),
  );
  return currentTest || null;
}

function commissioningTestUnfinished(
  test: BaseCommissioningTestStatusEnum,
): boolean {
  return (
    test === BaseCommissioningTestStatusEnum.InProgress ||
    test === BaseCommissioningTestStatusEnum.Ready ||
    test === BaseCommissioningTestStatusEnum.WaitingPrerequisite ||
    test === BaseCommissioningTestStatusEnum.Waiting ||
    test === BaseCommissioningTestStatusEnum.Validated
  );
}

function isCommissioningUnfinished(test: CommissioningStatusEnum): boolean {
  return (
    test === CommissioningStatusEnum.InProgress ||
    test === CommissioningStatusEnum.Ready ||
    test === CommissioningStatusEnum.WaitingPrerequisite ||
    test === CommissioningStatusEnum.DevicesIdentification
  );
}

function getTestPhase(test: BaseCommissioningTest): string {
  if (!commissioningTestUnfinished(test.status)) {
    return "Unknown phase";
  }

  if (test.status === BaseCommissioningTestStatusEnum.Ready) {
    return "Ready to be started";
  }

  if (test.isInPostTreatment) {
    return "Post-treatment";
  }

  if (test.prerequisiteStartedAt && !test.startedAt) {
    return "Pre-requisite";
  }

  if (test.startedAt && !test.endedAt) {
    return "Test validation in progress";
  }

  return "Unknown phase";
}

function CommissioningTest({ test }: { test: BaseCommissioningTest }) {
  const apiClient = useApiClient();
  const { isPending, mutate: forceTestSuccess } = useMutation({
    mutationFn: () =>
      apiClient.updateCommissioningTest({
        updateCommissioningTest: {
          status: BaseCommissioningTestStatusEnum.Success,
          forced: true,
        },
        commissioningTestUuid: test.uuid,
      }),
  });

  return (
    <>
      <FormField>
        <FormFieldTitle>Current test: {test.type}</FormFieldTitle>
      </FormField>
      <FormField>
        <FormFieldTitle>Test status</FormFieldTitle>
        <FormFieldValue value={toCommissioningTestStatusText(test.status)} />
      </FormField>
      {commissioningTestUnfinished(test.status) && (
        <>
          {(test.prerequisiteStartedAt || test.startedAt) && (
            <>
              <FormField>
                <FormFieldTitle>Phase</FormFieldTitle>
                <FormFieldValue value={getTestPhase(test)} />
              </FormField>
              <FormField>
                <FormFieldTitle>Total duration</FormFieldTitle>
                <FormFieldValue
                  value={
                    test.prerequisiteStartedAt || test.startedAt
                      ? formatDistanceToNow(
                          test.prerequisiteStartedAt ||
                            test.startedAt ||
                            new Date(),
                        )
                      : "N/A"
                  }
                />
              </FormField>
            </>
          )}
          {(test.prerequisiteStartedAt || test.startedAt) && (
            <FormField>
              <FormFieldTitle>Started at</FormFieldTitle>
              <FormFieldDate
                value={test.prerequisiteStartedAt || test.startedAt}
              />
            </FormField>
          )}
          {test.prerequisiteStartedAt && (
            <FormField>
              <FormFieldTitle>Duration of Pre-requisites</FormFieldTitle>
              <FormFieldValue
                value={
                  test.prerequisiteStartedAt
                    ? formatDistance(
                        test.prerequisiteStartedAt,
                        test.startedAt || new Date(),
                      )
                    : "N/A"
                }
              />
            </FormField>
          )}
          {test.startedAt && (
            <FormField>
              <FormFieldTitle>Duration of Validation</FormFieldTitle>
              <FormFieldValue
                value={formatDistance(
                  test.startedAt,
                  test.postTreatmentStartedAt || new Date(),
                )}
              />
            </FormField>
          )}
          {test.postTreatmentStartedAt && (
            <FormField>
              <FormFieldTitle>Duration of Post-Treatments</FormFieldTitle>
              <FormFieldValue
                value={formatDistance(
                  test.postTreatmentStartedAt,
                  test.postTreatmentEndedAt || new Date(),
                )}
              />
            </FormField>
          )}
          <FormField>
            <Button
              disabled={isPending}
              onClick={() => forceTestSuccess()}
              color="danger"
            >
              Force Test SUCCESS
            </Button>
          </FormField>
        </>
      )}
    </>
  );
}

const refetchOnlyWhenCommissioningIsUnfinished =
  (options: { refetchIntervalSeconds: number }) =>
  (query: {
    state: {
      data?: GetInstallerInstallationLatestCommissioning200Response;
      status: "pending" | "success" | "error";
    };
  }): number | false => {
    const _interval = options.refetchIntervalSeconds * 1000;
    if (query.state.status === "success" && query.state.data?.result) {
      return isCommissioningUnfinished(query.state.data.result.status)
        ? _interval
        : false;
    }
    return query.state.status === "error" ? false : _interval;
  };

export function InstallationLatestCommissioning({
  installation,
}: InstallationLatestCommissioningProps) {
  const apiClient = useApiClient();
  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: [
      "getAdminInstallationLatestCommissioning",
      installation.externalId,
    ],
    queryFn: async () => {
      return apiClient.getAdminInstallationLatestCommissioning({
        installationId: installation.externalId || "",
      });
    },
    enabled: !!installation.externalId,
    refetchInterval: refetchOnlyWhenCommissioningIsUnfinished({
      refetchIntervalSeconds: 2,
    }),
  });

  const { isPending, mutate: forceCommissioningSuccess } = useMutation({
    mutationFn: () =>
      apiClient.updateAdminInstallationCommissioning({
        updateCommissioning: {
          status: BaseCommissioningTestStatusEnum.Success,
          forced: true,
        },
        installationId: installation.externalId || "",
      }),
  });

  const currentTest = useMemo(() => {
    return data?.result.tests ? getCurrentTest(data.result.tests) : null;
  }, [data]);

  if (!installation.externalId) {
    return <ErrorText text="Installation external ID is not available." />;
  }

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="Latest non-hybrid commissioning" />
      {isLoading && <div>Loading...</div>}
      {isError && error.response.status != 404 && (
        <ErrorText
          text={`Failed to fetch latest commissioning for installation ${installation.externalId}.`}
          retry={refetch}
        />
      )}
      {isError && error && error.response.status === 404 && (
        <ErrorText text={`No commissioning found`} />
      )}
      {data && (
        <FormSection>
          <FormField>
            <FormFieldTitle>
              {toCommissioningStatusText(data.result.status)}
            </FormFieldTitle>
            {isCommissioningUnfinished(data.result.status) && (
              <>
                <FormField>
                  <FormFieldTitle>Created at</FormFieldTitle>
                  <FormFieldDate value={data.result.createdAt} />
                </FormField>
                <FormField>
                  <Button
                    disabled={isPending}
                    onClick={() => forceCommissioningSuccess()}
                    color="danger"
                  >
                    Force Commissioning to SUCCESS
                  </Button>
                </FormField>
              </>
            )}
          </FormField>
          {data.result.endedAt && (
            <FormField>
              <FormFieldTitle>Ended at</FormFieldTitle>
              <FormFieldDate value={data.result.endedAt} />
            </FormField>
          )}
          {data.result.status === "SUCCESS" && (
            <FormField>
              <FormFieldTitle>Was forced</FormFieldTitle>
              <FormFieldValue value={data.result.forced ? "Yes" : "No"} />
            </FormField>
          )}
          {data.result.status === "IN_PROGRESS" && currentTest && (
            <CommissioningTest test={currentTest} />
          )}
        </FormSection>
      )}
    </div>
  );
}
