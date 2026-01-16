import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  it("handles data with image URLs", () => {
    const dataWithImages = {
      Inspector: "John Doe",
      Photos: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
    };

    render(<ChecklistItemsView data={dataWithImages} />);

    expect(screen.getByText("Inspector")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Photos")).toBeInTheDocument();

    // Check that images are rendered
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "https://example.com/img1.jpg");
    expect(images[1]).toHaveAttribute("src", "https://example.com/img2.jpg");
  });

  it("opens lightbox when image is clicked", async () => {
    const dataWithImages = {
      Photos: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
    };

    render(<ChecklistItemsView data={dataWithImages} />);

    // Click the first image button
    const imageButtons = screen.getAllByRole("button", { name: /View image/i });
    fireEvent.click(imageButtons[0]);

    // Wait for lightbox dialog to appear
    await waitFor(() => {
      // The Dialog component renders the image in a modal
      const lightboxImages = screen.getAllByRole("img");
      // Should have original 2 images + 1 in lightbox
      expect(lightboxImages.length).toBeGreaterThan(2);
    });
  });

  it("collects all image URLs from data for lightbox", () => {
    const dataWithMultipleImages = {
      "Check-in Photo": "https://example.com/checkin.jpg",
      "Equipment Photos": [
        "https://example.com/equipment1.jpg",
        "https://example.com/equipment2.jpg",
      ],
      "Check-out Photo": "https://example.com/checkout.jpg",
      Inspector: "John Doe", // Non-image field
    };

    render(<ChecklistItemsView data={dataWithMultipleImages} />);

    // Should have 4 images total (1 + 2 + 1, excluding the text field)
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(4);
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
