export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) {
    return "N/A";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i >= sizes.length) {
    return `${(bytes / Math.pow(k, sizes.length - 1)).toFixed(1)} ${sizes[sizes.length - 1]}`;
  }

  const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${formattedValue} ${sizes[i]}`;
}
