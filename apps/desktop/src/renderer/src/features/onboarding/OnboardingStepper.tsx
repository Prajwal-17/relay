import { ONBOARDING_STEP_LABELS } from "@/constants/renderer.constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "motion/react";

// Mirrors index.css tokens (motion cannot tween CSS vars directly, so values
// are duplicated — keep in sync with :root when tokens change).
const STEP_COLORS = {
  completed: "#25613c", // --success
  active: "#4b6cb0", // --brand
  inactive: "#eceae3", // --surface-2
  activeBorder: "#3b5690", // --brand-hover
  inactiveBorder: "#d8d5cc", // --border-standard
  activeText: "#ffffff", // --on-primary
  inactiveText: "#696c63" // --ink-subtle
};

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
                    ? STEP_COLORS.completed
                    : isActive
                      ? STEP_COLORS.active
                      : STEP_COLORS.inactive,
                  scale: isActive ? 1.1 : 1,
                  borderColor: isCompleted
                    ? STEP_COLORS.completed
                    : isActive
                      ? STEP_COLORS.activeBorder
                      : STEP_COLORS.inactiveBorder
                }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-sm font-semibold"
                )}
              >
                {isCompleted ? (
                  <Check className="text-success-foreground h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <span className={cn(isActive ? "text-foreground" : "text-muted-foreground")}>
                    {stepNum}
                  </span>
                )}
              </motion.div>
              <motion.span
                animate={{
                  color: isActive ? STEP_COLORS.activeText : STEP_COLORS.inactiveText
                }}
                className="text-xs font-medium whitespace-nowrap"
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
