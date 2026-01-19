import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChecklistItemsView } from "./ChecklistItemsView";

const meta: Meta<typeof ChecklistItemsView> = {
  title: "Visit Jobs/ChecklistItemsView",
  component: ChecklistItemsView,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ChecklistItemsView>;

export const Default: Story = {
  args: {
    data: {
      "Inspector Name": "John Doe",
      "Equipment Condition": "Good",
      Temperature: "22°C",
      "Pressure Reading": "1.5 bar",
    },
  },
};

export const WithURLs: Story = {
  args: {
    data: {
      Inspector: "Jane Smith",
      "Equipment Status": "Operational",
      "Installation Manual": "https://example.com/manual.pdf",
      "Related Documents": [
        "https://example.com/warranty.pdf",
        "https://example.com/specifications.pdf",
      ],
      "Completion Certificate": "https://example.com/certificate.pdf",
    },
  },
};

export const TextOnly: Story = {
  args: {
    data: {
      Technician: "Bob Johnson",
      Location: "Amsterdam",
      Weather: "Sunny",
      Access: "Easy",
      "Customer Present": "Yes",
      "Tools Used": ["Wrench", "Screwdriver", "Multimeter"],
    },
  },
};

export const MixedContent: Story = {
  args: {
    data: {
      Inspector: "Alice Williams",
      Date: "2024-01-15",
      Status: "Completed",
      Documents: [
        "https://example.com/report1.pdf",
        "https://example.com/report2.pdf",
        "https://example.com/report3.pdf",
      ],
      Notes: "All systems operational",
      "Next Inspection": "2024-06-15",
    },
  },
};

export const EmptyState: Story = {
  args: {
    data: null,
  },
};

export const EmptyObject: Story = {
  args: {
    data: {},
  },
};

export const SingleItem: Story = {
  args: {
    data: {
      "Single Field": "Single Value",
    },
  },
};

export const ManyItems: Story = {
  args: {
    data: {
      "Field 1": "Value 1",
      "Field 2": "Value 2",
      "Field 3": "Value 3",
      "Field 4": "Value 4",
      "Field 5": "Value 5",
      "Field 6": "Value 6",
      "Field 7": "Value 7",
      "Field 8": "Value 8",
      "Field 9": "Value 9",
      "Field 10": "Value 10",
    },
  },
};
