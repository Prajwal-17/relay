import { ONBOARDING_STEP_LABELS } from "@/constants/renderer.constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "motion/react";

type OnboardingStepperProps = {
  currentStep: number;
  totalSteps: number;
};

export const OnboardingStepper = ({ currentStep, totalSteps }: OnboardingStepperProps) => {
  // stepper shown for steps 2-4
  const formStep = currentStep - 1;
  const formStepsTotal = totalSteps - 1;

  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: formStepsTotal }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = formStep > stepNum;
        const isActive = formStep === stepNum;
        const label = ONBOARDING_STEP_LABELS[i + 1]; // +1 to skip "Welcome"

        return (
          <div key={stepNum} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-sm font-semibold",
                  isCompleted && "border-success bg-onboarding-step-complete text-white",
                  isActive && "border-focus bg-onboarding-step-active text-white",
                  !isCompleted &&
                    !isActive &&
                    "border-onboarding-step-border bg-onboarding-step-inactive text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="text-success-foreground h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <span>{stepNum}</span>
                )}
              </motion.div>
              <motion.span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </motion.span>
            </div>

            {stepNum < formStepsTotal && (
              <div className="bg-border mx-3 mb-5 h-0.5 w-12 overflow-hidden rounded-full">
                <motion.div
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  initial={{ scaleX: 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="bg-onboarding-step-complete h-full origin-left rounded-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
