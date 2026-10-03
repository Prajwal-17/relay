import relayAppIcon from "@assets/desktop/app-icon.svg";
import {
  ONBOARDING_FEATURES,
  ONBOARDING_STEPS,
  PRODUCT_NAME
} from "@/constants/renderer.constants";
import { useOnboardingStore } from "@/features/onboarding/onboarding.store";
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
      transition={{ duration: 0.2 }}
      className="bg-background-secondary fixed inset-0 z-50 flex items-stretch"
    >
      {/* left panel */}
      <div className="bg-onboarding-panel relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden p-8 lg:flex">
        <div className="relative z-10 flex items-center gap-3.5">
          <img
            src={relayAppIcon}
            alt={`${PRODUCT_NAME} logo`}
            className="size-10 rounded-(--radius-panel) object-contain"
          />
          <span className="text-onboarding-text text-xl font-bold tracking-tight">
            {PRODUCT_NAME}
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-onboarding-text text-4xl leading-tight font-bold">
              Billing made{" "}
              <span className="text-onboarding-text inline-block rounded-lg px-1">effortless</span>
            </h2>
            <p className="text-onboarding-text-muted text-sm leading-relaxed">
              Set up your store once. Track Customers, Generate invoices, and grow your business all
              without an internet connection.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {ONBOARDING_FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-3"
              >
                <div className="bg-onboarding-icon-bg flex size-8 shrink-0 items-center justify-center rounded-(--radius-control)">
                  <Icon className="text-onboarding-feature-text h-5 w-5" />
                </div>
                <span className="text-onboarding-feature-text text-sm font-medium">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-onboarding-text-footer relative z-10 text-sm">
          © {new Date().getFullYear()} Relay · Designed for local businesses
        </p>
      </div>

      {/* right panel */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 lg:p-8">
        <div className="w-full max-w-lg">
          {/* steps */}
          <AnimatePresence>
            {isFormStep && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-5"
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
