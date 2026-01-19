import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChecklistItem } from "./ChecklistItem";

const meta: Meta<typeof ChecklistItem> = {
  title: "Visit Jobs/ChecklistItem",
  component: ChecklistItem,
  tags: ["autodocs"],
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

export const SingleURL: Story = {
  args: {
    question: "Documentation",
    answer: "https://example.com/installation-manual.pdf",
  },
};

export const MultipleURLs: Story = {
  args: {
    question: "Related Documents",
    answer: [
      "https://example.com/manual.pdf",
      "https://example.com/warranty.pdf",
      "https://example.com/specifications.pdf",
    ],
  },
};

export const RelativeURL: Story = {
  args: {
    question: "Local Document",
    answer: "/assets/documents/guide.pdf",
  },
};

export const MixedContent: Story = {
  args: {
    question: "Mixed Items",
    answer: [
      "Text value",
      "https://example.com/document.pdf",
      "Another text value",
    ],
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
