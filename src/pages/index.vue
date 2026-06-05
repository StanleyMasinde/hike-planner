<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

import { usePlannerStore } from "../stores/planner";

const router = useRouter();
const plannerStore = usePlannerStore();
const {
  selectedLocationName,
  forecastDays,
  hikeLocations,
  selectedLocation,
  forecastUrl,
  forecastQuery,
} = storeToRefs(plannerStore);

function requestForecast() {
  router.push({
    path: "/results",
    query: forecastQuery.value,
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

          <div class="location-list">
            <label
              v-for="location in hikeLocations"
              :key="location.name"
              class="location-option"
              :class="{ 'location-option-active': selectedLocationName === location.name }"
            >
              <input
                v-model="selectedLocationName"
                class="location-radio"
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
          </div>
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
