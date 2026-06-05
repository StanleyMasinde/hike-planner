# Hike Planner

Vue 3 hike planner with a small Cloudflare Worker backend for WeatherAI forecast calls.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
pnpm install
```

Install the Worker dependencies too:

```sh
cd backend
pnpm install
```

## Local Development

Run the Vue app and the Worker in separate terminals.

Terminal 1: start Vite from the project root:

```sh
cd /Users/stanley/Work/hike-planner
pnpm dev
```

Vite will print the frontend URL, usually `http://localhost:5173`.

Terminal 2: start the Cloudflare Worker from `backend`:

```sh
cd /Users/stanley/Work/hike-planner/backend
cp .dev.vars.example .dev.vars
pnpm dev
```

Before using the forecast endpoint, edit `backend/.dev.vars` and set:

```sh
WEATHER_AI_API_KEY=wai_your_key_here
```

Wrangler starts the Worker on `http://localhost:8787` by default. The local forecast endpoint is:

```text
http://localhost:8787/forecast?lat=-1.2921&lon=36.8219&days=1&ai=false
```

The Vue app should call the Worker URL in development instead of calling WeatherAI directly. The Worker forwards the request to WeatherAI with the secret API key server-side.

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```
