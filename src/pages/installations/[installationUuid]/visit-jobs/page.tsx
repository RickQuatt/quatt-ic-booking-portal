import { useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { $api } from "@/openapi-client/context";
import { Loader } from "@/components/shared/Loader";
import { ErrorText } from "@/components/shared/ErrorText";
import { Button } from "@/components/ui/Button";
import { fadeInVariants } from "@/lib/animations";
import { VisitJobCard } from "./components";
import { ArrowLeft } from "lucide-react";

export interface VisitJobsPageProps {
  installationUuid: string;
}

/**
 * VisitJobsPage - Displays all visit jobs for an installation
 * Supports filtering by jobUid via query parameter
 */
export function VisitJobsPage({ installationUuid }: VisitJobsPageProps) {
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  // Parse query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return {
      jobUid: params.get("jobUid") || undefined,
    };
  }, [searchString]);

  // Fetch visit jobs
  const { data, isLoading, error, refetch } = $api.useQuery(
    "get",
    "/admin/installation/{installationUuid}/visit-jobs",
    {
      params: {
        path: { installationUuid },
        query: queryParams,
      },
    },
  );

  const visitJobs = data?.result || [];
  const isFilteredByJobId = !!queryParams.jobUid;

  const handleViewAllJobs = () => {
    setLocation(`/installations/${installationUuid}/visit-jobs`);
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorText
          text={`Failed to fetch visit jobs for installation ${installationUuid}.`}
          retry={() => refetch()}
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="animate"
        className="container mx-auto px-4 py-6 max-w-5xl"
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/installations/${installationUuid}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Installation
                  </Button>
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Visit Jobs
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Installation:{" "}
                <Link
                  href={`/installations/${installationUuid}`}
                  className="text-primary hover:underline font-mono"
                >
                  {installationUuid}
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isFilteredByJobId && (
                <Button variant="outline" size="sm" onClick={handleViewAllJobs}>
                  View All Jobs
                </Button>
              )}
              <span className="text-sm text-muted-foreground bg-gray-100 dark:bg-dark-foreground px-3 py-1.5 rounded-full">
                {visitJobs.length} {visitJobs.length === 1 ? "job" : "jobs"}{" "}
                found
              </span>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {visitJobs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-border">
              <p className="text-muted-foreground">
                No visit jobs found for this installation.
              </p>
              {isFilteredByJobId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewAllJobs}
                  className="mt-4"
                >
                  View All Jobs
                </Button>
              )}
            </div>
          ) : (
            visitJobs.map((job) => <VisitJobCard key={job.jobUid} job={job} />)
          )}
        </div>
      </motion.div>
    </div>
  );
}
