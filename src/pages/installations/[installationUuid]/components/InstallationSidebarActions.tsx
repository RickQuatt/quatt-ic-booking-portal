import { Link } from "wouter";
import type { components } from "@/openapi-client/types/api/v1";
import { CardContainer } from "@/components/shared/DetailPage";
import { Button } from "@/components/ui/Button";
import { ExternalLink, Settings, ClipboardList } from "lucide-react";

type AdminInstallationDetail = components["schemas"]["AdminInstallationDetail"];

export interface InstallationSidebarActionsProps {
  installation: AdminInstallationDetail;
  installationUuid: string;
  onRebootCIC: () => void;
  onOpenSettings: () => void;
  isRebootDisabled: boolean;
  rebootLabel: string;
  isLoading?: boolean;
}

/**
 * Sidebar actions card - Quick actions with distinct styling
 * Action buttons use solid colors to distinguish from header outline links
 */
export function InstallationSidebarActions({
  installation,
  installationUuid,
  onRebootCIC,
  onOpenSettings,
  isRebootDisabled,
  rebootLabel,
  isLoading = false,
}: InstallationSidebarActionsProps) {
  const { activeCic } = installation;

  const isNotHomeBattery = installation.type !== "HOME_BATTERY";

  return (
    <CardContainer title="Quick Actions">
      <div className="space-y-3">
        {/* Configure Settings */}
        {isNotHomeBattery && (
          <Button
            onClick={onOpenSettings}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <Settings className="h-4 w-4" />
            Configure Settings
          </Button>
        )}

        {/* Reboot CIC */}
        {activeCic && (
          <Button
            onClick={onRebootCIC}
            disabled={isRebootDisabled || isLoading}
            className="w-full"
            variant="outline"
          >
            {rebootLabel}
          </Button>
        )}

        {/* Visit Jobs */}
        <Button className="w-full" variant="outline">
          <a
            href={`/installations/${installationUuid}/visit-jobs`}
            className="w-full flex items-center justify-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ClipboardList className="h-4 w-4" />
            Visit Jobs
          </a>
        </Button>

        {/* Submit NCR */}
        <Button className="w-full" variant="outline">
          <a
            href="https://quatt-team.atlassian.net/jira/software/c/projects/NCR/form/36"
            target="_blank"
            className="w-full flex items-center justify-center gap-2"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Submit Field NCR
          </a>
        </Button>
      </div>
    </CardContainer>
  );
}
