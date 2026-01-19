import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChecklistItemsView } from "./ChecklistItemsView";

describe("ChecklistItemsView", () => {
  const mockData = {
    "Inspector Name": "John Doe",
    "Equipment Condition": "Good",
    Temperature: "22°C",
  };

  it("renders all checklist items", () => {
    render(<ChecklistItemsView data={mockData} />);

    expect(screen.getByText("Inspector Name")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Equipment Condition")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Temperature")).toBeInTheDocument();
    expect(screen.getByText("22°C")).toBeInTheDocument();
  });

  it("displays empty state when data is null", () => {
    render(<ChecklistItemsView data={null} />);

    expect(screen.getByText("No checklist data available")).toBeInTheDocument();
  });

  it("displays empty state when data is undefined", () => {
    render(<ChecklistItemsView data={undefined} />);

    expect(screen.getByText("No checklist data available")).toBeInTheDocument();
  });

  it("displays empty state when data is empty object", () => {
    render(<ChecklistItemsView data={{}} />);

    expect(screen.getByText("No checklist data available")).toBeInTheDocument();
  });

  it("handles data with URLs as links", () => {
    const dataWithUrls = {
      Inspector: "John Doe",
      Documents: [
        "https://example.com/doc1.pdf",
        "https://example.com/doc2.pdf",
      ],
    };

    render(<ChecklistItemsView data={dataWithUrls} />);

    expect(screen.getByText("Inspector")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();

    // Check that links are rendered with URL text
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://example.com/doc1.pdf");
    expect(links[0]).toHaveTextContent("https://example.com/doc1.pdf");
    expect(links[1]).toHaveAttribute("href", "https://example.com/doc2.pdf");
    expect(links[1]).toHaveTextContent("https://example.com/doc2.pdf");
  });

  it("handles mixed content with URLs and text", () => {
    const dataWithMixedContent = {
      Inspector: "Jane Smith",
      Documentation: "https://example.com/doc.pdf",
      Status: "Completed",
      Notes: "All checks passed",
    };

    render(<ChecklistItemsView data={dataWithMixedContent} />);

    // Text fields
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("All checks passed")).toBeInTheDocument();

    // URL as link
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/doc.pdf");
    expect(link).toHaveTextContent("https://example.com/doc.pdf");
  });

  it("applies zebra striping to items", () => {
    const { container } = render(<ChecklistItemsView data={mockData} />);

    // Check for alternating background colors
    const items = container.querySelectorAll(
      '[class*="bg-gray-50"], [class*="bg-white"]',
    );
    expect(items.length).toBeGreaterThan(0);
  });

  it("applies custom className", () => {
    const { container } = render(
      <ChecklistItemsView data={mockData} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("handles array values correctly", () => {
    const dataWithArrays = {
      "Multiple Items": ["Item 1", "Item 2", "Item 3"],
    };

    render(<ChecklistItemsView data={dataWithArrays} />);

    expect(screen.getByText("Multiple Items")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });
});
