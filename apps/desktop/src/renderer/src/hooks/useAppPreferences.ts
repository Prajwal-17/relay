import { apiClient } from "@/lib/apiClient";
import type { AppConfig, AppPreferencesResponse } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export type PreferencesSection = "exports";

export const useAppPreferences = () => {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["appPreferences"],
    queryFn: () => apiClient.get<AppPreferencesResponse>("/api/app-preferences"),
    staleTime: Infinity
  });

  const { data: defaults } = useQuery({
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

  const resetSection = (section: PreferencesSection) => {
    return resetMutation.mutateAsync(section);
  };

  return {
    config: preferences?.config,
    defaults,
    isLoading,
    updateConfig: (payload: Record<string, unknown>) => updateMutation.mutateAsync(payload),
    resetSection,
    isUpdating: updateMutation.isPending,
    isResetting: resetMutation.isPending
  };
};
