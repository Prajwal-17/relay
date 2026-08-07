import { apiClient } from "@/lib/apiClient";
import { useAppStore } from "@/app/app.store";
import type { AppPreferencesResponse } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const useAppBootstrap = () => {
  const {
    data: onboardingStatus,
    isLoading: isOnboardingLoading,
    isSuccess: isOnboardingSuccess,
    isError: isOnboardingError
  } = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => apiClient.get<{ isComplete: boolean }>("/api/onboarding/status"),
    retry: false
  });

  const { isLoading: isPreferencesLoading, isError: isPreferencesError } = useQuery({
    queryKey: ["appPreferences"],
    queryFn: () => apiClient.get<AppPreferencesResponse>("/api/app-preferences"),
    retry: 2,
    staleTime: Infinity
  });

  const isBootstrapping = isOnboardingLoading || isPreferencesLoading;
  const hasError = isOnboardingError || isPreferencesError;

  useEffect(() => {
    if (isOnboardingSuccess) {
      useAppStore.setState({
        isOnboardingComplete: onboardingStatus?.isComplete
      });
    }
  }, [isOnboardingSuccess, onboardingStatus]);

  return {
    isBootstrapping,
    hasError
  };
};

export default useAppBootstrap;
