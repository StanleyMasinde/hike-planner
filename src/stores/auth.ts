import { computed, ref } from "vue";
import { defineStore } from "pinia";

const AUTH_TOKEN_STORAGE_KEY = "hike-planner-auth-token";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(readStoredToken());
  const isAuthenticated = ref(Boolean(token.value));
  const isChecking = ref(false);
  const isSigningIn = ref(false);
  const showAuthPrompt = ref(false);
  const errorMessage = ref("");
  const username = ref("");
  const password = ref("");

  const authorizationHeader = computed(() =>
    token.value ? `Bearer ${token.value}` : "",
  );

  async function checkAuthStatus() {
    isChecking.value = true;
    errorMessage.value = "";

    try {
      const response = await fetch("/auth/status", {
        headers: authHeaders(),
      });

      isAuthenticated.value = response.ok;
      showAuthPrompt.value = !response.ok;

      if (!response.ok) {
        clearToken();
      }
    } catch {
      isAuthenticated.value = false;
      showAuthPrompt.value = true;
      errorMessage.value = "Unable to verify access. Sign in to continue.";
    } finally {
      isChecking.value = false;
    }
  }

  async function signIn() {
    isSigningIn.value = true;
    errorMessage.value = "";

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${username.value}:${password.value}`)}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || typeof data.token !== "string") {
        throw new Error(
          typeof data.error === "string" ? data.error : "Invalid username or password.",
        );
      }

      token.value = data.token;
      isAuthenticated.value = true;
      showAuthPrompt.value = false;
      password.value = "";
      writeStoredToken(data.token);
    } catch (error) {
      clearToken();
      showAuthPrompt.value = true;
      errorMessage.value =
        error instanceof Error ? error.message : "Unable to sign in.";
    } finally {
      isSigningIn.value = false;
    }
  }

  function requireLogin(message = "Sign in to continue.") {
    clearToken();
    errorMessage.value = message;
    showAuthPrompt.value = true;
  }

  function authHeaders(): Record<string, string> {
    return authorizationHeader.value
      ? { Authorization: authorizationHeader.value }
      : {};
  }

  function clearToken() {
    token.value = "";
    isAuthenticated.value = false;
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  return {
    token,
    isAuthenticated,
    isChecking,
    isSigningIn,
    showAuthPrompt,
    errorMessage,
    username,
    password,
    authorizationHeader,
    authHeaders,
    checkAuthStatus,
    signIn,
    requireLogin,
  };
});

function readStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? "";
}

function writeStoredToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}
