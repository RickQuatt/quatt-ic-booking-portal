import { describe, it, expect } from "vitest";
import { isValidUrl } from "./urlUtils";

describe("urlUtils", () => {
  describe("isValidUrl", () => {
    it("returns true for valid absolute HTTP URLs", () => {
      expect(isValidUrl("http://example.com/image.jpg")).toBe(true);
      expect(isValidUrl("http://example.com")).toBe(true);
    });

    it("returns true for valid absolute HTTPS URLs", () => {
      expect(isValidUrl("https://example.com/image.jpg")).toBe(true);
      expect(isValidUrl("https://example.com/path/to/image.png")).toBe(true);
    });

    it("returns true for valid relative URLs", () => {
      expect(isValidUrl("/assets/image.jpg")).toBe(true);
      expect(isValidUrl("/path/to/file.png")).toBe(true);
      expect(isValidUrl("/image.jpg")).toBe(true);
    });

    it("returns false for invalid URLs", () => {
      expect(isValidUrl("not a url")).toBe(false);
      expect(isValidUrl("just text")).toBe(false);
    });

    it("returns false for strings that start with / but have spaces", () => {
      expect(isValidUrl("/some random text")).toBe(false);
      expect(isValidUrl("/hello world")).toBe(false);
      expect(isValidUrl("/ with spaces")).toBe(false);
    });

    it("returns false for empty strings", () => {
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("   ")).toBe(false);
    });

    it("returns false for malformed HTTP URLs", () => {
      expect(isValidUrl("http://")).toBe(false);
      expect(isValidUrl("https://")).toBe(false);
    });

    it("handles edge cases", () => {
      expect(isValidUrl("/")).toBe(true); // Root path
      expect(isValidUrl("//example.com")).toBe(false); // Protocol-relative URL
    });
  });
});
