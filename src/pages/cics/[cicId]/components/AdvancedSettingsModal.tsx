import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/openapi-client/context";
import { toast } from "sonner";
import type { components } from "@/openapi-client/types/api/v1";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type AdminCic = components["schemas"]["AdminCic"];

export interface AdvancedSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cicId: string;
  cicData: AdminCic;
}

const requiredFieldText = "This field is required";

const advancedSettingsSchema = z.object({
  dayMaxSoundLevel: z
    .enum(["normal", "library", "silent", "building87"])
    .optional()
    .nullable(),
  nightMaxSoundLevel: z
    .enum(["normal", "library", "silent", "building87"])
    .optional()
    .nullable(),
  silentMode: z.enum(["never", "night", "always"]).optional().nullable(),
  boilerType: z.enum(["opentherm", "on_off"], { message: requiredFieldText }),
  thermostatType: z.enum(
    ["opentherm_room_temperature", "opentherm_without_room_temperature"],
    { message: requiredFieldText },
  ),
  numberOfHeatPumps: z.coerce
    .number({ message: requiredFieldText })
    .min(1)
    .max(2),
  status: z.enum(["active", "registering", "factory", "service", "dead"], {
    message: requiredFieldText,
  }),
});

type AdvancedSettingsFormData = z.infer<typeof advancedSettingsSchema>;

/**
 * Modal for updating advanced CIC settings
 * Includes sound levels, boiler type, thermostat type, number of heat pumps, and CIC status
 */
export function AdvancedSettingsModal({
  open,
  onOpenChange,
  cicId,
  cicData,
}: AdvancedSettingsModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<AdvancedSettingsFormData>({
    resolver: zodResolver(advancedSettingsSchema),
    defaultValues: {
      dayMaxSoundLevel: cicData.dayMaxSoundLevel ?? undefined,
      nightMaxSoundLevel: cicData.nightMaxSoundLevel ?? undefined,
      silentMode: cicData.silentMode ?? undefined,
      boilerType: cicData.boilerType ?? undefined,
      thermostatType: cicData.thermostatType ?? undefined,
      numberOfHeatPumps: cicData.numberOfHeatPumps ?? undefined,
      status: cicData.status ?? undefined,
    },
  });

  const updateCicMutation = $api.useMutation("put", "/admin/cic/{cicId}", {
    onSuccess: () => {
      toast.success("Settings updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["get", "/admin/cic/{cicId}"],
      });
      form.reset({}, { keepValues: true });
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const onSubmit = (data: AdvancedSettingsFormData) => {
    if (
      !window.confirm(
        "Are you sure you would like to update these critical CIC settings?",
      )
    ) {
      return;
    }
    // Remove conflicting sound fields based on hasSoundSlider
    if (cicData.hasSoundSlider) {
      delete data.silentMode;
    } else {
      delete data.dayMaxSoundLevel;
      delete data.nightMaxSoundLevel;
    }
    updateCicMutation.mutate({
      params: { path: { cicId } },
      body: data as components["schemas"]["UpdateAdminCic"],
    });
  };

  const isPending = updateCicMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Advanced Settings</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* CIC ID (readonly) */}
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                ID
              </span>
              <span className="font-mono text-sm">{cicData.id}</span>
            </div>

            {/* Sound Settings - Conditional based on hasSoundSlider */}
            {cicData.hasSoundSlider ? (
              <>
                {/* Day Max Sound Level */}
                <FormField
                  control={form.control}
                  name="dayMaxSoundLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day Max Sound Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gray-50 dark:bg-dark-foreground">
                            <SelectValue placeholder="Select sound level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="library">Library</SelectItem>
                          <SelectItem value="silent">Silent</SelectItem>
                          <SelectItem value="building87">Building87</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Night Max Sound Level */}
                <FormField
                  control={form.control}
                  name="nightMaxSoundLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Night Max Sound Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gray-50 dark:bg-dark-foreground">
                            <SelectValue placeholder="Select sound level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="library">Library</SelectItem>
                          <SelectItem value="silent">Silent</SelectItem>
                          <SelectItem value="building87">Building87</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              /* Silent Mode */
              <FormField
                control={form.control}
                name="silentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Silent Mode</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-50 dark:bg-dark-foreground">
                          <SelectValue placeholder="Select silent mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                        <SelectItem value="always">Always</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Boiler Type */}
            <FormField
              control={form.control}
              name="boilerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Boiler Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gray-50 dark:bg-dark-foreground">
                        <SelectValue placeholder="Select boiler type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="opentherm">Opentherm</SelectItem>
                      <SelectItem value="on_off">On/Off</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Thermostat Type */}
            <FormField
              control={form.control}
              name="thermostatType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thermostat Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gray-50 dark:bg-dark-foreground">
                        <SelectValue placeholder="Select thermostat type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="opentherm_room_temperature">
                        Opentherm Room Temperature
                      </SelectItem>
                      <SelectItem value="opentherm_without_room_temperature">
                        Opentherm Without Room Temperature
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Number of Heat Pumps */}
            <FormField
              control={form.control}
              name="numberOfHeatPumps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Heat Pumps</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={2}
                      className="bg-gray-50 dark:bg-dark-foreground"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CIC Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CIC Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gray-50 dark:bg-dark-foreground">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="dead">Dead</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!form.formState.isDirty || isPending}
              >
                {isPending ? "Updating..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
