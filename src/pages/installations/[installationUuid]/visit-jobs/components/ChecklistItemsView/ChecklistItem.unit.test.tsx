import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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

  it("renders single URL as image thumbnail", () => {
    const imageUrl = "https://example.com/image.jpg";
    render(<ChecklistItem question="Photo" answer={imageUrl} />);

    const img = screen.getByRole("img", { name: /Photo - Image 1/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", imageUrl);
  });

  it("renders multiple URLs as image gallery", () => {
    const imageUrls = [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/image3.jpg",
    ];
    render(<ChecklistItem question="Photos" answer={imageUrls} />);

    imageUrls.forEach((url, index) => {
      const img = screen.getByRole("img", {
        name: `Photos - Image ${index + 1}`,
      });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", url);
    });
  });

  it("calls onImageClick when image is clicked", () => {
    const handleImageClick = vi.fn();
    const imageUrl = "https://example.com/image.jpg";

    render(
      <ChecklistItem
        question="Photo"
        answer={imageUrl}
        onImageClick={handleImageClick}
      />,
    );

    const button = screen.getByRole("button", { name: /View image 1/i });
    fireEvent.click(button);

    expect(handleImageClick).toHaveBeenCalledWith(imageUrl, 0);
    expect(handleImageClick).toHaveBeenCalledTimes(1);
  });

  it("calls onImageClick for each image in gallery", () => {
    const handleImageClick = vi.fn();
    const imageUrls = [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ];

    render(
      <ChecklistItem
        question="Photos"
        answer={imageUrls}
        onImageClick={handleImageClick}
      />,
    );

    const buttons = screen.getAllByRole("button");

    fireEvent.click(buttons[0]);
    expect(handleImageClick).toHaveBeenCalledWith(imageUrls[0], 0);

    fireEvent.click(buttons[1]);
    expect(handleImageClick).toHaveBeenCalledWith(imageUrls[1], 1);
  });

  it("handles empty string answer", () => {
    render(<ChecklistItem question="Optional field" answer="" />);

    expect(screen.getByText("Optional field")).toBeInTheDocument();
    expect(screen.getByText("(empty)")).toBeInTheDocument();
  });

  it("handles relative URL paths as images", () => {
    const imageUrl = "/assets/photo.jpg";
    render(<ChecklistItem question="Local Photo" answer={imageUrl} />);

    const img = screen.getByRole("img", { name: /Local Photo - Image 1/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", imageUrl);
  });

  it("applies custom className", () => {
    const { container } = render(
      <ChecklistItem question="Test" answer="Value" className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("sets loading=lazy on images for performance", () => {
    render(
      <ChecklistItem question="Photo" answer="https://example.com/image.jpg" />,
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("renders mixed content as text badges (not images) when not all URLs", () => {
    // If we had mixed content (both URLs and text), they should all be treated as text
    // This is an edge case based on our "all or nothing" URL detection
    render(<ChecklistItem question="Mixed" answer={["Text", "More text"]} />);

    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("More text")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
