import { Button } from "@/components/ui/button";
import { FEATURE_PILLS, PRODUCT_NAME } from "@/constants";
import { useOnboardingStore } from "@/store/onboardingStore";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";

export const WelcomeStep = () => {
  const nextStep = useOnboardingStore((state) => state.nextStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center gap-8 text-center"
    >
      {/* logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        className="relative"
      >
        <div className="bg-primary shadow-primary/30 flex h-28 w-28 items-center justify-center rounded-3xl shadow-xl">
          <ShoppingCart className="h-14 w-14 text-black" strokeWidth={1.8} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col gap-3"
      >
        <h1 className="text-foreground text-5xl font-bold tracking-tight">
          Welcome to <span className="text-primary drop-shadow-sm">{PRODUCT_NAME}</span>
        </h1>
        <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
          Your all in one billing companion. Let&apos;s take 2 minutes to set up your store before
          you start creating invoices.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-wrap justify-center gap-2"
      >
        {FEATURE_PILLS.map((feat) => (
          <span
            key={feat}
            className="border-primary/30 bg-primary/10 text-foreground rounded-full border px-4 py-1.5 text-sm font-medium"
          >
            {feat}
          </span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        <Button
          size="lg"
          onClick={nextStep}
          className="group shadow-primary/30 hover:shadow-primary/40 h-14 gap-2 rounded-xl px-10 text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          Get Started
          <ArrowRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
