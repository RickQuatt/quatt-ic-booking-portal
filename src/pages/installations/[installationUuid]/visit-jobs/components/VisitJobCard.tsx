import { useState } from "react";
import { Link } from "wouter";
import type { components } from "@/openapi-client/types/api/v1";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Copy, Check } from "lucide-react";
import { formatDateTimeString } from "@/utils/formatDate";
import { ImageLightbox } from "./ImageLightbox";
import { ChecklistSection } from "./ChecklistSection";
import { ImageGallerySection } from "./ImageGallerySection";

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

  // Backward compatibility: prioritize new fields, fallback to old
  const checkInImages = job.imageUrlsCheckIn || [];
  const checkOutImages = job.imageUrlsCheckOut || [];
  const hasLegacyData =
    checkInImages.length === 0 && checkOutImages.length === 0;

  // Combined images for lightbox (check-in first, then check-out)
  const allImages = hasLegacyData ? [] : [...checkInImages, ...checkOutImages];

  // Device version - oduVersion is the new field
  const displayOduVersion = job.oduVersion;

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
            {displayOduVersion && (
              <div>
                <span className="text-muted-foreground">ODU Version:</span>{" "}
                <span className="font-medium">{displayOduVersion}</span>
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

        {/* Source System */}
        {job.source && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              Source:
            </span>
            <Badge variant="outline" className="font-mono">
              {job.source}
            </Badge>
          </div>
        )}

        {/* Checklists */}
        {(job.checklistCheckIn || job.checklistCheckOut) && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Checklists
            </h4>
            <div className="space-y-2">
              {job.checklistCheckIn && (
                <ChecklistSection
                  title="Check-in Checklist"
                  data={job.checklistCheckIn}
                />
              )}
              {job.checklistCheckOut && (
                <ChecklistSection
                  title="Check-out Checklist"
                  data={job.checklistCheckOut}
                />
              )}
            </div>
          </div>
        )}

        {/* Images - Separate check-in and check-out galleries */}
        <div className="space-y-4">
          {(checkInImages.length > 0 || checkOutImages.length > 0) && (
            <h4 className="text-sm font-semibold text-muted-foreground">
              Images
            </h4>
          )}
          {checkInImages.length > 0 && (
            <ImageGallerySection
              title="Check-in Images"
              images={checkInImages}
              onImageClick={(index) => handleImageClick(index)}
              emptyMessage="No check-in images available"
            />
          )}
          {checkOutImages.length > 0 && (
            <ImageGallerySection
              title="Check-out Images"
              images={checkOutImages}
              onImageClick={(index) =>
                handleImageClick(index + checkInImages.length)
              }
              emptyMessage="No check-out images available"
            />
          )}
          {checkInImages.length === 0 && checkOutImages.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No images available
            </p>
          )}
        </div>
      </CardContent>

      {/* Image Lightbox */}
      <ImageLightbox
        images={allImages}
        initialIndex={selectedImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Card>
  );
}
