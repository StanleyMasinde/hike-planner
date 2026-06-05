<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink, useRoute } from "vue-router";
import {
  describeCondition,
  formatDate,
  formatDateTime,
  formatHour,
  formatTime,
  type GearRecommendation,
} from "../lib/forecast";
import { useForecastStore } from "../stores/forecast";

const route = useRoute();
const forecastStore = useForecastStore();
const {
  selectedLocation,
  forecastDays,
  forecast,
  isLoading,
  errorMessage,
  dailyForecast,
  dailyForecasts,
  visibleHourly,
  gearRecommendations,
} = storeToRefs(forecastStore);

const currentCondition = computed(() =>
  forecast.value ? describeCondition(forecast.value.current.condition_code) : "",
);

const formattedCurrentTime = computed(() =>
  forecast.value ? formatDateTime(forecast.value.current.time) : "",
);

onMounted(() => {
  forecastStore.hydrateFromQuery(route.query);
  forecastStore.loadForecast();
});

watch(
  () => route.query,
  (query) => {
    forecastStore.hydrateFromQuery(query);
    forecastStore.loadForecast();
  },
  { deep: true },
);

function loadForecast() {
  forecastStore.loadForecast();
}

function recommendationPriorityClass(recommendation: GearRecommendation) {
  return recommendation.priority === "essential"
    ? "recommendation-priority-essential"
    : "recommendation-priority-recommended";
}

function formatPriority(priority: GearRecommendation["priority"]) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
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

      <article v-if="gearRecommendations.length" class="recommendations-panel">
        <div class="panel-heading-row">
          <div>
            <p class="summary-label">Outfit and gear</p>
            <h2>Pack for the forecast</h2>
          </div>
          <span>{{ gearRecommendations.length }} items</span>
        </div>

        <div class="recommendation-grid">
          <article
            v-for="recommendation in gearRecommendations"
            :key="recommendation.id"
            class="recommendation-card"
          >
            <div class="recommendation-card-header">
              <strong>{{ recommendation.item }}</strong>
              <span :class="recommendationPriorityClass(recommendation)">
                {{ formatPriority(recommendation.priority) }}
              </span>
            </div>
            <p>{{ recommendation.reason }}</p>
          </article>
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

      <article v-if="dailyForecasts.length > 1" class="multi-day-panel">
        <p class="summary-label">{{ forecastDays }} day outlook</p>
        <div class="daily-grid">
          <article v-for="day in dailyForecasts" :key="day.date" class="daily-card">
            <div class="daily-card-header">
              <div>
                <time>{{ formatDate(day.date) }}</time>
                <span>{{ describeCondition(day.condition_code) }}</span>
              </div>
              <img :src="day.icon" :alt="describeCondition(day.condition_code)" />
            </div>

            <dl>
              <div>
                <dt>Temp</dt>
                <dd>{{ day.temp_min }}-{{ day.temp_max }}°C</dd>
              </div>
              <div>
                <dt>Rain</dt>
                <dd>{{ day.precipitation_probability }}%</dd>
              </div>
              <div>
                <dt>Wind</dt>
                <dd>{{ day.wind_max }} km/h</dd>
              </div>
              <div>
                <dt>Sun</dt>
                <dd>{{ formatTime(day.sunrise) }}-{{ formatTime(day.sunset) }}</dd>
              </div>
            </dl>
          </article>
        </div>
      </article>
    </section>
  </main>
</template>
