import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/store/onboardingStore";
import { storeIdentitySchema } from "@shared/schemas/onboarding.schema";
import { ArrowRight, Store } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export const StoreIdentityStep = () => {
  const { formData, setFormData, nextStep, prevStep } = useOnboardingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const result = storeIdentitySchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validate()) nextStep();
  };
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-3">
        <div className="bg-primary/15 flex h-13 w-13 items-center justify-center rounded-xl">
          <Store className="text-onboarding-icon-dark h-6 w-6" />
        </div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Your Store</h2>
        <p className="text-muted-foreground text-base">
          This will appear on all your invoices and receipts.
          <span className="text-muted-foreground/60 ml-1">
            (You can change this later in settings)
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="storeName" className="text-base font-medium">
            Store Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="storeName"
            ref={inputRef}
            value={formData.storeName}
            onChange={(e) => {
              setFormData({ storeName: e.target.value });
              if (errors.storeName) setErrors((prev) => ({ ...prev, storeName: "" }));
            }}
            className={`h-12 text-lg font-medium ${errors.storeName ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
          />
          {errors.storeName && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-xs"
            >
              {errors.storeName}
            </motion.p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={prevStep}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          size="lg"
          className="group shadow-primary/20 hover:shadow-primary/30 gap-2 rounded-xl px-7 text-base font-semibold shadow-md hover:shadow-lg"
        >
          Continue
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </div>
    </motion.div>
  );
};
