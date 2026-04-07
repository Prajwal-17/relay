import { apiClient } from "@/lib/apiClient";
import { useOnboardingStore } from "@/store/onboardingStore";
import { onboardingSchema } from "@shared/schemas/onboarding.schema";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { z } from "zod";

type OnboardingPayload = z.infer<typeof onboardingSchema>;

export const useCompleteOnboarding = () => {
  const formData = useOnboardingStore((state) => state.formData);
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: OnboardingPayload = {
        storeName: formData.storeName,
        ownerName: formData.ownerName,
        phone: formData.phone,
        email: formData.email,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 || null,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        gstin: formData.gstin || null
      };

      return apiClient.post("/api/onboarding", payload);
    },
    onSuccess: () => {
      completeOnboarding();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return mutation;
};
