import { ONBOARDING_STEP_LABELS } from "@/constants";
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
                animate={{
                  backgroundColor: isCompleted
                    ? "oklch(69.72% 0.209 145.47)"
                    : isActive
                      ? "oklch(87.67% 0.165 90.15)"
                      : "oklch(0.967 0.0029 264.5419)",
                  scale: isActive ? 1.1 : 1,
                  borderColor: isCompleted
                    ? "oklch(69.72% 0.209 145.47)"
                    : isActive
                      ? "oklch(77.55% 0.174 90.04)"
                      : "oklch(82% 0.006 286.286)"
                }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border-2 text-base font-semibold"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                ) : (
                  <span className={cn(isActive ? "text-black" : "text-muted-foreground")}>
                    {stepNum}
                  </span>
                )}
              </motion.div>
              <motion.span
                animate={{
                  color: isActive ? "oklch(0.2795 0.0368 260.031)" : "oklch(0.551 0.0234 264.3637)"
                }}
                className="text-sm font-medium whitespace-nowrap"
              >
                {label}
              </motion.span>
            </div>

            {stepNum < formStepsTotal && (
              <div className="bg-border mx-4 mb-6 h-0.5 w-16 overflow-hidden rounded-full">
                <motion.div
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  initial={{ scaleX: 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="bg-success h-full origin-left rounded-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
