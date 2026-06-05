<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  describeCondition,
  formatDateTime,
  formatHour,
  formatTime,
  type ForecastResponse,
} from "../lib/forecast";
import { defaultLocation, hikeLocations, type HikeLocation } from "../lib/hikes";

const route = useRoute();
const forecast = ref<ForecastResponse | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");

const selectedLocation = computed<HikeLocation>(() => {
  const locationName = readQueryValue(route.query.location);

  return (
    hikeLocations.find((location) => location.name === locationName) ?? {
      name: locationName || defaultLocation.name,
      area: readQueryValue(route.query.area) || defaultLocation.area,
      altitude: readQueryValue(route.query.altitude) || defaultLocation.altitude,
      lat: Number(readQueryValue(route.query.lat)) || defaultLocation.lat,
      lon: Number(readQueryValue(route.query.lon)) || defaultLocation.lon,
    }
  );
});

const forecastDays = computed(() => {
  const days = Number(readQueryValue(route.query.days));

  return Number.isInteger(days) && days >= 1 && days <= 7 ? days : 1;
});

const apiUrl = computed(() => {
  const params = new URLSearchParams({
    lat: String(selectedLocation.value.lat),
    lon: String(selectedLocation.value.lon),
    days: String(forecastDays.value),
  });

  return `/forecast?${params.toString()}`;
});

const currentCondition = computed(() =>
  forecast.value ? describeCondition(forecast.value.current.condition_code) : "",
);

const dailyForecast = computed(() => forecast.value?.daily[0]);

const formattedCurrentTime = computed(() =>
  forecast.value ? formatDateTime(forecast.value.current.time) : "",
);

const visibleHourly = computed(() => forecast.value?.hourly.slice(0, 12) ?? []);

onMounted(() => {
  loadForecast();
});

async function loadForecast() {
  isLoading.value = true;
  errorMessage.value = "";
  forecast.value = null;

  try {
    const response = await fetch(apiUrl.value);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Unable to load the forecast.");
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
</script>

<template>
  <main class="results-shell">
    <section class="results-header">
      <RouterLink class="back-link" to="/">Change hike</RouterLink>
      <p class="eyebrow">Forecast results</p>
      <h1>{{ selectedLocation.name }}</h1>
      <p class="intro-copy">
        {{ selectedLocation.area }} · {{ selectedLocation.altitude }} ·
        {{ forecastDays }} day forecast
      </p>
    </section>

    <section v-if="isLoading" class="loading-panel" aria-live="polite">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p>Loading forecast conditions...</p>
    </section>

    <section v-else-if="errorMessage" class="error-panel" aria-live="polite">
      <p class="summary-label">Forecast unavailable</p>
      <h2>{{ errorMessage }}</h2>
      <button class="secondary-action" type="button" @click="loadForecast">
        Try again
      </button>
    </section>

    <section v-else-if="forecast" class="results-grid">
      <article class="forecast-preview forecast-preview-wide">
        <div class="current-weather">
          <div>
            <p class="forecast-kicker">{{ formattedCurrentTime }}</p>
            <strong>{{ Math.round(forecast.current.temperature) }}°C</strong>
            <span>{{ currentCondition }}</span>
          </div>
          <img :src="forecast.current.icon" :alt="currentCondition" />
        </div>

        <div class="weather-metrics">
          <article>
            <span>Wind</span>
            <strong>{{ forecast.current.wind_speed }} km/h</strong>
          </article>
          <article>
            <span>Rain chance</span>
            <strong>{{ dailyForecast?.precipitation_probability ?? 0 }}%</strong>
          </article>
          <article>
            <span>Temperature</span>
            <strong>
              {{ dailyForecast?.temp_min ?? "-" }}-{{ dailyForecast?.temp_max ?? "-" }}°C
            </strong>
          </article>
        </div>
      </article>

      <article v-if="dailyForecast" class="day-window-panel">
        <p class="summary-label">Trail window</p>
        <div class="day-window">
          <div>
            <span>Sunrise</span>
            <strong>{{ formatTime(dailyForecast.sunrise) }}</strong>
          </div>
          <div>
            <span>Sunset</span>
            <strong>{{ formatTime(dailyForecast.sunset) }}</strong>
          </div>
          <div>
            <span>Rain total</span>
            <strong>{{ dailyForecast.precipitation_sum }} mm</strong>
          </div>
          <div>
            <span>Max wind</span>
            <strong>{{ dailyForecast.wind_max }} km/h</strong>
          </div>
        </div>
      </article>

      <article class="hourly-panel">
        <p class="summary-label">Hourly preview</p>
        <div class="hourly-strip" aria-label="Hourly forecast preview">
          <article v-for="hour in visibleHourly" :key="hour.time">
            <time>{{ formatHour(hour.time) }}</time>
            <img :src="hour.icon" :alt="describeCondition(hour.condition_code)" />
            <strong>{{ Math.round(hour.temperature) }}°</strong>
            <span>{{ hour.precipitation_probability }}% rain</span>
          </article>
        </div>
      </article>
    </section>
  </main>
</template>
