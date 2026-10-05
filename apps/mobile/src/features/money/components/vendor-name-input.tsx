import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, Plus, RefreshCw, Search } from "lucide-react-native";
import { useEffect, useId, useRef, useState, type Ref } from "react";
import { ScrollView, View, type TextInput, type TextInputProps } from "react-native";

import { AppTextInput } from "@/components/ui/app-text-input";
import { AppButton } from "@/components/ui/app-button";
import { Pressable } from "@/components/ui/pressable";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { vendorNamesOptions } from "@/features/money/money.queries";
import { cn } from "@/lib/utils";
import { usePalette } from "@/theme/palette";

export function VendorNameInput({
  value,
  error,
  disabled = false,
  onChangeText,
  inputRef,
  autoFocus = true,
  onSubmitEditing
}: {
  value: string;
  error?: string;
  disabled?: boolean;
  onChangeText: (value: string) => void;
  inputRef?: Ref<TextInput>;
  autoFocus?: boolean;
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
}) {
  const colors = usePalette();
  const resultsId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef<ScrollView>(null);
  const rowLayouts = useRef(new Map<number, { y: number; height: number }>());
  const nameDraft = value.trim();
  const expanded = open && !disabled;
  const suggestions = useQuery({
    ...vendorNamesOptions(),
    enabled: expanded
  });
  const names = (suggestions.data ?? []).filter((name) =>
    name.toLowerCase().includes(nameDraft.toLowerCase())
  );
  const loading = suggestions.isPending;
  const failed = !loading && suggestions.isError;
  const exactMatch = names.some((name) => name.trim().toLowerCase() === nameDraft.toLowerCase());
  const canCreate = Boolean(nameDraft) && !exactMatch && !loading && !failed;
  const optionCount = names.length + (canCreate ? 1 : 0);
  useEffect(() => {
    const row = rowLayouts.current.get(active);
    if (row && active < names.length) {
      listRef.current?.scrollTo({ y: Math.max(0, row.y + row.height - 240), animated: false });
    }
  }, [active, names.length]);

  function showSuggestions() {
    setOpen(true);
    setActive(-1);
  }

  function select(name: string) {
    if (disabled) return;
    onChangeText(name);
    setOpen(false);
    setActive(-1);
  }

  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <View className="gap-1.5">
      <Text className="text-foreground text-sm font-medium">Vendor name</Text>
      <View
        className={cn(
          "bg-card rounded-control overflow-hidden border",
          error ? "border-destructive" : expanded ? "border-counter-accent" : "border-border"
        )}
      >
        <View className="flex-row items-center">
          <View className="pl-3">
            <Search size={18} color={colors["muted-foreground"]} />
          </View>
          <AppTextInput
            ref={inputRef}
            variant="bare"
            editable={!disabled}
            accessibilityRole="combobox"
            accessibilityLabel="Vendor name"
            accessibilityHint="Search existing vendors or add the entered name below"
            accessibilityState={{ expanded, disabled }}
            autoFocus={autoFocus}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={(event) => {
              if (disabled) return;
              if (expanded && !loading && active >= 0 && active < optionCount) {
                select(active < names.length ? names[active]! : nameDraft);
                return;
              }
              setOpen(false);
              onSubmitEditing?.(event);
            }}
            maxLength={120}
            aria-invalid={Boolean(error)}
            className="text-foreground min-h-12 min-w-0 flex-1 px-3 text-base outline-none"
            placeholder="Search or add a vendor"
            value={value}
            onFocus={() => {
              if (!expanded) showSuggestions();
            }}
            onChangeText={(name) => {
              onChangeText(name);
              showSuggestions();
            }}
            onKeyPress={(event) => {
              const key = event.nativeEvent.key;
              if (key === "Escape") {
                setOpen(false);
                setActive(-1);
              }
              if (key !== "ArrowDown" && key !== "ArrowUp") return;
              event.preventDefault();
              if (!expanded) {
                showSuggestions();
                return;
              }
              if (loading || failed || !optionCount) return;
              setActive((index) =>
                key === "ArrowDown" ? Math.min(index + 1, optionCount - 1) : Math.max(index - 1, 0)
              );
            }}
          />
          <Pressable
            disabled={disabled}
            accessibilityLabel={expanded ? "Hide vendors" : "Show vendors"}
            accessibilityState={{ expanded }}
            onPress={() => (expanded ? setOpen(false) : showSuggestions())}
            className="min-h-12 min-w-12 items-center justify-center"
          >
            <Chevron size={18} color={colors["muted-foreground"]} />
          </Pressable>
        </View>
        {expanded ? (
          <View
            nativeID={resultsId}
            testID="vendor-search-results"
            className="border-border border-t"
          >
            {loading ? (
              <View accessibilityLabel="Loading" className="gap-4 px-3 py-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </View>
            ) : failed ? (
              <View className="px-3 py-2">
                <Text accessibilityRole="alert" className="text-muted-foreground text-sm">
                  Could not find vendors.
                </Text>
                <Pressable
                  accessibilityLabel="Retry vendor search"
                  onPress={() => void suggestions.refetch()}
                  className="min-h-12 justify-center"
                >
                  <Text className="text-foreground text-sm font-semibold">Retry</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {names.length ? (
                  <ScrollView
                    ref={listRef}
                    style={{ maxHeight: 240, flexGrow: 0 }}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {names.map((name, index) => (
                      <Pressable
                        key={name}
                        onLayout={({ nativeEvent }) =>
                          rowLayouts.current.set(index, nativeEvent.layout)
                        }
                        accessibilityLabel={`Use vendor ${name}`}
                        accessibilityState={{ selected: value === name }}
                        onPress={() => select(name)}
                        className={cn(
                          "active:bg-hover min-h-12 flex-row items-center gap-3 px-3 py-3",
                          index > 0 && "border-border border-t",
                          active === index && "bg-selected"
                        )}
                      >
                        <Text className="text-foreground min-w-0 flex-1 text-base">{name}</Text>
                        {value === name ? <Check size={18} color={colors.foreground} /> : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <Text className="text-muted-foreground px-3 py-3 text-sm">
                    {nameDraft ? "No matching vendors" : "No recent vendors"}
                  </Text>
                )}
                {canCreate ? (
                  <Pressable
                    accessibilityLabel={`Add vendor ${nameDraft}`}
                    accessibilityHint="Uses this new name for the payment"
                    onPress={() => select(nameDraft)}
                    className={cn(
                      "border-border active:bg-hover min-h-12 flex-row items-center gap-2 border-t px-3 py-3",
                      active === names.length && "bg-selected"
                    )}
                  >
                    <Plus size={18} color={colors.foreground} />
                    <Text className="text-foreground min-w-0 flex-1 text-sm font-semibold">
                      Add vendor “{nameDraft}”
                    </Text>
                  </Pressable>
                ) : null}
                <AppButton
                  compact
                  variant="ghost"
                  icon={RefreshCw}
                  loading={suggestions.isFetching}
                  loadingLabel="Loading"
                  accessibilityLabel="Refresh vendors"
                  disabled={suggestions.isFetching}
                  onPress={() => {
                    setActive(-1);
                    void suggestions.refetch();
                  }}
                  className="border-border rounded-none border-t"
                >
                  Refresh vendors
                </AppButton>
              </>
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
