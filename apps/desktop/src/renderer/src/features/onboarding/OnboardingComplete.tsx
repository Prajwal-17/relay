import { Button } from "@/components/ui/button";
import { useCompleteOnboarding } from "@/features/onboarding/hooks/useCompleteOnboarding";
import { useOnboardingStore } from "@/features/onboarding/onboarding.store";
import { ArrowRight, CheckCircle2, Loader2, MapPin, Store, User } from "lucide-react";
import { motion } from "motion/react";

export const OnboardingComplete = () => {
  const formData = useOnboardingStore((state) => state.formData);
  const completeOnboardingMutation = useCompleteOnboarding();

  const summaryItems = [
    {
      icon: Store,
      label: "Store",
      value: formData.storeName
    },
    {
      icon: User,
      label: "Owner",
      value: `${formData.ownerName}${formData.phone ? ` · ${formData.phone}` : ""}`
    },
    {
      icon: MapPin,
      label: "Location",
      value: [formData.city, formData.state, formData.country].filter(Boolean).join(", ")
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center gap-5 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
        className="relative"
      >
        <div className="bg-success/15 flex size-16 items-center justify-center rounded-full">
          <CheckCircle2 className="text-success size-9" strokeWidth={1.5} />
        </div>
        {/* rings */}
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{
              duration: 1.4,
              delay: 0.3 + i * 0.4,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: "easeOut"
            }}
            className="border-success/40 absolute inset-0 rounded-full border-2"
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col gap-2"
      >
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          You&apos;re all set! 🎉
        </h2>
        <p className="text-muted-foreground text-sm">
          Your store profile has been created. Here&apos;s a quick summary:
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="bg-card w-full rounded-(--radius-panel) border p-3 text-left"
      >
        <div className="flex flex-col divide-y">
          {summaryItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="bg-primary/10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                <Icon className="text-onboarding-icon-dark h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="text-foreground truncate text-sm font-medium">{value || "—"}</p>
              </div>
            </div>
          ))}
          {formData.gstin && (
            <div className="flex items-start gap-3 py-3 pb-0">
              <div className="bg-primary/10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                <span className="text-onboarding-icon-dark text-xs font-bold">GST</span>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">GSTIN</p>
                <p className="text-foreground font-mono text-sm font-medium tracking-wider">
                  {formData.gstin}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="w-full"
      >
        <Button
          size="default"
          onClick={() => completeOnboardingMutation.mutate()}
          disabled={completeOnboardingMutation.isPending}
          className="hover:bg-primary-hover group h-10 w-full gap-2 rounded-(--radius-control) text-sm font-semibold disabled:opacity-70"
        >
          {completeOnboardingMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Setting up your store...
            </>
          ) : (
            <>
              Start Using QuickCart
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};
