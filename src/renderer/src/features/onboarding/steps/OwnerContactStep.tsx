import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/store/onboardingStore";
import { ArrowRight, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export const OwnerContactStep = () => {
  const { formData, setFormData, nextStep, prevStep } = useOnboardingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "Owner name is required";
    }

    if (!formData.ownerPhone.trim()) {
      newErrors.ownerPhone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.ownerPhone.trim())) {
      newErrors.ownerPhone = "Enter a valid 10-digit Indian mobile number";
    }

    if (formData.ownerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = "Enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) nextStep();
  };

  const fields = [
    {
      id: "ownerName",
      label: "Owner Name",
      required: true,
      placeholder: "e.g. Rahul",
      value: formData.ownerName,
      onChange: (v: string) => setFormData({ ownerName: v }),
      type: "text"
    },
    {
      id: "ownerPhone",
      label: "Phone Number",
      required: true,
      placeholder: "e.g. 9876543210",
      value: formData.ownerPhone,
      onChange: (v: string) => setFormData({ ownerPhone: v }),
      type: "tel"
    },
    {
      id: "ownerEmail",
      label: "Email Address",
      required: true,
      placeholder: "e.g. rahul@example.com",
      value: formData.ownerEmail,
      onChange: (v: string) => setFormData({ ownerEmail: v }),
      type: "email"
    }
  ];

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
          <User className="text-onboarding-icon-dark h-6 w-6" />
        </div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Owner & Contact</h2>

        <p className="text-muted-foreground text-base">
          Printed on invoices as the contact information for your store. <br />
          <span className="text-muted-foreground/60 ml-1">
            (You can change this later in settings)
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1.5">
            <Label htmlFor={field.id} className="text-base font-medium">
              {field.label}{" "}
              {field.required ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="text-muted-foreground font-normal">(optional)</span>
              )}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => {
                field.onChange(e.target.value);
                if (errors[field.id]) setErrors((prev) => ({ ...prev, [field.id]: "" }));
              }}
              className={`h-12 text-xl font-medium ${errors[field.id] ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            />
            {errors[field.id] && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-xs"
              >
                {errors[field.id]}
              </motion.p>
            )}
          </div>
        ))}
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
