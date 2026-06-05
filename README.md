# Hike Planner

Vue 3 hike planner with a small Cloudflare Worker backend for
[WeatherAI](https://weather-ai.co/) forecast calls. The app lets a hiker choose
from a small set of Kenyan trails, review the weather forecast, and see
rule-based outfit and gear recommendations derived from the returned weather
conditions.

## Project Setup

Install frontend dependencies from the project root:

```sh
pnpm install
```

Install the Cloudflare Worker dependencies too:

```sh
cd backend
pnpm install
```

## Local Development

The frontend calls `/forecast`, and Vite proxies that path to the local Worker
at `http://localhost:8787`. Run the Vue app and the Worker in separate
terminals.

By default, the proxy target is `http://localhost:8787`. You can configure this
using the `VITE_BACKEND_URL` environment variable if your backend is running
elsewhere (e.g., a deployed production environment).

Terminal 1: start Vite from the project root:

```sh
cd ~/<your-work-dir>/hike-planner
pnpm dev
```

Vite will print the frontend URL, usually `http://localhost:5173`.

Terminal 2: start the Cloudflare Worker from `backend`:

```sh
cd ~/<your-work-dir>/hike-planner/backend
pnpm dev
```

Before using the forecast endpoint, configure the Worker with a WeatherAI API
key and app access credentials. Create `backend/.dev.vars` if it does not
already exist, then set:

```sh
WEATHER_AI_API_KEY=wai_your_key_here
HIKE_AUTH_USER=hiker
HIKE_AUTH_PASSWORD=change_me
```

Wrangler starts the Worker on `http://localhost:8787` by default. The local forecast endpoint is:

```text
http://localhost:8787/forecast?lat=-1.2921&lon=36.8219&days=1&ai=false
```

The Vue app should call the Worker URL in development instead of calling
WeatherAI directly. The Worker forwards the request to WeatherAI with the secret
API key server-side.

## Architecture Notes

The frontend is built with Vue 3. Vue handles the reactive UI updates for route
selection, forecast loading states, weather results, and gear recommendations.
The app uses Vue Router for the index and results pages.

Pinia is used for centralized state management:

- `src/stores/planner.ts` owns the selected hike, forecast day count, generated
  forecast URL, and route query payload.
- `src/stores/forecast.ts` owns the selected forecast location, loading and
  error state, fetched forecast data, hourly/daily derived values, and gear
  recommendations.

Keeping this state in stores makes the UI easier to refactor because page
components mostly bind to store state and call store actions instead of owning
fetching, parsing, and cross-page state directly.

Styling is managed in `src/main.css` with Tailwind CSS. The project uses
Tailwind's `@theme` block for shared design tokens such as forest, clay, and
stone colors, then uses component classes with `@apply` in `@layer components`.
This keeps templates readable while still using Tailwind utilities for spacing,
layout, borders, typography, responsive behavior, and interaction states.

The backend is a Cloudflare Worker in `backend/src/index.js`. It keeps the
WeatherAI API key server-side, validates incoming forecast query parameters,
calls WeatherAI, handles upstream errors, and enriches the forecast response
with local gear recommendations before returning JSON to the Vue app.

The Worker also protects app access with simple header-based authentication.
The frontend submits `HIKE_AUTH_USER` and `HIKE_AUTH_PASSWORD` to
`POST /auth/login` using HTTP Basic credentials. On success, the Worker returns
a bearer token. The frontend stores that token locally and sends
`Authorization: Bearer <token>` to `/auth/status` and `/forecast`. Cookies are
not used, which keeps the setup simple when the frontend and Worker are hosted
on different domains.

## Weather Data

Weather information is provided by [WeatherAI](https://weather-ai.co/). The
Worker calls WeatherAI's forecast API from the server side so the API key is not
exposed in the browser. In local development, the frontend uses the Vite proxy
for `/forecast`; in production, route `/forecast` to the deployed Worker.

The Worker currently requests forecasts with `ai=false` and enriches the raw
forecast response with local gear recommendations before returning it to the UI.

## Current Limitations and Improvements

Hike locations are currently hardcoded in `src/lib/hikes.ts`. A stronger
production version could use location services from APIs such as Google Maps,
Places, or Geocoding, then reverse geocode coordinates into human-readable
trail, region, and elevation details.

Gear recommendations are rule based in the Worker. The rules inspect weather
values such as rain probability, temperature, wind, and visibility, then return
recommended or essential items. This could be enhanced with AI-generated
recommendations that account for trail type, route duration, hiker profile,
season, and local safety guidance.

WeatherAI also supports webhooks for weather trigger events. A future version
could subscribe hikers to adverse-weather notifications, such as rain, extreme
wind, frost, or other unsafe trail conditions, and notify them before or during
a hike.

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```
