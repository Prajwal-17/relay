import { apiClient } from "@/lib/apiClient";
import type { AppConfig, AppPreferencesResponse } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export type PreferencesSection = "exports" | "printing";

export const useAppPreferences = () => {
  const queryClient = useQueryClient();

  const {
    data: preferences,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["appPreferences"],
    queryFn: () => apiClient.get<AppPreferencesResponse>("/api/app-preferences"),
    staleTime: Infinity
  });

  const {
    data: defaults,
    isError: isDefaultsError,
    refetch: refetchDefaults
  } = useQuery({
    queryKey: ["appPreferencesDefaults"],
    queryFn: () => apiClient.get<AppConfig>("/api/app-preferences/defaults"),
    staleTime: Infinity
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiClient.patch<AppPreferencesResponse>("/api/app-preferences", payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["appPreferences"], data);
    },
    onError: (error) => toast.error(error.message || "Failed to update preferences")
  });

  const resetMutation = useMutation({
    mutationFn: (section: PreferencesSection) =>
      apiClient.post<AppPreferencesResponse>(`/api/app-preferences/reset/${section}`),
    onSuccess: (data) => {
      queryClient.setQueryData(["appPreferences"], data);
      toast.success("Reset to defaults");
    },
    onError: (error) => toast.error(error.message || "Failed to reset preferences")
  });

  const resetSection = (section: PreferencesSection) => resetMutation.mutate(section);

  return {
    config: preferences?.config,
    defaults,
    isLoading,
    isError,
    isDefaultsError,
    refetch,
    refetchDefaults,
    isFetching,
    updateConfig: (payload: Record<string, unknown>) => updateMutation.mutate(payload),
    resetSection,
    isUpdating: updateMutation.isPending,
    isResetting: resetMutation.isPending
  };
};
