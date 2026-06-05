<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";

import { useAuthStore } from "./stores/auth";

const authStore = useAuthStore();
const { errorMessage, isSigningIn, password, showAuthPrompt, username } =
  storeToRefs(authStore);

onMounted(() => {
  authStore.checkAuthStatus();
});

async function signIn() {
  await authStore.signIn();
}
</script>

<template>
  <router-view />

  <section v-if="showAuthPrompt" class="auth-overlay" aria-live="polite">
    <form class="auth-dialog" @submit.prevent="signIn">
      <p class="summary-label">Private access</p>
      <h2>Sign in to Hike Planner</h2>
      <p>
        Enter the username and password configured on the backend to continue.
      </p>

      <label>
        <span>Username</span>
        <input
          v-model="username"
          autocomplete="username"
          name="username"
          required
          type="text"
        />
      </label>

      <label>
        <span>Password</span>
        <input
          v-model="password"
          autocomplete="current-password"
          name="password"
          required
          type="password"
        />
      </label>

      <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>

      <button class="primary-action" type="submit" :disabled="isSigningIn">
        {{ isSigningIn ? "Signing in..." : "Sign in" }}
      </button>
    </form>
  </section>
</template>
