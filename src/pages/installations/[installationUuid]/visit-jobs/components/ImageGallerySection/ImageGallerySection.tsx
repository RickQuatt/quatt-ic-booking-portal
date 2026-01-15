export interface ImageGallerySectionProps {
  title: string;
  images: string[];
  onImageClick: (index: number) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * ImageGallerySection - Reusable image gallery with responsive grid
 *
 * @example
 * ```tsx
 * <ImageGallerySection
 *   title="Check-in Images"
 *   images={["url1.jpg", "url2.jpg"]}
 *   onImageClick={(index) => openLightbox(index)}
 * />
 * ```
 */
export function ImageGallerySection({
  title,
  images,
  onImageClick,
  emptyMessage = "No images available",
  className,
}: ImageGallerySectionProps) {
  if (!images || images.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
    );
  }

  return (
    <div className={className}>
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
        {title} ({images.length})
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((url, index) => (
          <div
            key={index}
            className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 dark:bg-dark-foreground cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onImageClick(index)}
          >
            <img
              src={url}
              alt={`${title} ${index + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
