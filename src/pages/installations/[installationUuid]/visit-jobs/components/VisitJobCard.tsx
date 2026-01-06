import { useState } from "react";
import { Link } from "wouter";
import type { components } from "@/openapi-client/types/api/v1";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Copy, Check } from "lucide-react";
import { formatDateTimeString } from "@/utils/formatDate";
import { ImageLightbox } from "./ImageLightbox";

type VisitJob = components["schemas"]["VisitJob"];

export interface VisitJobCardProps {
  job: VisitJob;
}

/**
 * VisitJobCard - Displays details for a single visit job
 * Includes job info, timing, status badge, and image gallery with lightbox
 */
export function VisitJobCard({ job }: VisitJobCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  const getStatusBadgeVariant = (
    status: string | null,
  ): "default" | "secondary" | "destructive" | "success" | "outline" => {
    if (!status) return "secondary";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("complete")) return "success";
    if (lowerStatus.includes("progress")) return "default";
    if (lowerStatus.includes("cancel")) return "destructive";
    return "secondary";
  };

  const getStatusClassName = (status: string | null): string => {
    if (!status)
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("complete"))
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (lowerStatus.includes("progress"))
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (lowerStatus.includes("pending"))
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (lowerStatus.includes("cancel"))
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-foreground">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold leading-tight">
            {job.jobDescription}
          </h3>
          {job.jobStatus && (
            <Badge
              variant={getStatusBadgeVariant(job.jobStatus)}
              className={getStatusClassName(job.jobStatus)}
            >
              {job.jobStatus}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Job ID */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground font-medium">Job ID:</span>
          <Link
            href={`https://quatt.my.skedulo.com/job/${job.jobUid}`}
            className="text-primary hover:underline font-mono"
            target="_blank"
            rel="noopener noreferrer"
          >
            {job.jobUid}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => handleCopy(job.jobUid, "jobUid")}
          >
            {copiedField === "jobUid" ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Time Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Time Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Start:</span>{" "}
              <span className="font-medium">
                {job.startTime ? formatDateTimeString(job.startTime) : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">End:</span>{" "}
              <span className="font-medium">
                {job.endTime ? formatDateTimeString(job.endTime) : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Duration:</span>{" "}
              <span className="font-medium">
                {formatDuration(job.duration)}
              </span>
            </div>
          </div>
          {(job.estimatedStart || job.estimatedEnd) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm pt-1">
              <div>
                <span className="text-muted-foreground">Est. Start:</span>{" "}
                <span className="font-medium">
                  {job.estimatedStart
                    ? formatDateTimeString(job.estimatedStart)
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Est. End:</span>{" "}
                <span className="font-medium">
                  {job.estimatedEnd
                    ? formatDateTimeString(job.estimatedEnd)
                    : "N/A"}
                </span>
              </div>
              <div></div>
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Job Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {job.jobType && (
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                <span className="font-medium">{job.jobType}</span>
              </div>
            )}
            {job.product && (
              <div>
                <span className="text-muted-foreground">Product:</span>{" "}
                <span className="font-medium">{job.product}</span>
              </div>
            )}
            {job.productFamily && (
              <div>
                <span className="text-muted-foreground">Product Family:</span>{" "}
                <span className="font-medium">{job.productFamily}</span>
              </div>
            )}
            {job.deviceVersion && (
              <div>
                <span className="text-muted-foreground">Device Version:</span>{" "}
                <span className="font-medium">{job.deviceVersion}</span>
              </div>
            )}
            {job.resourceNames && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Assigned To:</span>{" "}
                <span className="font-medium">{job.resourceNames}</span>
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        {job.allUrls && job.allUrls.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Images ({job.allUrls.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {job.allUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 dark:bg-dark-foreground cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick(index)}
                >
                  <img
                    src={url}
                    alt={`Visit job image ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No images available
          </p>
        )}
      </CardContent>

      {/* Image Lightbox */}
      <ImageLightbox
        images={job.allUrls || []}
        initialIndex={selectedImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Card>
  );
}
