import { ONBOARDING_FEATURES, ONBOARDING_STEPS, PRODUCT_NAME } from "@/constants";
import { useOnboardingStore } from "@/store/onboardingStore";
import { ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { OnboardingComplete } from "./OnboardingComplete";
import { OnboardingStepper } from "./OnboardingStepper";
import { LocationStep } from "./steps/LocationStep";
import { OwnerContactStep } from "./steps/OwnerContactStep";
import { StoreIdentityStep } from "./steps/StoreIdentityStep";
import { WelcomeStep } from "./steps/WelcomeStep";

const stepComponents: Record<number, React.ReactNode> = {
  1: <WelcomeStep />,
  2: <StoreIdentityStep />,
  3: <OwnerContactStep />,
  4: <LocationStep />,
  5: <OnboardingComplete />
};

export const OnboardingFlow = () => {
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const isWelcome = currentStep === 1;
  const isComplete = currentStep === ONBOARDING_STEPS;
  const isFormStep = !isWelcome && !isComplete;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-background-secondary fixed inset-0 z-50 flex items-stretch"
    >
      {/* left panel */}
      <div className="from-onboarding-gradient-start via-onboarding-gradient-mid to-onboarding-gradient-end relative hidden w-[44%] shrink-0 flex-col justify-between overflow-hidden bg-linear-to-br p-14 lg:flex">
        <div className="bg-primary pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full opacity-20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="bg-primary shadow-primary/40 flex h-12 w-12 items-center justify-center rounded-xl shadow-lg">
            <ShoppingCart className="h-6 w-6 text-black" strokeWidth={2} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">{PRODUCT_NAME}</span>
        </div>

        <div className="relative z-10 flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h2 className="text-5xl leading-tight font-bold text-white">
              Billing made{" "}
              <span className="text-primary inline-block rounded-lg px-1">effortless</span>
            </h2>
            <p className="text-onboarding-text-muted text-lg leading-relaxed">
              Set up your store once. Track Customers, Generate invoices, and grow your business all
              without an internet connection.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {ONBOARDING_FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-4"
              >
                <div className="bg-onboarding-icon-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Icon className="text-primary h-5 w-5" />
                </div>
                <span className="text-onboarding-feature-text text-base font-medium">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-onboarding-text-footer relative z-10 text-sm">
          © {new Date().getFullYear()} QuickCart · Designed for local businesses
        </p>
      </div>

      {/* right panel */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-10 lg:p-16">
        <div className="w-full max-w-lg">
          {/* steps */}
          <AnimatePresence>
            {isFormStep && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-10"
              >
                <OnboardingStepper currentStep={currentStep} totalSteps={ONBOARDING_STEPS} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* step content */}
          <AnimatePresence mode="wait">
            <div key={currentStep}>{stepComponents[currentStep]}</div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
