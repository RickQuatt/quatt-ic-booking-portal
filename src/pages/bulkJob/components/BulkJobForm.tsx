import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { components } from "@/openapi-client/types/api/v1";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/Form";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBulkJobSubmit } from "../hooks/useBulkJobSubmit";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type BulkJobResponse = components["schemas"]["BulkJobResponse"];

// Helper functions
function parseInstallationIds(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.startsWith("INS-"));
}

function padHour(hour: number): string {
  return hour.toString().padStart(2, "0");
}

function buildDatetime(date: Date, hour: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${padHour(hour)}:00:00Z`;
}

// Zod schema
const bulkJobFormSchema = z
  .object({
    installationIds: z
      .string()
      .min(1, "At least one installation ID is required")
      .refine((value) => {
        const ids = parseInstallationIds(value);
        return ids.length > 0;
      }, "Must contain at least one valid installation ID (format: INS-...)"),
    startDate: z.date(),
    startHour: z.coerce.number().min(0).max(23),
    endDate: z.date().optional(),
    endHour: z.coerce.number().min(0).max(23).optional(),
  })
  .refine(
    (data) => {
      // Validate startDate is provided
      if (!data.startDate) {
        return false;
      }
      return true;
    },
    { message: "Start date is required", path: ["startDate"] },
  )
  .refine(
    (data) => {
      // Validate endDate is after startDate if provided
      if (data.endDate && data.startDate) {
        const start = new Date(buildDatetime(data.startDate, data.startHour));
        const end = new Date(buildDatetime(data.endDate, data.endHour || 23));
        return end > start;
      }
      return true;
    },
    { message: "End date must be after start date", path: ["endDate"] },
  );

type BulkJobFormData = z.infer<typeof bulkJobFormSchema>;

interface BulkJobFormProps {
  onSuccess: (data: BulkJobResponse) => void;
}

export function BulkJobForm({ onSuccess }: BulkJobFormProps) {
  const form = useForm<BulkJobFormData>({
    resolver: zodResolver(bulkJobFormSchema),
    defaultValues: {
      installationIds: "",
      startDate: undefined,
      startHour: 0,
      endDate: undefined,
      endHour: 23,
    },
  });

  const submitMutation = useBulkJobSubmit((response) => {
    onSuccess(response);
    // Don't reset form - user may want to submit similar job
  });

  const installationIdsText = form.watch("installationIds");

  // Count valid installation IDs in real-time
  const validIdCount = useMemo(() => {
    return parseInstallationIds(installationIdsText).length;
  }, [installationIdsText]);

  const onSubmit = (data: BulkJobFormData) => {
    const installationIds = parseInstallationIds(data.installationIds);

    const payload = {
      jobType: "BACKFILL_INSIGHTS" as const,
      installationIds,
      startDate: buildDatetime(data.startDate, data.startHour),
      ...(data.endDate && {
        endDate: buildDatetime(data.endDate, data.endHour || 23),
      }),
    };

    submitMutation.mutate({
      body: payload,
    });
  };

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Installation IDs Field */}
        <FormField
          control={form.control}
          name="installationIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Installation IDs</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="INS-12345678-1234-1234-1234-123456789012&#10;INS-23456789-2345-2345-2345-234567890123&#10;INS-34567890-3456-3456-3456-345678901234"
                  className="font-mono text-sm"
                  rows={6}
                />
              </FormControl>
              <FormDescription>
                Enter one installation ID per line.{" "}
                {validIdCount > 0 && (
                  <span className="font-semibold text-green-600">
                    {validIdCount} valid ID{validIdCount !== 1 ? "s" : ""} found
                  </span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Date & Hour */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Start Date & Time (UTC)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <FormControl>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                    </FormControl>
                    <PopoverContent
                      className="p-0 bg-black border-gray-700"
                      align="start"
                      sideOffset={5}
                      style={{ width: "var(--radix-popover-trigger-width)" }}
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        className="!bg-black text-white w-full"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hour (0-23)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {padHour(hour)}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* End Date & Hour (Optional) */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            End Date & Time (Optional)
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If not provided, defaults to current date and time
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <FormControl>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                    </FormControl>
                    <PopoverContent
                      className="p-0 bg-black border-gray-700"
                      align="start"
                      sideOffset={5}
                      style={{ width: "var(--radix-popover-trigger-width)" }}
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        className="!bg-black text-white w-full"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hour (0-23)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {padHour(hour)}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Job Type Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="text-sm">
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              Job Type:
            </span>{" "}
            <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-sm text-blue-900 dark:bg-blue-900 dark:text-blue-100">
              BACKFILL_INSIGHTS
            </code>
          </div>
          <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
            Recalculates historical insights data for the specified
            installations within the date range.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitMutation.isPending || validIdCount === 0}
            className="min-w-[150px]"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Bulk Job"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
