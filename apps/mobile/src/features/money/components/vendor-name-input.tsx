import { Pressable } from "@/components/ui/pressable";
import { usePalette } from "@/theme/palette";
import { AppTextInput } from "@/components/ui/app-text-input";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Text } from "@/components/ui/text";

import { listRecentVendorNames } from "@/features/money/money.repository";
import { cn } from "@/lib/utils";
import { moneyKeys } from "@/features/money/money.keys";

export function VendorNameInput({
  value,
  error,
  disabled = false,
  onChangeText
}: {
  value: string;
  error?: string;
  disabled?: boolean;
  onChangeText: (value: string) => void;
}) {
  const colors = usePalette();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = useQuery({
    queryKey: moneyKeys.vendors(value),
    queryFn: ({ signal }) => listRecentVendorNames(value, signal),
    enabled: open,
    staleTime: 30_000
  });
  const names = suggestions.data ?? [];
  const loading = suggestions.isPending;
  const failed = suggestions.isError;

  function showSuggestions() {
    setOpen(true);
    setActive(-1);
  }

  function select(name: string) {
    onChangeText(name);
    setOpen(false);
    void Haptics.selectionAsync().catch(() => {});
  }

  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <View className="gap-1.5">
      <Text className="text-ink text-sm font-medium">Vendor name</Text>
      <View
        className={cn(
          "bg-surface rounded-control border",
          error ? "border-destructive" : open ? "border-accent" : "border-border"
        )}
      >
        <View className="flex-row items-center">
          <AppTextInput
            variant="bare"
            editable={!disabled}
            accessibilityLabel="Vendor name"
            maxLength={120}
            aria-invalid={Boolean(error)}
            className="text-ink min-h-12 min-w-0 flex-1 px-3 text-base outline-none"
            placeholder="Enter vendor name"
            selectionColor={colors["accent"]}
            value={value}
            onFocus={() => {
              if (!open) showSuggestions();
            }}
            onChangeText={(name) => {
              onChangeText(name);
              showSuggestions();
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Escape") setOpen(false);
              if (!open || loading || !names.length) return;
              if (nativeEvent.key === "ArrowDown")
                setActive((index) => Math.min(index + 1, names.length - 1));
              if (nativeEvent.key === "ArrowUp") setActive((index) => Math.max(index - 1, 0));
              if (nativeEvent.key === "Enter" && active >= 0 && names[active])
                select(names[active]);
            }}
          />
          <Pressable
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Recent vendors"
            accessibilityState={{ expanded: open }}
            onPress={() => (open ? setOpen(false) : showSuggestions())}
            className="min-h-12 min-w-12 items-center justify-center"
          >
            <Chevron size={18} color={colors["muted"]} />
          </Pressable>
        </View>
        {open ? (
          <View className="border-border border-t">
            {loading ? (
              <ActivityIndicator
                accessibilityLabel="Loading vendors"
                color={colors["accent"]}
                className="p-3"
              />
            ) : failed ? (
              <Text className="text-muted px-3 py-3 text-sm">Recent vendors unavailable</Text>
            ) : names.length ? (
              names.map((name, index) => (
                <Pressable
                  disabled={disabled}
                  key={name}
                  accessibilityRole="button"
                  accessibilityLabel={`Use vendor ${name}`}
                  accessibilityState={{ selected: active === index }}
                  onPress={() => select(name)}
                  className={cn(
                    "active:bg-hover min-h-12 justify-center px-3 py-3",
                    active === index && "bg-selected"
                  )}
                >
                  <Text className="text-ink text-base font-semibold">{name}</Text>
                </Pressable>
              ))
            ) : (
              <Text className="text-muted px-3 py-3 text-sm">
                {value.trim() ? "No matches" : "No recent vendors"}
              </Text>
            )}
          </View>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-destructive text-sm">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
