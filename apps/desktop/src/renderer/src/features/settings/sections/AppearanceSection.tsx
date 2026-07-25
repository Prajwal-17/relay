import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SettingsField } from "../SettingsField";
import { SettingsSection } from "../SettingsSection";

const DESCRIPTION = "Customize the appearance of the app.";

const STEP_PERCENT = 1;

function factorToPercent(factor: number): number {
  return Math.round(factor * 100);
}

function percentToFactor(percent: number): number {
  return percent / 100;
}

export const AppearanceSection = () => {
  const [zoom, setZoom] = useState<number | null>(null);
  const [bounds, setBounds] = useState<{ min: number; max: number; default: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sliderPercent, setSliderPercent] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [zoomResult, boundsResult] = await Promise.all([
          window.zoomApi.getZoom(),
          window.zoomApi.getBounds()
        ]);
        setZoom(zoomResult.zoomFactor);
        setSliderPercent(factorToPercent(zoomResult.zoomFactor));
        setBounds(boundsResult);
      } catch (err) {
        console.error("Failed to load zoom settings", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSliderDrag = useCallback((value: number[]) => {
    setSliderPercent(value[0]!);
  }, []);

  const handleSliderCommit = useCallback(async (value: number[]) => {
    const percent = value[0]!;
    const factor = percentToFactor(percent);
    try {
      await window.zoomApi.setZoom(factor);
      setZoom(factor);
    } catch (err) {
      console.error("Failed to set zoom", err);
    }
  }, []);

  const handleReset = useCallback(async () => {
    const defaultZoom = bounds?.default ?? 1;
    const defaultPercent = factorToPercent(defaultZoom);
    setSliderPercent(defaultPercent);
    setZoom(defaultZoom);
    try {
      await window.zoomApi.setZoom(defaultZoom);
    } catch (err) {
      console.error("Failed to reset zoom", err);
    }
  }, [bounds]);

  if (loading || bounds === null || zoom === null || sliderPercent === null) {
    return (
      <SettingsSection title="Appearance" description={DESCRIPTION}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      </SettingsSection>
    );
  }

  const minPercent = factorToPercent(bounds.min);
  const maxPercent = factorToPercent(bounds.max);

  return (
    <SettingsSection title="Appearance" description={DESCRIPTION}>
      <SettingsField
        label="Zoom level"
        hint="100% is recommended. Use zoom only for personal readability."
        defaultValue="100%"
        onReset={handleReset}
      >
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground w-12 text-right text-sm tabular-nums">
            {minPercent}%
          </span>
          <Slider
            value={[sliderPercent]}
            min={minPercent}
            max={maxPercent}
            step={STEP_PERCENT}
            onValueChange={handleSliderDrag}
            onValueCommit={handleSliderCommit}
            className="flex-1"
          />
          <span className="text-muted-foreground w-12 text-sm tabular-nums">{maxPercent}%</span>
        </div>
        <div className="mt-1 text-center">
          <span className="text-foreground text-sm font-semibold tabular-nums">
            {sliderPercent}%
          </span>
        </div>
      </SettingsField>
    </SettingsSection>
  );
};
