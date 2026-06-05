import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { LocationQuery } from "vue-router";

import type { ForecastResponse } from "../lib/forecast";
import { defaultLocation, hikeLocations, type HikeLocation } from "../lib/hikes";
import { useAuthStore } from "./auth";

export const useForecastStore = defineStore("forecast", () => {
  const selectedLocation = ref<HikeLocation>(defaultLocation);
  const forecastDays = ref(1);
  const forecast = ref<ForecastResponse | null>(null);
  const isLoading = ref(false);
  const errorMessage = ref("");

  const apiUrl = computed(() => {
    const params = new URLSearchParams({
      lat: String(selectedLocation.value.lat),
      lon: String(selectedLocation.value.lon),
      days: String(forecastDays.value),
    });

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8787";
    return `${backendUrl}/forecast?${params.toString()}`;
  });

  const dailyForecast = computed(() => forecast.value?.daily[0]);
  const dailyForecasts = computed(
    () => forecast.value?.daily.slice(0, forecastDays.value) ?? [],
  );
  const visibleHourly = computed(() => forecast.value?.hourly.slice(0, 12) ?? []);
  const gearRecommendations = computed(
    () => forecast.value?.gearRecommendations ?? [],
  );

  function hydrateFromQuery(query: LocationQuery) {
    const locationName = readQueryValue(query.location);

    selectedLocation.value =
      hikeLocations.find((location) => location.name === locationName) ?? {
        name: locationName || defaultLocation.name,
        area: readQueryValue(query.area) || defaultLocation.area,
        altitude: readQueryValue(query.altitude) || defaultLocation.altitude,
        lat: Number(readQueryValue(query.lat)) || defaultLocation.lat,
        lon: Number(readQueryValue(query.lon)) || defaultLocation.lon,
      };

    const days = Number(readQueryValue(query.days));
    forecastDays.value = Number.isInteger(days) && days >= 1 && days <= 7 ? days : 1;
  }

  async function loadForecast() {
    const authStore = useAuthStore();

    if (!authStore.authorizationHeader) {
      errorMessage.value = "Sign in to load the forecast.";
      authStore.requireLogin(errorMessage.value);
      return;
    }

    isLoading.value = true;
    errorMessage.value = "";
    forecast.value = null;

    try {
      const response = await fetch(apiUrl.value, {
        headers: authStore.authHeaders(),
      });
      const contentType = response.headers.get("Content-Type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const apiError =
          typeof data === "object" && data !== null && "error" in data
          ? String(data.error)
          : `Forecast API returned ${response.status}.`;

        if (response.status === 401) {
          authStore.requireLogin(apiError);
        }

        throw new Error(apiError);
      }

      forecast.value = data as ForecastResponse;
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : "Unable to load the forecast.";
    } finally {
      isLoading.value = false;
    }
  }

  function readQueryValue(value: unknown) {
    return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
  }

  return {
    selectedLocation,
    forecastDays,
    forecast,
    isLoading,
    errorMessage,
    apiUrl,
    dailyForecast,
    dailyForecasts,
    visibleHourly,
    gearRecommendations,
    hydrateFromQuery,
    loadForecast,
  };
});
