# Hike Planner Weather Worker

Minimal Cloudflare Worker that proxies forecast requests from the Vue app to WeatherAI without exposing `WEATHER_AI_API_KEY` in the browser.

## Setup

```sh
pnpm install
cp .dev.vars.example .dev.vars
pnpm dev
```

Set the real key in `.dev.vars` for local development:

```sh
WEATHER_AI_API_KEY=wai_your_key_here
```

For Cloudflare deployment, store it as a secret:

```sh
pnpm wrangler secret put WEATHER_AI_API_KEY
pnpm deploy
```

## Endpoint

```text
GET /forecast?lat=-1.2921&lon=36.8219&days=1&ai=false
```

The Worker validates `lat`, `lon`, `days`, and `ai`, then calls:

```text
https://api.weather-ai.co/v1/forecast
```

Frontend example:

```js
const res = await fetch(
  "http://localhost:8787/forecast?lat=-1.2921&lon=36.8219&days=1&ai=false"
);
const forecast = await res.json();
```
