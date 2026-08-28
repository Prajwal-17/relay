import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type OnboardingFormData = {
  storeName: string;

  ownerName: string;
  phone: string;
  email: string;

  addressLine1: string;
  addressLine2: string;
  country: string;
  countryCode?: string;
  state: string;
  stateCode?: string;
  city: string;
  pincode: string;
  gstin: string;
};

const defaultFormData: OnboardingFormData = {
  storeName: "",
  ownerName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  country: "India",
  countryCode: "IN",
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
