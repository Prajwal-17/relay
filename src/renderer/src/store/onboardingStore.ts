import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type OnboardingFormData = {
  // Step 2 — Store Identity
  storeName: string;

  // Step 3 — Owner & Contact
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;

  // Step 4 — Location & Compliance
  addressLine1: string;
  addressLine2: string;
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  city: string;
  pincode: string;
  gstin: string;
};

const defaultFormData: OnboardingFormData = {
  storeName: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  addressLine1: "",
  addressLine2: "",
  country: "",
  countryCode: "",
  state: "",
  stateCode: "",
  city: "",
  pincode: "",
  gstin: ""
};

type OnboardingStoreType = {
  isOnboardingComplete: boolean;
  currentStep: number;
  formData: OnboardingFormData;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  setFormData: (data: Partial<OnboardingFormData>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

export const useOnboardingStore = create<OnboardingStoreType>()(
  devtools(
    (set) => ({
      isOnboardingComplete: false,
      currentStep: 1,
      formData: defaultFormData,

      nextStep: () =>
        set((state) => ({ currentStep: state.currentStep + 1 }), false, "onboarding/nextStep"),

      prevStep: () =>
        set((state) => ({ currentStep: state.currentStep - 1 }), false, "onboarding/prevStep"),

      setStep: (step) => set(() => ({ currentStep: step }), false, "onboarding/setStep"),

      setFormData: (data) =>
        set(
          (state) => ({ formData: { ...state.formData, ...data } }),
          false,
          "onboarding/setFormData"
        ),

      completeOnboarding: () =>
        set(() => ({ isOnboardingComplete: true }), false, "onboarding/completeOnboarding"),

      resetOnboarding: () =>
        set(
          () => ({
            isOnboardingComplete: false,
            currentStep: 1,
            formData: defaultFormData
          }),
          false,
          "onboarding/resetOnboarding"
        )
    }),
    { name: "onboarding-store" }
  )
);
