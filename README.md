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

Terminal 1: start Vite from the project root:

```sh
cd /Users/stanley/Work/hike-planner
pnpm dev
```

Vite will print the frontend URL, usually `http://localhost:5173`.

Terminal 2: start the Cloudflare Worker from `backend`:

```sh
cd /Users/stanley/Work/hike-planner/backend
pnpm dev
```

Before using the forecast endpoint, configure the Worker with a WeatherAI API
key. Create `backend/.dev.vars` if it does not already exist, then set:

```sh
WEATHER_AI_API_KEY=wai_your_key_here
```

Wrangler starts the Worker on `http://localhost:8787` by default. The local forecast endpoint is:

```text
http://localhost:8787/forecast?lat=-1.2921&lon=36.8219&days=1&ai=false
```

The Vue app should call the Worker URL in development instead of calling WeatherAI directly. The Worker forwards the request to WeatherAI with the secret API key server-side.

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
