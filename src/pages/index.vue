<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { defaultLocation, hikeLocations, type HikeLocation } from "../lib/hikes";

const router = useRouter();
const selectedLocationName = ref(defaultLocation.name);
const forecastDays = ref(3);

const selectedLocation = computed<HikeLocation>(
  () =>
    hikeLocations.find((location) => location.name === selectedLocationName.value) ??
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

function requestForecast() {
  router.push({
    path: "/results",
    query: {
      location: selectedLocation.value.name,
      area: selectedLocation.value.area,
      altitude: selectedLocation.value.altitude,
      lat: String(selectedLocation.value.lat),
      lon: String(selectedLocation.value.lon),
      days: String(forecastDays.value),
    },
  });
}
</script>

<template>
  <main class="app-shell">
    <section class="planner-panel">
      <div class="intro-block">
        <p class="eyebrow">Trail weather</p>
        <h1>Plan the hike window with a focused forecast.</h1>
        <p class="intro-copy">
          Choose a Kenyan trail and the number of forecast days before checking
          conditions.
        </p>
      </div>

      <form class="forecast-form" @submit.prevent="requestForecast">
        <fieldset class="field-group">
          <legend>Hike location</legend>

          <label
            v-for="location in hikeLocations"
            :key="location.name"
            class="location-option"
            :class="{ 'location-option-active': selectedLocationName === location.name }"
          >
            <input
              v-model="selectedLocationName"
              class="sr-only"
              type="radio"
              name="location"
              :value="location.name"
            />
            <span>
              <strong>{{ location.name }}</strong>
              <small>{{ location.area }}</small>
            </span>
            <em>{{ location.altitude }}</em>
          </label>
        </fieldset>

        <div class="field-row">
          <label class="input-label" for="days">Forecast days</label>
          <div class="days-control">
            <input
              id="days"
              v-model.number="forecastDays"
              type="number"
              min="1"
              max="7"
              inputmode="numeric"
            />
            <span>days</span>
          </div>
        </div>

        <button class="primary-action" type="submit">See forecast</button>
      </form>
    </section>

    <aside class="summary-panel">
      <p class="summary-label">Selected route</p>
      <h2>{{ selectedLocation.name }}</h2>
      <dl>
        <div>
          <dt>Region</dt>
          <dd>{{ selectedLocation.area }}</dd>
        </div>
        <div>
          <dt>Elevation</dt>
          <dd>{{ selectedLocation.altitude }}</dd>
        </div>
        <div>
          <dt>Forecast span</dt>
          <dd>{{ forecastDays }} days</dd>
        </div>
      </dl>

      <div class="forecast-empty">
        <p>{{ forecastUrl }}</p>
      </div>
    </aside>
  </main>
</template>
