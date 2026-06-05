# Hike Planner Weather Worker

Minimal Cloudflare Worker that protects the Hike Planner app and proxies
forecast requests from the Vue app to WeatherAI without exposing
`WEATHER_AI_API_KEY` in the browser.

## Setup

```sh
pnpm install
cp .dev.vars.example .dev.vars
pnpm dev
```

Set the real WeatherAI key and local app credentials in `.dev.vars`:

```sh
WEATHER_AI_API_KEY=wai_your_key_here
HIKE_AUTH_USER=hiker
HIKE_AUTH_PASSWORD=change_me
```

For Cloudflare deployment, store secrets with Wrangler:

```sh
pnpm wrangler secret put WEATHER_AI_API_KEY
pnpm wrangler secret put HIKE_AUTH_USER
pnpm wrangler secret put HIKE_AUTH_PASSWORD
pnpm deploy
```

## Auth Flow

The Worker uses a simple header-based auth flow without cookies:

1. The frontend checks `GET /auth/status` on first visit.
2. If unauthenticated, the frontend asks for username and password.
3. The frontend submits them to `POST /auth/login` with
   `Authorization: Basic <base64 username:password>`.
4. The Worker validates them against `HIKE_AUTH_USER` and
   `HIKE_AUTH_PASSWORD`, then returns a bearer token.
5. The frontend sends `Authorization: Bearer <token>` on protected requests.

This avoids cookie/domain issues when the frontend and Worker are deployed on
different origins. Set `ALLOWED_ORIGIN` in production so CORS only allows the
deployed frontend origin.

## Endpoints

```text
GET /auth/status
POST /auth/login
```

Protected forecast endpoint:

```text
GET /forecast?lat=-1.2921&lon=36.8219&days=1&ai=false
```

The Worker validates `lat`, `lon`, `days`, and `ai`, then calls:

```text
https://api.weather-ai.co/v1/forecast
```

The upstream request always sends `ai=false`. The Worker appends local,
rule-based gear suggestions to successful forecast responses:

```js
forecast.gearRecommendations // [{ id, item, priority, reason }]
```

Rules cover basics like water, snacks, rain layers, footwear for slippery or
rough terrain, sun protection, warm layers, wind, visibility, and first aid.

Frontend example:

```js
const res = await fetch(
  "http://localhost:8787/forecast?lat=-1.2921&lon=36.8219&days=1&ai=false",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);
const forecast = await res.json();
```
