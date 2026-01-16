import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainerVariants } from "@/lib/animations";
import { ChecklistItem } from "./ChecklistItem";
import { ImageLightbox } from "../ImageLightbox";

export interface ChecklistItemsViewProps {
  data: { [key: string]: string | string[] } | null | undefined;
  className?: string;
}

/**
 * ChecklistItemsView - Container for displaying all checklist items
 * Provides a grid layout with zebra striping and image lightbox integration
 *
 * @example
 * ```tsx
 * <ChecklistItemsView
 *   data={{
 *     "Inspector": "John Doe",
 *     "Condition": "Good",
 *     "Photos": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
 *   }}
 * />
 * ```
 */
export function ChecklistItemsView({
  data,
  className = "",
}: ChecklistItemsViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Extract all image URLs from the data for the lightbox
  const allImages = useMemo(() => {
    if (!data) return [];

    const images: string[] = [];
    Object.values(data).forEach((value) => {
      const values = Array.isArray(value) ? value : [value];
      values.forEach((v) => {
        if (
          typeof v === "string" &&
          (v.startsWith("http://") ||
            v.startsWith("https://") ||
            v.startsWith("/"))
        ) {
          images.push(v);
        }
      });
    });
    return images;
  }, [data]);

  // Handle image click - find the global index in allImages
  const handleImageClick = (url: string) => {
    const globalIndex = allImages.indexOf(url);
    if (globalIndex !== -1) {
      setSelectedImageIndex(globalIndex);
      setLightboxOpen(true);
    }
  };

  // Empty state
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground italic">
        No checklist data available
      </div>
    );
  }

  const entries = Object.entries(data);

  return (
    <>
      <motion.div
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
        className={`border border-border rounded-lg overflow-hidden bg-white dark:bg-dark-foreground ${className}`}
      >
        {entries.map(([question, answer], index) => (
          <div
            key={question}
            className={
              index % 2 === 0
                ? "bg-gray-50 dark:bg-gray-800/50"
                : "bg-white dark:bg-dark-foreground"
            }
          >
            <ChecklistItem
              question={question}
              answer={answer}
              onImageClick={handleImageClick}
            />
          </div>
        ))}
      </motion.div>

      {/* Image Lightbox */}
      {allImages.length > 0 && (
        <ImageLightbox
          images={allImages}
          initialIndex={selectedImageIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
