import { usePalette } from "@/theme/palette";
import { AppTextInput } from "@/components/ui/app-text-input";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Archive,
  ArrowLeft,
  Check,
  LockKeyhole,
  Pencil,
  Plus,
  RotateCcw,
  X
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/ui/safe-area-view";

import { PaymentIcon } from "@/features/money/components/payment-icon";
import { AppButton } from "@/components/ui/app-button";
import { IconButton } from "@/components/ui/icon-button";
import {
  createOnlineChannel,
  listOnlineChannels,
  renameOnlineChannel,
  setOnlineChannelArchived
} from "@/features/money/money.repository";
import type { OnlineChannel } from "@/features/money/money.types";

export default function ChannelsScreen() {
  const colors = usePalette();
  const db = useSQLiteContext();
  const router = useRouter();
  const [channels, setChannels] = useState<OnlineChannel[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    setError(null);
    try {
      setChannels(await listOnlineChannels(db, true));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load channels.");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void loadChannels();
    }, [loadChannels])
  );

  async function addChannel() {
    setWorkingId("new");
    setError(null);
    try {
      await createOnlineChannel(db, newName);
      setNewName("");
      await loadChannels();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not add channel.");
    } finally {
      setWorkingId(null);
    }
  }

  async function saveRename(channel: OnlineChannel) {
    setWorkingId(channel.id);
    setError(null);
    try {
      await renameOnlineChannel(db, channel.id, editingName);
      setEditingId(null);
      setEditingName("");
      await loadChannels();
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Could not rename channel.");
    } finally {
      setWorkingId(null);
    }
  }

  async function toggleArchive(channel: OnlineChannel) {
    setWorkingId(channel.id);
    setError(null);
    try {
      await setOnlineChannelArchived(db, channel.id, !channel.isArchived);
      await loadChannels();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Could not update channel.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <SafeAreaView className="bg-canvas flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="border-border border-b px-4 py-2">
          <View className="mx-auto w-full max-w-xl flex-row items-center gap-3">
            <IconButton icon={ArrowLeft} label="Back to entry" onPress={() => router.back()} />
            <View className="flex-1">
              <Text className="text-ink text-lg font-semibold">Payment providers</Text>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="items-center px-4 pb-5 pt-3"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-xl gap-4">
            <View className="p-4">
              <Text className="text-ink mb-2 text-xs font-semibold tracking-wide">
                New provider
              </Text>
              <View className="flex-row gap-2">
                <AppTextInput
                  accessibilityLabel="New provider name"
                  className="flex-1"
                  placeholder="e.g. BharatPe"
                  selectionColor={colors["accent"]}
                  value={newName}
                  onChangeText={(value) => {
                    setNewName(value);
                    setError(null);
                  }}
                  onSubmitEditing={() => void addChannel()}
                />
                <AppButton
                  compact
                  icon={Plus}
                  disabled={!newName.trim()}
                  loading={workingId === "new"}
                  onPress={() => void addChannel()}
                >
                  Add
                </AppButton>
              </View>
            </View>

            {error ? (
              <View className="rounded-control border-destructive bg-surface border px-4 py-2">
                <Text className="text-destructive text-sm">{error}</Text>
              </View>
            ) : null}

            {loading ? (
              <View className="items-center gap-2 p-8">
                <ActivityIndicator color={colors["accent"]} />
                <Text className="text-muted text-sm">Loading channels…</Text>
              </View>
            ) : (
              <View>
                {channels.map((channel) => {
                  const editing = editingId === channel.id;
                  const working = workingId === channel.id;
                  return (
                    <View
                      key={channel.id}
                      className={`border-border border-b py-2 last:border-b-0 ${channel.isArchived ? "bg-surface-muted" : "bg-transparent"}`}
                    >
                      {editing ? (
                        <View className="flex-row items-center gap-2">
                          <AppTextInput
                            accessibilityLabel={`Rename ${channel.name}`}
                            autoFocus
                            className="flex-1"
                            value={editingName}
                            onChangeText={setEditingName}
                            onSubmitEditing={() => void saveRename(channel)}
                          />
                          <IconButton
                            disabled={!editingName.trim() || working}
                            icon={Check}
                            label="Save channel name"
                            onPress={() => void saveRename(channel)}
                          />
                          <IconButton
                            icon={X}
                            label="Cancel rename"
                            onPress={() => setEditingId(null)}
                          />
                        </View>
                      ) : (
                        <View className="flex-row items-center gap-3">
                          <PaymentIcon name={channel.name} />
                          <View className="min-w-0 flex-1">
                            <Text
                              className={`font-medium ${channel.isArchived ? "text-muted" : "text-ink"}`}
                            >
                              {channel.name}
                            </Text>
                            {channel.isArchived ? (
                              <Text className="text-muted mt-0.5 text-xs">Hidden</Text>
                            ) : null}
                          </View>
                          {channel.isPreset ? (
                            <View
                              accessibilityLabel="Preset channel"
                              className="h-11 w-11 items-center justify-center"
                            >
                              <LockKeyhole color={colors["border-strong"]} size={17} />
                            </View>
                          ) : (
                            <View className="flex-row gap-1.5">
                              {!channel.isArchived ? (
                                <IconButton
                                  disabled={working}
                                  icon={Pencil}
                                  label={`Rename ${channel.name}`}
                                  onPress={() => {
                                    setEditingId(channel.id);
                                    setEditingName(channel.name);
                                  }}
                                />
                              ) : null}
                              <IconButton
                                disabled={working}
                                icon={channel.isArchived ? RotateCcw : Archive}
                                label={
                                  channel.isArchived
                                    ? `Restore ${channel.name}`
                                    : `Hide ${channel.name}`
                                }
                                onPress={() => void toggleArchive(channel)}
                              />
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
