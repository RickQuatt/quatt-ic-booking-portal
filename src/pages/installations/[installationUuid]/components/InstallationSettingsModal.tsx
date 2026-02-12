import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { components } from "@/openapi-client/types/api/v1";
import { useUpdateInstallationSettings } from "../hooks/useUpdateInstallationSettings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";

type AdminInstallationDetail = components["schemas"]["AdminInstallationDetail"];

export interface InstallationSettingsModalProps {
  installation: AdminInstallationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Installation Settings Modal Component
 * Modal dialog with form for updating installation configuration
 */
export function InstallationSettingsModal({
  installation,
  open,
  onOpenChange,
}: InstallationSettingsModalProps) {
  const requiredFieldText = "This field is required";

  const installationSettingsSchema = z.object({
    ratedMaximumHousePower: z.coerce
      .number({ message: requiredFieldText })
      .nullable(),
    maximumHeatingOutdoorTemperature: z.coerce.number({
      message: requiredFieldText,
    }),
    dayMaxSoundLevel: z
      .enum(["normal", "library", "silent", "building87"])
      .optional()
      .nullable(),
    nightMaxSoundLevel: z
      .enum(["normal", "library", "silent", "building87"])
      .optional()
      .nullable(),
    silentMode: z.enum(["never", "night", "always"]).optional().nullable(),
    boilerType: z.enum(["opentherm", "on_off"]).optional().nullable(),
    thermostatType: z
      .enum([
        "opentherm_room_temperature",
        "opentherm_without_room_temperature",
      ])
      .optional()
      .nullable(),
    numberOfHeatPumps: z.coerce
      .number({ message: requiredFieldText })
      .min(1)
      .max(2),
    chMaxWaterTemperature: z.coerce
      .number()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (val === null || val === undefined) return true;
          const config = installation?.chMaxWaterTemperature;
          if (!config) return true;
          return val >= config.minValue && val <= config.maxValue;
        },
        {
          message: `Value must be between ${installation?.chMaxWaterTemperature?.minValue}°C and ${installation?.chMaxWaterTemperature?.maxValue}°C`,
        },
      )
      .refine(
        (val) => {
          if (val === null || val === undefined) return true;
          const config = installation?.chMaxWaterTemperature;
          if (!config) return true;
          // Validate increment
          return (val - config.minValue) % config.increment === 0;
        },
        {
          message: `Value must be in increments of ${installation?.chMaxWaterTemperature?.increment}°C`,
        },
      ),
  });

  type InstallationSettingsFormData = z.infer<
    typeof installationSettingsSchema
  >;

  const form = useForm<InstallationSettingsFormData>({
    resolver: zodResolver(installationSettingsSchema),
    defaultValues: {
      ratedMaximumHousePower: installation.ratedMaximumHousePower ?? undefined,
      maximumHeatingOutdoorTemperature:
        installation.maximumHeatingOutdoorTemperature ?? undefined,
      dayMaxSoundLevel: installation.dayMaxSoundLevel ?? undefined,
      nightMaxSoundLevel: installation.nightMaxSoundLevel ?? undefined,
      silentMode: installation.silentMode ?? undefined,
      boilerType: installation.boilerType ?? undefined,
      thermostatType: installation.thermostatType ?? undefined,
      numberOfHeatPumps: installation.numberOfHeatPumps ?? undefined,
      chMaxWaterTemperature:
        installation?.chMaxWaterTemperature?.value ?? undefined,
    },
  });

  const { updateSettings, isPending } = useUpdateInstallationSettings({
    installationUuid: installation.externalId as string,
    reset: form.reset,
    onSuccess: () => onOpenChange(false),
  });

  const onSubmit = (data: InstallationSettingsFormData) => {
    // Remove conflicting sound fields based on hasSoundSlider
    if (installation.hasSoundSlider) {
      delete data.silentMode;
    } else {
      delete data.dayMaxSoundLevel;
      delete data.nightMaxSoundLevel;
    }

    // Prepare the update payload, converting null to undefined for API compatibility
    const updatePayload: components["schemas"]["UpdateAdminInstallation"] = {
      ratedMaximumHousePower: data.ratedMaximumHousePower,
      maximumHeatingOutdoorTemperature: data.maximumHeatingOutdoorTemperature,
      dayMaxSoundLevel: data.dayMaxSoundLevel ?? undefined,
      nightMaxSoundLevel: data.nightMaxSoundLevel ?? undefined,
      silentMode: data.silentMode ?? undefined,
      boilerType: data.boilerType ?? undefined,
      thermostatType: data.thermostatType ?? undefined,
      numberOfHeatPumps: data.numberOfHeatPumps,
      chMaxWaterTemperature:
        data.chMaxWaterTemperature !== undefined &&
        data.chMaxWaterTemperature !== null
          ? { value: data.chMaxWaterTemperature }
          : undefined,
    };

    // Update all installation settings including chMaxWaterTemperature
    updateSettings(updatePayload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Configure Installation Settings</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Rated Maximum House Power */}
            <FormField
              control={form.control}
              name="ratedMaximumHousePower"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rated Maximum House Power (W)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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

            {/* Maximum Heating Outdoor Temperature */}
            <FormField
              control={form.control}
              name="maximumHeatingOutdoorTemperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Maximum Heating Outdoor Temperature (°C)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
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

            {/* Sound Settings - Conditional based on hasSoundSlider */}
            {installation.hasSoundSlider ? (
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

            {/* Max Water Temperature - Only show if supported */}
            {installation?.chMaxWaterTemperature &&
              (() => {
                const config = installation.chMaxWaterTemperature;
                return (
                  <FormField
                    control={form.control}
                    name="chMaxWaterTemperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Max Water Temperature (°C)
                          <span className="text-xs text-gray-500 ml-2">
                            Range: {config.minValue}°C - {config.maxValue}°C
                            {config.increment > 1 &&
                              ` (step: ${config.increment}°C)`}
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={config.minValue}
                            max={config.maxValue}
                            step={config.increment}
                            className="bg-gray-50 dark:bg-dark-foreground"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                        {config.hasOnOffBoiler && (
                          <p className="text-xs text-amber-600">
                            ⚠️ Warning: Installation has an on/off boiler
                          </p>
                        )}
                        {config.heatpumpMaxTemperatureWarning &&
                          field.value &&
                          field.value >
                            config.heatpumpMaxTemperatureWarning && (
                            <p className="text-xs text-amber-600">
                              ⚠️ Warning: Value exceeds heat pump physical limit
                              ({config.heatpumpMaxTemperatureWarning}°C)
                            </p>
                          )}
                      </FormItem>
                    )}
                  />
                );
              })()}

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
                disabled={!form.formState.isDirty || isPending}
              >
                {isPending ? "Updating..." : "Update Settings"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
