import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Share2, ExternalLink, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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
import { useUpdateReferralEmail } from "../hooks/useUpdateReferralEmail";

const referralEmailFormSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email format"),
});

type ReferralEmailFormData = z.infer<typeof referralEmailFormSchema>;

export function ReferralRockEmailCard() {
  const form = useForm<ReferralEmailFormData>({
    resolver: zodResolver(referralEmailFormSchema),
    defaultValues: {
      userId: "",
      email: "",
    },
  });

  const { updateReferralEmail, isPending, isSuccess, data, reset } =
    useUpdateReferralEmail({
      onSuccess: () => {
        form.reset();
      },
    });

  const onSubmit = (formData: ReferralEmailFormData) => {
    updateReferralEmail(formData.userId, formData.email);
  };

  const handleReset = () => {
    reset();
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Referral Rock Email</CardTitle>
            <CardDescription>
              Update a user&apos;s email in Referral Rock
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isSuccess && data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Email updated successfully
              </span>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  New Email
                </span>
                <span className="font-medium">{data.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Referral URL
                </span>
                <a
                  href={data.referralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Open link
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <Button variant="outline" onClick={handleReset} className="w-full">
              Update Another Email
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., abc12345-1234-5678-90ab-cdef12345678"
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <FormDescription>The user ID (UUID format)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="newemail@example.com"
                      />
                    </FormControl>
                    <FormDescription>
                      The new email address for Referral Rock
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Updating..." : "Update Email"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
