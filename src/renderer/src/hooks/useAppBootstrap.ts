import { apiClient } from "@/lib/apiClient";
import { useAppStore } from "@/store/appStore";
import type { AppPreferencesResponse } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const useAppBootstrap = () => {
  const {
    data: onboardingStatus,
    isLoading: isOnboardingLoading,
    isSuccess: isOnboardingSuccess
  } = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => apiClient.get<{ isComplete: boolean }>("/api/onboarding/status"),
    retry: false
  });

  const {
    data: preferences,
    isLoading: isPreferencesLoading,
    isSuccess: isPreferencesSuccess
  } = useQuery({
    queryKey: ["appPreferences"],
    queryFn: () => apiClient.get<AppPreferencesResponse>("/api/preferences"),
    retry: false
  });

  const isBootstrapping = isOnboardingLoading || isPreferencesLoading;

  useEffect(() => {
    if (isOnboardingSuccess) {
      useAppStore.setState({
        isOnboardingComplete: onboardingStatus?.isComplete
      });
    }
    if (isPreferencesSuccess && preferences?.config) {
      useAppStore.setState({
        config: preferences.config
      });
    }
  }, [isOnboardingSuccess, isPreferencesSuccess, onboardingStatus, preferences]);

  return {
    isBootstrapping
  };
};

export default useAppBootstrap;
