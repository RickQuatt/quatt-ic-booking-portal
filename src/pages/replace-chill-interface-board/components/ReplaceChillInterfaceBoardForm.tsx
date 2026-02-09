import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import type { components } from "@/openapi-client/types/api/v1";
import { useReplaceChillInterfaceBoard } from "../hooks/useReplaceChillInterfaceBoard";

type ChillInterfaceBoard = components["schemas"]["ChillInterfaceBoard"];

const replaceChillBoardSchema = z.object({
  installationUuid: z.string().min(1, "Installation UUID is required"),
  deviceUuid: z.string().min(1, "Device UUID is required"),
  newBoardEui64: z
    .string()
    .min(1, "New board EUI-64 is required")
    .regex(
      /^[0-9A-Fa-f]{16}$/,
      "Must be exactly 16 hexadecimal characters (e.g., FEDCBA9876543210)",
    ),
});

type ReplaceChillBoardFormData = z.infer<typeof replaceChillBoardSchema>;

interface ReplaceChillInterfaceBoardFormProps {
  defaultInstallationUuid?: string;
  defaultDeviceUuid?: string;
}

function BoardDetails({
  label,
  board,
}: {
  label: string;
  board: ChillInterfaceBoard;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{label}</h4>
      <div className="space-y-1 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">UUID</span>
          <span className="font-mono text-sm">{board.uuid}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            EUI-64
          </span>
          <span className="font-mono text-sm">{board.eui64}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Serial Number
          </span>
          <span className="font-mono text-sm">{board.serialNumber}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            PCB Version
          </span>
          <span className="text-sm">{board.pcbHwVersion}</span>
        </div>
        {board.activatedAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Activated At
            </span>
            <span className="text-sm">
              {new Date(board.activatedAt).toLocaleString()}
            </span>
          </div>
        )}
        {board.deactivatedAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Deactivated At
            </span>
            <span className="text-sm">
              {new Date(board.deactivatedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReplaceChillInterfaceBoardForm({
  defaultInstallationUuid = "",
  defaultDeviceUuid = "",
}: ReplaceChillInterfaceBoardFormProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] =
    useState<ReplaceChillBoardFormData | null>(null);

  const form = useForm<ReplaceChillBoardFormData>({
    resolver: zodResolver(replaceChillBoardSchema),
    defaultValues: {
      installationUuid: defaultInstallationUuid,
      deviceUuid: defaultDeviceUuid,
      newBoardEui64: "",
    },
  });

  const { replaceBoard, isPending, isSuccess, data, reset } =
    useReplaceChillInterfaceBoard({
      onSuccess: () => {
        form.reset();
      },
    });

  const onSubmit = (formData: ReplaceChillBoardFormData) => {
    setPendingData(formData);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingData) return;
    replaceBoard(
      pendingData.installationUuid,
      pendingData.deviceUuid,
      pendingData.newBoardEui64.toUpperCase(),
    );
    setIsConfirmOpen(false);
    setPendingData(null);
  };

  const handleReset = () => {
    reset();
    form.reset({
      installationUuid: "",
      deviceUuid: "",
      newBoardEui64: "",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Board Replacement</CardTitle>
        </CardHeader>
        <CardContent>
          {isSuccess && data ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Interface board replaced successfully
                </span>
              </div>

              <BoardDetails
                label="Old Board (Deactivated)"
                board={data.oldBoard}
              />
              <BoardDetails
                label="New Board (Activated)"
                board={data.newBoard}
              />

              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full"
              >
                Replace Another Board
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="installationUuid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Installation UUID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., INS-12345678-1234-1234-1234-123456789012"
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        The installation that the chill device belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deviceUuid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device UUID (Chill)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., DEV-12345678-1234-1234-1234-123456789012"
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        The chill device that needs a new interface board
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newBoardEui64"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Board EUI-64</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                          placeholder="e.g., FEDCBA9876543210"
                          className="font-mono text-sm uppercase"
                        />
                      </FormControl>
                      <FormDescription>
                        EUI-64 identifier of the new interface board from
                        inventory (16 hex characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Replacing..." : "Replace Interface Board"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Board Replacement
            </DialogTitle>
            <DialogDescription>
              This will deactivate the current interface board and activate the
              new one. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {pendingData && (
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Installation</span>
                <span className="font-mono">
                  {pendingData.installationUuid}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Device</span>
                <span className="font-mono">{pendingData.deviceUuid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">New Board EUI-64</span>
                <span className="font-mono">
                  {pendingData.newBoardEui64.toUpperCase()}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Confirm Replacement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
