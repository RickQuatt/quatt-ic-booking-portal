import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { VisitJobFilters } from "./VisitJobFilters";
import type { VisitJobFilters as VisitJobFiltersType } from "./VisitJobFilters";

const meta: Meta<typeof VisitJobFilters> = {
  title: "Visit Jobs/VisitJobFilters",
  component: VisitJobFilters,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof VisitJobFilters>;

const mockJobTypes = [
  "Installation",
  "Maintenance",
  "Repair",
  "Inspection",
  "Emergency Service",
];

export const Default: Story = {
  args: {
    availableJobTypes: mockJobTypes,
    filters: {},
    jobCount: 42,
    onFiltersChange: (filters) => console.log("Filters changed:", filters),
    onClearAll: () => console.log("Clear all clicked"),
  },
};

export const WithSelectedFilter: Story = {
  args: {
    availableJobTypes: mockJobTypes,
    filters: { jobType: "Installation" },
    jobCount: 15,
    onFiltersChange: (filters) => console.log("Filters changed:", filters),
    onClearAll: () => console.log("Clear all clicked"),
  },
};

export const SingleJob: Story = {
  args: {
    availableJobTypes: mockJobTypes,
    filters: { jobType: "Emergency Service" },
    jobCount: 1,
    onFiltersChange: (filters) => console.log("Filters changed:", filters),
    onClearAll: () => console.log("Clear all clicked"),
  },
};

export const NoJobs: Story = {
  args: {
    availableJobTypes: mockJobTypes,
    filters: { jobType: "Inspection" },
    jobCount: 0,
    onFiltersChange: (filters) => console.log("Filters changed:", filters),
    onClearAll: () => console.log("Clear all clicked"),
  },
};

export const NoJobTypesAvailable: Story = {
  args: {
    availableJobTypes: [],
    filters: {},
    jobCount: 0,
    onFiltersChange: (filters) => console.log("Filters changed:", filters),
    onClearAll: () => console.log("Clear all clicked"),
  },
};

export const ManyJobs: Story = {
  args: {
    availableJobTypes: mockJobTypes,
    filters: {},
    jobCount: 247,
    onFiltersChange: (filters) => console.log("Filters changed:", filters),
    onClearAll: () => console.log("Clear all clicked"),
  },
};

// Interactive story with state management
export const Interactive: Story = {
  render: () => {
    const [filters, setFilters] = useState<VisitJobFiltersType>({});
    const [jobCount] = useState(42);

    const handleClearAll = () => {
      setFilters({});
    };

    return (
      <VisitJobFilters
        availableJobTypes={mockJobTypes}
        filters={filters}
        onFiltersChange={setFilters}
        onClearAll={handleClearAll}
        jobCount={jobCount}
      />
    );
  },
};
