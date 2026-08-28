import { ErrorState } from "@/components/app-ui/ErrorState";
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
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setLoadError(false);
      try {
        const [zoomResult, boundsResult] = await Promise.all([
          window.zoomApi.getZoom(),
          window.zoomApi.getBounds()
        ]);
        setZoom(zoomResult.zoomFactor);
        setSliderPercent(factorToPercent(zoomResult.zoomFactor));
        setBounds(boundsResult);
      } catch (err) {
        setLoadError(true);
        console.error("Failed to load zoom settings", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadAttempt]);

  const handleSliderDrag = useCallback((value: number[]) => {
    setSliderPercent(value[0]!);
  }, []);

  const handleSliderCommit = useCallback(
    async (value: number[]) => {
      const percent = value[0]!;
      const factor = percentToFactor(percent);
      try {
        await window.zoomApi.setZoom(factor);
        setZoom(factor);
        setActionError(false);
      } catch (err) {
        setSliderPercent(factorToPercent(zoom ?? 1));
        setActionError(true);
        console.error("Failed to set zoom", err);
      }
    },
    [zoom]
  );

  const handleReset = useCallback(async () => {
    const defaultZoom = bounds?.default ?? 1;
    const defaultPercent = factorToPercent(defaultZoom);
    const confirmedPercent = factorToPercent(zoom ?? 1);
    setSliderPercent(defaultPercent);
    try {
      await window.zoomApi.setZoom(defaultZoom);
      setZoom(defaultZoom);
      setActionError(false);
    } catch (err) {
      setSliderPercent(confirmedPercent);
      setActionError(true);
      console.error("Failed to reset zoom", err);
    }
  }, [bounds, zoom]);

  if (loadError) {
    return (
      <SettingsSection title="Appearance" description={DESCRIPTION}>
        <ErrorState
          layout="panel"
          className="rounded-none border-0"
          title="Appearance settings could not be loaded"
          description="Try loading the zoom controls again."
          primaryAction={{
            label: "Try again",
            onClick: () => setLoadAttempt((value) => value + 1)
          }}
        />
      </SettingsSection>
    );
  }

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
      {actionError && (
        <ErrorState
          layout="compact"
          title="Zoom could not be changed"
          description="The control was returned to the last confirmed zoom level."
        />
      )}
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
