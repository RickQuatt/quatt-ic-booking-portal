import type { components } from "@/openapi-client/types/api/v1";
import { formatDateTime } from "@/utils/formatDate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Link } from "wouter";

type AdminInstallationDetail = components["schemas"]["AdminInstallationDetail"];

export interface InstallationCicHistoryProps {
  installation: AdminInstallationDetail;
}

/**
 * Installation CIC History Component
 * Displays table of CIC associations over time
 */
export function InstallationCicHistory({
  installation,
}: InstallationCicHistoryProps) {
  const { cicState } = installation;

  // Deduplicate consecutive entries with the same cicId + status
  const deduplicatedCicState = cicState?.filter(
    (state, index, arr) =>
      index === 0 ||
      state.cicId !== arr[index - 1].cicId ||
      state.status !== arr[index - 1].status,
  );

  if (!deduplicatedCicState || deduplicatedCicState.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        No CIC history available
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">CIC</TableHead>
            <TableHead>Starts At</TableHead>
            <TableHead>State</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deduplicatedCicState.map((state, index) => (
            <TableRow key={state.id || index}>
              <TableCell className="font-medium">{state.cicId}</TableCell>
              <TableCell>{formatDateTime(new Date(state.startAt))}</TableCell>
              <TableCell>{state.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
