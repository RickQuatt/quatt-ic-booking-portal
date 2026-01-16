import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChecklistItem } from "./ChecklistItem";

const meta: Meta<typeof ChecklistItem> = {
  title: "Visit Jobs/ChecklistItem",
  component: ChecklistItem,
  tags: ["autodocs"],
  argTypes: {
    onImageClick: { action: "image clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof ChecklistItem>;

export const TextValue: Story = {
  args: {
    question: "Inspector Name",
    answer: "John Doe",
  },
};

export const MultipleTextValues: Story = {
  args: {
    question: "Checklist Items",
    answer: ["Item 1", "Item 2", "Item 3"],
  },
};

export const EmptyValue: Story = {
  args: {
    question: "Optional Field",
    answer: "",
  },
};

export const SingleImage: Story = {
  args: {
    question: "Equipment Photo",
    answer: "https://picsum.photos/seed/equipment/400/300",
    onImageClick: (url, index) =>
      console.log("Clicked image:", url, "at index:", index),
  },
};

export const ImageGallery: Story = {
  args: {
    question: "Installation Photos",
    answer: [
      "https://picsum.photos/seed/photo1/400/300",
      "https://picsum.photos/seed/photo2/400/300",
      "https://picsum.photos/seed/photo3/400/300",
    ],
    onImageClick: (url, index) =>
      console.log("Clicked image:", url, "at index:", index),
  },
};

export const RelativeURLImage: Story = {
  args: {
    question: "Local Image",
    answer: "/placeholder-image.jpg",
  },
};

export const LongQuestion: Story = {
  args: {
    question:
      "This is a very long question that might wrap to multiple lines to test how the component handles long text",
    answer: "Short answer",
  },
};

export const LongAnswer: Story = {
  args: {
    question: "Description",
    answer:
      "This is a very long answer that contains a lot of text to see how it displays in a badge format and whether it wraps properly",
  },
};

export const MultipleWithMixedLengths: Story = {
  args: {
    question: "Tags",
    answer: [
      "Short",
      "Medium length tag",
      "This is a much longer tag that has more text",
    ],
  },
};
