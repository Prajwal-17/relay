import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCompleteOnboarding } from "@/hooks/onboarding/useCompleteOnboarding";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboardingStore";
import { locationSchema } from "@shared/schemas/onboarding.schema";
import { City, State } from "country-state-city";
import { ArrowRight, Check, ChevronsUpDown, Loader2, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

export const LocationStep = () => {
  const { formData, setFormData, prevStep } = useOnboardingStore();
  const mutation = useCompleteOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  useEffect(() => {
    if (formData.countryCode !== "IN") {
      setFormData({ countryCode: "IN", country: "India" });
    }
  }, []);

  const statesForIndia = useMemo(() => State.getStatesOfCountry("IN"), []);

  const citiesForState = useMemo(
    () => (formData.stateCode ? City.getCitiesOfState("IN", formData.stateCode) : []),
    [formData.stateCode]
  );

  const validate = () => {
    const result = locationSchema.safeParse(formData);
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
    if (validate()) mutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3">
        <div className="bg-primary/15 flex h-13 w-13 items-center justify-center rounded-xl">
          <MapPin className="text-onboarding-icon-dark h-6 w-6" />
        </div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Location & Compliance</h2>
        <p className="text-muted-foreground text-base">
          Your store address and tax registration details.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressLine1" className="text-base font-medium">
            Address Line 1 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="addressLine1"
            placeholder="e.g. 12, MG Road"
            value={formData.addressLine1}
            onChange={(e) => {
              setFormData({ addressLine1: e.target.value });
              if (errors.addressLine1) setErrors((prev) => ({ ...prev, addressLine1: "" }));
            }}
            className={`h-12 text-lg font-medium ${errors.addressLine1 ? "border-destructive" : ""}`}
          />
          {errors.addressLine1 && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-xs"
            >
              {errors.addressLine1}
            </motion.p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressLine2" className="text-base font-medium">
            Address Line 2 <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="addressLine2"
            placeholder="e.g. Near Town Hall"
            value={formData.addressLine2}
            onChange={(e) => setFormData({ addressLine2: e.target.value })}
            className="h-12 text-base"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-base font-medium">Country</Label>
          <Input
            value="India"
            disabled
            className="disabled:bg-muted/50 disabled:text-muted-foreground h-12 text-base font-medium opacity-100 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-base font-medium">
              State <span className="text-destructive">*</span>
            </Label>
            <Popover open={stateOpen} onOpenChange={setStateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={stateOpen}
                  className={cn(
                    "h-12 w-full justify-between text-base font-normal",
                    !formData.stateCode && "text-muted-foreground",
                    errors.state && "border-destructive"
                  )}
                >
                  <span className="truncate">
                    {formData.stateCode
                      ? statesForIndia.find((state) => state.isoCode === formData.stateCode)?.name
                      : "Select state..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search state..." />
                  <CommandList>
                    <CommandEmpty>No state found.</CommandEmpty>
                    <CommandGroup>
                      {statesForIndia.map((state) => (
                        <CommandItem
                          key={state.isoCode}
                          value={state.name}
                          onSelect={() => {
                            setFormData({ stateCode: state.isoCode, state: state.name, city: "" });
                            setErrors((prev) => ({ ...prev, state: "" }));
                            setStateOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              formData.stateCode === state.isoCode ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{state.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.state && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-xs"
              >
                {errors.state}
              </motion.p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-base font-medium">
              City <span className="text-destructive">*</span>
            </Label>
            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={cityOpen}
                  disabled={!formData.stateCode}
                  className={cn(
                    "h-12 w-full justify-between text-base font-normal",
                    !formData.city && "text-muted-foreground",
                    errors.city && "border-destructive"
                  )}
                >
                  <span className="truncate">
                    {formData.city ||
                      (formData.stateCode ? "Select city..." : "Select state first")}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search city..." />
                  <CommandList>
                    <CommandEmpty>No city found.</CommandEmpty>
                    <CommandGroup>
                      {citiesForState.map((city) => (
                        <CommandItem
                          key={city.name}
                          value={city.name}
                          onSelect={(currentValue) => {
                            const selectedCity = citiesForState.find(
                              (c) => c.name.toLowerCase() === currentValue.toLowerCase()
                            );
                            if (selectedCity) {
                              setFormData({ city: selectedCity.name });
                              setErrors((prev) => ({ ...prev, city: "" }));
                              setCityOpen(false);
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              formData.city === city.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{city.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.city && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-xs"
              >
                {errors.city}
              </motion.p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pincode" className="text-base font-medium">
              Pincode <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pincode"
              placeholder="e.g. 560001"
              maxLength={6}
              value={formData.pincode}
              onChange={(e) => {
                setFormData({ pincode: e.target.value.replace(/\D/g, "") });
                if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: "" }));
              }}
              className={`h-12 text-base ${errors.pincode ? "border-destructive" : ""}`}
            />
            {errors.pincode && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-xs"
              >
                {errors.pincode}
              </motion.p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gstin" className="text-base font-medium">
              GSTIN <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="gstin"
              placeholder="e.g. 29ABCDE1234F1Z5"
              maxLength={15}
              value={formData.gstin}
              onChange={(e) => {
                setFormData({ gstin: e.target.value.toUpperCase() });
                if (errors.gstin) setErrors((prev) => ({ ...prev, gstin: "" }));
              }}
              className={`h-12 font-mono text-base tracking-wider ${errors.gstin ? "border-destructive" : ""}`}
            />
            {errors.gstin && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-xs"
              >
                {errors.gstin}
              </motion.p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
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
          disabled={mutation.isPending}
          size="lg"
          className="group shadow-primary/20 hover:shadow-primary/30 gap-2 rounded-xl px-7 text-base font-semibold shadow-md hover:shadow-lg"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Finish Setup
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};
