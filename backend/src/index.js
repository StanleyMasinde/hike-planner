const DEFAULT_ALLOWED_ORIGIN = "*";
const DEFAULT_WEATHER_AI_BASE_URL = "https://api.weather-ai.co";

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);

    if (request.method !== "GET" || url.pathname !== "/forecast") {
      return json(
        { error: "Not found. Use GET /forecast?lat=...&lon=..." },
        404,
        origin,
      );
    }

    if (!env.WEATHER_AI_API_KEY) {
      return json({ error: "WEATHER_AI_API_KEY is not configured" }, 500, origin);
    }

    const params = parseForecastParams(url.searchParams);
    if (params.error) {
      return json({ error: params.error }, 400, origin);
    }

    const upstreamUrl = new URL(
      "/v1/forecast",
      env.WEATHER_AI_BASE_URL || DEFAULT_WEATHER_AI_BASE_URL,
    );
    upstreamUrl.searchParams.set("lat", String(params.lat));
    upstreamUrl.searchParams.set("lon", String(params.lon));
    upstreamUrl.searchParams.set("days", String(params.days));
    upstreamUrl.searchParams.set("ai", String(params.ai));

    let upstream;
    try {
      upstream = await fetch(upstreamUrl, {
        headers: {
          Authorization: `Bearer ${env.WEATHER_AI_API_KEY}`,
        },
      });
    } catch {
      return json({ error: "Unable to reach WeatherAI" }, 502, origin);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders(origin, upstream.headers),
    });
  },
};

function parseForecastParams(searchParams) {
  if (!searchParams.has("lat")) {
    return { error: "lat is required" };
  }

  if (!searchParams.has("lon")) {
    return { error: "lon is required" };
  }

  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const days = searchParams.has("days") ? Number(searchParams.get("days")) : 1;
  const ai = searchParams.has("ai")
    ? parseBoolean(searchParams.get("ai"))
    : false;

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { error: "lat must be a number between -90 and 90" };
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return { error: "lon must be a number between -180 and 180" };
  }

  if (!Number.isInteger(days) || days < 1 || days > 7) {
    return { error: "days must be an integer between 1 and 7" };
  }

  if (ai === null) {
    return { error: "ai must be true or false" };
  }

  return { lat, lon, days, ai };
}

function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

function responseHeaders(origin, upstreamHeaders) {
  return {
    "Content-Type": upstreamHeaders.get("Content-Type") || "application/json",
    ...corsHeaders(origin),
  };
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
