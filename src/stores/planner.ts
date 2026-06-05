import { computed, ref } from "vue";
import { defineStore } from "pinia";

import {
  defaultLocation,
  hikeLocations as configuredHikeLocations,
} from "../lib/hikes";

export const usePlannerStore = defineStore("planner", () => {
  const selectedLocationName = ref(defaultLocation.name);
  const forecastDays = ref(3);
  const hikeLocations = computed(() => configuredHikeLocations);

  const selectedLocation = computed(
    () =>
      hikeLocations.value.find(
        (location) => location.name === selectedLocationName.value,
      ) ??
      defaultLocation,
  );

  const forecastUrl = computed(() => {
    const params = new URLSearchParams({
      lat: String(selectedLocation.value.lat),
      lon: String(selectedLocation.value.lon),
      days: String(forecastDays.value),
    });

    return `/forecast?${params.toString()}`;
  });

  const forecastQuery = computed(() => ({
    location: selectedLocation.value.name,
    area: selectedLocation.value.area,
    altitude: selectedLocation.value.altitude,
    lat: String(selectedLocation.value.lat),
    lon: String(selectedLocation.value.lon),
    days: String(forecastDays.value),
  }));

  return {
    selectedLocationName,
    forecastDays,
    hikeLocations,
    selectedLocation,
    forecastUrl,
    forecastQuery,
  };
});
