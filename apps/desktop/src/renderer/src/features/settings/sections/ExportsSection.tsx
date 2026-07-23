import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { FolderOpen, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { SettingsField } from "../SettingsField";
import { SettingsSection } from "../SettingsSection";
import { useAppPreferences } from "../../../hooks/useAppPreferences";

const inputClass = "text-sm font-medium";
const selectTriggerClass = "w-full text-sm";
const DESCRIPTION = "Where your files are saved.";
const RESETTABLE_FIELDS_COUNT = 3;

export const ExportsSection = () => {
  const { config, defaults, isLoading, updateConfig, resetSection, isUpdating, isResetting } =
    useAppPreferences();
  const [isBrowsing, setIsBrowsing] = useState(false);

  if (isLoading || !config) {
    return (
      <SettingsSection title="Exports & Storage" description={DESCRIPTION}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      </SettingsSection>
    );
  }

  const handleBrowseFolder = async () => {
    setIsBrowsing(true);
    try {
      const folderPath = await window.dialogApi.selectFolder();
      if (folderPath) {
        updateConfig({ exports: { defaultPdfLocation: folderPath } });
      }
    } catch {
      toast.error("Failed to open folder picker");
    } finally {
      setIsBrowsing(false);
    }
  };

  return (
    <SettingsSection
      title="Exports & Storage"
      description={DESCRIPTION}
      resettableFieldsCount={RESETTABLE_FIELDS_COUNT}
      onResetSection={() => resetSection("exports")}
      isResetting={isResetting}
    >
      <SettingsField
        label="Ask before saving PDF"
        hint="Ask where to save each time."
        defaultValue={defaults?.exports.askBeforeSavingPdf ? "On" : "Off"}
        onReset={() =>
          defaults &&
          updateConfig({ exports: { askBeforeSavingPdf: defaults.exports.askBeforeSavingPdf } })
        }
        isResetting={isUpdating}
      >
        <div className="flex h-9 items-center">
          <Switch
            id="settings-ask-before-saving"
            checked={config.exports.askBeforeSavingPdf}
            onCheckedChange={(checked) =>
              updateConfig({ exports: { askBeforeSavingPdf: checked } })
            }
            disabled={isUpdating}
          />
        </div>
      </SettingsField>

      <SettingsField
        label="Default PDF save location"
        hint="Where your PDFs are saved."
        defaultValue={defaults?.exports.defaultPdfLocation}
        onReset={() =>
          defaults &&
          updateConfig({ exports: { defaultPdfLocation: defaults.exports.defaultPdfLocation } })
        }
        isResetting={isUpdating}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="settings-pdf-location"
            className={cn(inputClass, "text-muted-foreground cursor-default")}
            value={config.exports.defaultPdfLocation || "No folder selected"}
            readOnly
            tabIndex={-1}
          />
          <Button
            id="settings-browse-folder"
            variant="outline"
            className="shrink-0 px-3 text-sm"
            onClick={handleBrowseFolder}
            disabled={isBrowsing || isUpdating}
          >
            {isBrowsing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FolderOpen className="size-4" />
            )}
            {isBrowsing ? "Opening…" : "Browse"}
          </Button>
        </div>
      </SettingsField>

      <SettingsField
        label="Default export format"
        hint="What file type to use."
        defaultValue={defaults?.exports.defaultExportFormat.toUpperCase()}
        onReset={() =>
          defaults &&
          updateConfig({ exports: { defaultExportFormat: defaults.exports.defaultExportFormat } })
        }
        isResetting={isUpdating}
      >
        <Select
          value={config.exports.defaultExportFormat}
          onValueChange={(format) => updateConfig({ exports: { defaultExportFormat: format } })}
          disabled={isUpdating}
        >
          <SelectTrigger id="settings-export-format" className={selectTriggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF</SelectItem>
          </SelectContent>
        </Select>
      </SettingsField>
    </SettingsSection>
  );
};
