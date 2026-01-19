import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChecklistItem } from "./ChecklistItem";

describe("ChecklistItem", () => {
  it("renders question and text answer as badge", () => {
    render(<ChecklistItem question="Inspector Name" answer="John Doe" />);

    expect(screen.getByText("Inspector Name")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders multiple text answers as badges", () => {
    render(
      <ChecklistItem
        question="Checklist items"
        answer={["Item 1", "Item 2", "Item 3"]}
      />,
    );

    expect(screen.getByText("Checklist items")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("renders single URL as clickable link", () => {
    const url = "https://example.com/document.pdf";
    render(<ChecklistItem question="Documentation" answer={url} />);

    const link = screen.getByRole("link", { name: /View Link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders multiple URLs as multiple links", () => {
    const urls = [
      "https://example.com/doc1.pdf",
      "https://example.com/doc2.pdf",
      "https://example.com/doc3.pdf",
    ];
    render(<ChecklistItem question="Documents" answer={urls} />);

    const links = screen.getAllByRole("link", { name: /View Link/i });
    expect(links).toHaveLength(3);
    urls.forEach((url, index) => {
      expect(links[index]).toHaveAttribute("href", url);
    });
  });

  it("handles empty string answer", () => {
    render(<ChecklistItem question="Optional field" answer="" />);

    expect(screen.getByText("Optional field")).toBeInTheDocument();
    expect(screen.getByText("(empty)")).toBeInTheDocument();
  });

  it("handles relative URL paths as links", () => {
    const url = "/assets/document.pdf";
    render(<ChecklistItem question="Local Document" answer={url} />);

    const link = screen.getByRole("link", { name: /View Link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", url);
  });

  it("applies custom className", () => {
    const { container } = render(
      <ChecklistItem question="Test" answer="Value" className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders mixed content with both URLs and text", () => {
    render(
      <ChecklistItem
        question="Mixed"
        answer={["Text value", "https://example.com/doc.pdf", "Another text"]}
      />,
    );

    expect(screen.getByText("Text value")).toBeInTheDocument();
    expect(screen.getByText("Another text")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View Link/i }),
    ).toBeInTheDocument();
  });

  it("does not treat strings with spaces after / as links", () => {
    // Improved URL validation should reject "/some random text"
    render(
      <ChecklistItem
        question="Not a URL"
        answer="/some random text with spaces"
      />,
    );

    expect(screen.getByText("Not a URL")).toBeInTheDocument();
    expect(
      screen.getByText("/some random text with spaces"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("opens links in new tab with proper security attributes", () => {
    render(
      <ChecklistItem
        question="External Link"
        answer="https://example.com/external"
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
