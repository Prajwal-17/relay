import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, Check } from "lucide-react-native";
import { useRef } from "react";
import type { TextInput } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { Text } from "@/components/ui/text";
import { getTodayIST, isFutureDate, parseLocalDate } from "@/lib/format/dates";
import { formatRupee } from "@/lib/format/money";
import { EntryPage } from "./components/entry-page";
import { EntryFooterSkeleton, MoneyEntrySkeleton } from "./components/money-skeletons";
import { PaymentForm } from "./components/payment-form";
import { VendorPaymentForm } from "./components/vendor-payment-form";
import { useEntryNavigation, useEntryRemovalGuard } from "./hooks/use-entry-navigation";
import { usePaymentEntry } from "./hooks/use-payment-entry";
import { useVendorPayment } from "./hooks/use-vendor-payment";
import { moneyEntryOptions, moneyWeekOptions } from "./money.queries";
import type {
  EditableReceivedEntry,
  EditableVendorPayment,
  LocalDate,
  MoneyWeek
} from "./money.types";
import { summarizeEntry } from "./money.utils";

function ReceivedEntry({
  date,
  method,
  week,
  initialEntry
}: {
  date: LocalDate;
  method: string;
  week: MoneyWeek;
  initialEntry?: EditableReceivedEntry;
}) {
  const amountRef = useRef<TextInput>(null);
  const navigation = useEntryNavigation(date);
  const entry = usePaymentEntry({
    date,
    method,
    paymentMethods: week.paymentMethods,
    dayEntry: week.days.find((day) => day.date === date)?.entry ?? null,
    onClose: navigation.finish,
    initialEntry
  });
  useEntryRemovalGuard(entry, navigation.finished);
  return (
    <EntryPage
      title={initialEntry ? "Edit received entry" : "Money received"}
      date={date}
      onBack={entry.goBack}
      saving={entry.saving}
      initialFocusRef={amountRef}
      footer={
        <AppButton
          icon={initialEntry ? Check : Plus}
          disabled={!entry.canSave}
          loading={entry.saving}
          loadingLabel="Saving…"
          onPress={() => void entry.save()}
        >
          {initialEntry
            ? "Save changes"
            : entry.canSave
              ? `Add ${formatRupee(entry.parsedAmount)}`
              : "Add entry"}
        </AppButton>
      }
    >
      <PaymentForm entry={entry} amountRef={amountRef} />
      {entry.isOffline ? (
        <Text accessibilityRole="alert" className="text-muted-foreground text-sm">
          Reconnect before saving this entry.
        </Text>
      ) : null}
      {entry.saveError ? (
        <Text accessibilityRole="alert" className="text-destructive text-sm">
          {entry.saveError}
        </Text>
      ) : null}
    </EntryPage>
  );
}

function VendorEntry({
  date,
  week,
  initialEntry
}: {
  date: LocalDate;
  week: MoneyWeek;
  initialEntry?: EditableVendorPayment;
}) {
  const amountRef = useRef<TextInput>(null);
  const navigation = useEntryNavigation(date);
  const dayEntry = week.days.find((day) => day.date === date)?.entry;
  const summary = dayEntry ? summarizeEntry(dayEntry) : null;
  const entry = useVendorPayment({
    date,
    onClose: navigation.finish,
    paidAmount: summary?.paidAmount ?? 0,
    initialEntry
  });
  useEntryRemovalGuard(entry, navigation.finished);
  return (
    <EntryPage
      title={initialEntry ? "Edit vendor payment" : "Pay vendor"}
      date={date}
      onBack={entry.goBack}
      saving={entry.saving}
      initialFocusRef={amountRef}
      footer={
        <AppButton
          icon={initialEntry ? Check : Plus}
          disabled={!entry.canSave}
          loading={entry.saving}
          loadingLabel="Saving…"
          onPress={() => void entry.save()}
        >
          {initialEntry ? "Save changes" : "Add payment"}
        </AppButton>
      }
    >
      <VendorPaymentForm form={entry} amountRef={amountRef} />
    </EntryPage>
  );
}

export default function MoneyEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    date?: string;
    kind?: string;
    method?: string;
    entryId?: string;
  }>();
  const date = parseLocalDate(params.date);
  const editing = params.entryId !== undefined;
  const id = Number(params.entryId);
  const kind = params.kind === "vendor" ? "vendor" : "received";
  const valid =
    date !== null &&
    (!editing || (Number.isSafeInteger(id) && id > 0)) &&
    !isFutureDate(date) &&
    (params.kind === "received" || params.kind === "vendor");
  const record = useQuery({ ...moneyEntryOptions(kind, id), enabled: valid && editing });
  const initialEntry = editing ? record.data : undefined;
  const recordInvalid = Boolean(
    initialEntry && (initialEntry.kind !== kind || initialEntry.date !== date)
  );
  const week = useQuery({
    ...moneyWeekOptions(date ?? getTodayIST()),
    enabled: valid
  });
  const pending = week.isPending || (editing && record.isPending);
  const ready = Boolean(week.data && (!editing || initialEntry));
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/money");
  };
  if (!valid || recordInvalid || !ready || !week.data)
    return (
      <EntryPage
        title={params.kind === "vendor" ? "Pay vendor" : "Money received"}
        date={date}
        onBack={back}
        footer={valid && !recordInvalid && pending ? <EntryFooterSkeleton /> : undefined}
      >
        {!valid || recordInvalid ? (
          <Text accessibilityRole="alert" className="text-destructive">
            Choose a valid date and entry type from Money.
          </Text>
        ) : pending ? (
          <MoneyEntrySkeleton vendor={params.kind === "vendor"} />
        ) : (
          <>
            <Text accessibilityRole="alert" className="text-destructive">
              {record.error instanceof Error
                ? record.error.message
                : week.error instanceof Error
                  ? week.error.message
                  : "Could not load this entry."}
            </Text>
            <AppButton
              variant="outline"
              loading={week.isFetching || record.isFetching}
              loadingLabel="Trying again…"
              onPress={() => {
                if (editing && !record.data) void record.refetch();
                if (!week.data) void week.refetch();
              }}
            >
              Try again
            </AppButton>
          </>
        )}
      </EntryPage>
    );
  return params.kind === "vendor" ? (
    <VendorEntry
      key={`${date}:${id}`}
      date={date}
      week={week.data}
      initialEntry={initialEntry?.kind === "vendor" ? initialEntry : undefined}
    />
  ) : (
    <ReceivedEntry
      key={`${date}:${params.method ?? "cash"}:${id}`}
      date={date}
      method={
        initialEntry?.kind === "received"
          ? initialEntry.paymentMethodId === null
            ? "cash"
            : String(initialEntry.paymentMethodId)
          : (params.method ?? "cash")
      }
      week={week.data}
      initialEntry={initialEntry?.kind === "received" ? initialEntry : undefined}
    />
  );
}
