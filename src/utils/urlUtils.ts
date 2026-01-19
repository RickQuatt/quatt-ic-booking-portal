/**
 * Checks if a string is a valid URL (absolute or relative)
 *
 * This function validates URLs:
 * - Absolute URLs: http://, https://
 * - Relative URLs: starting with / followed by path characters (no spaces)
 *
 * @param value - String to check
 * @returns true if the string is a valid URL pattern
 *
 * @example
 * ```ts
 * isValidUrl("https://example.com/document.pdf") // true
 * isValidUrl("/assets/file.pdf") // true
 * isValidUrl("/some random text") // false
 * isValidUrl("not a url") // false
 * ```
 */
export function isValidUrl(value: string): boolean {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  // Check for absolute URLs (http:// or https://)
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  // Check for relative URLs - must start with / and have valid path characters
  // Matches patterns like: /path, /path/to/file.jpg, /assets/image.png
  // Does NOT match: "/some random text with spaces"
  if (value.startsWith("/")) {
    // Valid relative URL should not contain spaces after the leading slash
    // and should look like a proper path
    const pathPattern = /^\/[^\s]*$/;
    return pathPattern.test(value);
  }

  return false;
}
