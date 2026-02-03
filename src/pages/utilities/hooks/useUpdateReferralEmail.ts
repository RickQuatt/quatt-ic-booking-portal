import { toast } from "sonner";
import { $api } from "@/openapi-client/context";
import type { components } from "@/openapi-client/types/api/v1";

type ReferralMember = components["schemas"]["ReferralMember"];

interface UseUpdateReferralEmailOptions {
  onSuccess?: (result: ReferralMember) => void;
}

export function useUpdateReferralEmail({
  onSuccess,
}: UseUpdateReferralEmailOptions = {}) {
  const mutation = $api.useMutation(
    "patch",
    "/admin/users/{userId}/referral-email",
    {
      onSuccess: (response) => {
        toast.success("Referral email updated successfully");
        onSuccess?.(response.result);
      },
      onError: (error) => {
        // Extract error code from response if available
        const errorResponse = error as {
          result?: { errorCode?: string };
        };
        const errorCode = errorResponse?.result?.errorCode;

        switch (errorCode) {
          case "USER_NOT_FOUND":
            toast.error("User not found");
            break;
          case "USER_NO_REFERRAL":
            toast.error("User has no Referral Rock member account");
            break;
          case "REFERRAL_MEMBER_EMAIL_ALREADY_EXISTS":
            toast.error("A referral member with this email already exists");
            break;
          default:
            toast.error("Failed to update referral email");
        }
        console.error("Referral email update error:", error);
      },
    },
  );

  const updateReferralEmail = (userId: string, email: string) => {
    mutation.mutate({
      params: { path: { userId } },
      body: { email },
    });
  };

  return {
    updateReferralEmail,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    data: mutation.data?.result,
    reset: mutation.reset,
  };
}
