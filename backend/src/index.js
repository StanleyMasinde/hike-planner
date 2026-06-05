const DEFAULT_ALLOWED_ORIGIN = "*";
const DEFAULT_WEATHER_AI_BASE_URL = "https://api.weather-ai.co";
const AUTH_REALM = "Hike Planner";

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);

    if (url.pathname === "/auth/status" && request.method === "GET") {
      return handleAuthStatus(request, env, origin);
    }

    if (url.pathname === "/auth/login" && request.method === "POST") {
      return handleAuthLogin(request, env, origin);
    }

    if (url.pathname !== "/forecast" || request.method !== "GET") {
      return json(
        { error: "Not found. Use GET /forecast?lat=...&lon=..." },
        404,
        origin,
      );
    }

    const auth = authenticateBearerRequest(request, env);
    if (!auth.ok) {
      return unauthorized(auth.error, origin);
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
    upstreamUrl.searchParams.set("ai", "false");

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

    const upstreamBody = await readUpstreamBody(upstream);
    if (!upstream.ok || upstreamBody.error) {
      return json(
        upstreamBody.error ? { error: upstreamBody.error } : upstreamBody.body,
        upstream.status,
        origin,
      );
    }

    return json(enrichForecastBody(upstreamBody.body), upstream.status, origin);
  },
};

function handleAuthStatus(request, env, origin) {
  const authConfig = readAuthConfig(env);
  if (authConfig.error) {
    return json({ authenticated: false, error: authConfig.error }, 500, origin);
  }

  const auth = authenticateBearerRequest(request, env);

  return json({ authenticated: auth.ok }, auth.ok ? 200 : 401, origin);
}

function handleAuthLogin(request, env, origin) {
  const authConfig = readAuthConfig(env);
  if (authConfig.error) {
    return json({ error: authConfig.error }, 500, origin);
  }

  const credentials = readBasicCredentials(request.headers.get("Authorization"));
  if (!credentials) {
    return unauthorized("Basic credentials are required", origin);
  }

  if (
    !constantTimeEqual(credentials.username, authConfig.username) ||
    !constantTimeEqual(credentials.password, authConfig.password)
  ) {
    return unauthorized("Invalid username or password", origin);
  }

  return json(
    {
      authenticated: true,
      token: encodeToken(credentials.username, credentials.password),
    },
    200,
    origin,
  );
}

function authenticateBearerRequest(request, env) {
  const authConfig = readAuthConfig(env);
  if (authConfig.error) {
    return { ok: false, error: authConfig.error };
  }

  const token = readBearerToken(request.headers.get("Authorization"));
  if (!token) {
    return { ok: false, error: "Bearer token is required" };
  }

  const credentials = decodeToken(token);
  if (!credentials) {
    return { ok: false, error: "Invalid bearer token" };
  }

  if (
    !constantTimeEqual(credentials.username, authConfig.username) ||
    !constantTimeEqual(credentials.password, authConfig.password)
  ) {
    return { ok: false, error: "Invalid bearer token" };
  }

  return { ok: true };
}

function readAuthConfig(env) {
  if (!env.HIKE_AUTH_USER || !env.HIKE_AUTH_PASSWORD) {
    return { error: "HIKE_AUTH_USER and HIKE_AUTH_PASSWORD are required" };
  }

  return {
    username: String(env.HIKE_AUTH_USER),
    password: String(env.HIKE_AUTH_PASSWORD),
  };
}

function readBasicCredentials(header) {
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  return decodeToken(header.slice("Basic ".length));
}

function readBearerToken(header) {
  if (!header?.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}

function encodeToken(username, password) {
  return btoa(`${username}:${password}`);
}

function decodeToken(token) {
  let decoded;

  try {
    decoded = atob(token);
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
}

function constantTimeEqual(left, right) {
  const leftValue = String(left);
  const rightValue = String(right);
  let result = leftValue.length === rightValue.length ? 0 : 1;
  const length = Math.max(leftValue.length, rightValue.length);

  for (let index = 0; index < length; index += 1) {
    result |= leftValue.charCodeAt(index) ^ rightValue.charCodeAt(index);
  }

  return result === 0;
}

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

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}

function unauthorized(error, origin) {
  return new Response(JSON.stringify({ error }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Basic realm="${AUTH_REALM}", charset="UTF-8"`,
      ...corsHeaders(origin),
    },
  });
}

async function readUpstreamBody(response) {
  const text = await response.text();

  if (!text) {
    return { body: {} };
  }

  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: "WeatherAI returned an invalid JSON response" };
  }
}

function enrichForecastBody(body) {
  const gearRecommendations = suggestGear(body);

  if (body && typeof body === "object" && !Array.isArray(body)) {
    return {
      ...body,
      gearRecommendations,
    };
  }

  return {
    forecast: body,
    gearRecommendations,
  };
}

function suggestGear(forecast) {
  const conditions = collectConditions(forecast);
  const recommendations = [];

  addRecommendation(recommendations, {
    id: "water",
    item: "Water",
    priority: "essential",
    reason: "Carry at least 2 liters per person, more for long or hot hikes.",
  });

  addRecommendation(recommendations, {
    id: "snacks",
    item: conditions.longHike ? "High-energy snacks and a meal" : "High-energy snacks",
    priority: conditions.longHike ? "essential" : "recommended",
    reason: conditions.longHike
      ? "The plan looks long enough to need steady calories plus a proper food stop."
      : "Quick calories help keep energy stable on the trail.",
  });

  if (conditions.rainLevel >= 3) {
    addRecommendation(recommendations, {
      id: "poncho",
      item: "Poncho or waterproof shell",
      priority: "essential",
      reason: "Rain is likely enough that staying dry should be part of the plan.",
    });
  } else if (conditions.rainLevel >= 1) {
    addRecommendation(recommendations, {
      id: "light-rain-jacket",
      item: "Light rain jacket",
      priority: "recommended",
      reason: "There is some rain risk, so pack a light waterproof layer.",
    });
  }

  if (conditions.slippery) {
    addRecommendation(recommendations, {
      id: "grippy-boots",
      item: "Waterproof hiking boots with aggressive tread",
      priority: "essential",
      reason: "Wet or slippery terrain needs ankle support and reliable traction.",
    });
  } else if (conditions.roughTerrain) {
    addRecommendation(recommendations, {
      id: "hiking-boots",
      item: "Sturdy hiking boots",
      priority: "recommended",
      reason: "Uneven terrain is easier and safer with supportive footwear.",
    });
  } else {
    addRecommendation(recommendations, {
      id: "trail-shoes",
      item: "Comfortable trail shoes",
      priority: "recommended",
      reason: "Good grip and broken-in shoes reduce fatigue and blisters.",
    });
  }

  if (conditions.hot) {
    addRecommendation(recommendations, {
      id: "sun-protection",
      item: "Sun hat, sunscreen, and extra water",
      priority: "essential",
      reason: "Warm conditions increase sun exposure and dehydration risk.",
    });
  }

  if (conditions.cold) {
    addRecommendation(recommendations, {
      id: "warm-layer",
      item: "Warm insulating layer",
      priority: "recommended",
      reason: "Cool temperatures can feel colder when resting or exposed to wind.",
    });
  }

  if (conditions.wind) {
    addRecommendation(recommendations, {
      id: "windbreaker",
      item: "Windbreaker",
      priority: "recommended",
      reason: "Wind can make exposed trail sections feel colder and less comfortable.",
    });
  }

  if (conditions.lowVisibility) {
    addRecommendation(recommendations, {
      id: "headlamp",
      item: "Headlamp or flashlight",
      priority: "recommended",
      reason: "Low visibility or fog makes it important to see and be seen.",
    });
  }

  addRecommendation(recommendations, {
    id: "first-aid",
    item: "Basic first-aid kit",
    priority: "recommended",
    reason: "Small cuts, blisters, and minor sprains are common trail issues.",
  });

  return recommendations;
}

function addRecommendation(recommendations, recommendation) {
  if (!recommendations.some((item) => item.id === recommendation.id)) {
    recommendations.push(recommendation);
  }
}

function collectConditions(value) {
  const conditions = {
    rainLevel: 0,
    slippery: false,
    roughTerrain: false,
    hot: false,
    cold: false,
    wind: false,
    lowVisibility: false,
    longHike: false,
  };

  scanForecastValue(value, "", conditions);

  return conditions;
}

function scanForecastValue(value, key, conditions) {
  if (Array.isArray(value)) {
    for (const item of value) {
      scanForecastValue(item, key, conditions);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      scanForecastValue(childValue, childKey.toLowerCase(), conditions);
    }
    return;
  }

  if (typeof value === "number") {
    applyNumericCondition(key, value, conditions);
    return;
  }

  if (typeof value === "string") {
    applyTextCondition(`${key} ${value}`.toLowerCase(), conditions);
  }
}

function applyNumericCondition(key, value, conditions) {
  if (key.includes("precip") || key.includes("rain")) {
    const rainValue =
      (key.includes("prob") || key.includes("chance") || key === "pop") && value <= 1
        ? value * 100
        : value;

    if (key.includes("prob") || key.includes("chance") || key === "pop") {
      if (rainValue >= 70) conditions.rainLevel = Math.max(conditions.rainLevel, 3);
      else if (rainValue >= 40) conditions.rainLevel = Math.max(conditions.rainLevel, 2);
      else if (rainValue > 0) conditions.rainLevel = Math.max(conditions.rainLevel, 1);
    } else if (rainValue >= 10) {
      conditions.rainLevel = Math.max(conditions.rainLevel, 3);
    } else if (rainValue >= 2) {
      conditions.rainLevel = Math.max(conditions.rainLevel, 2);
    } else if (rainValue > 0) {
      conditions.rainLevel = Math.max(conditions.rainLevel, 1);
    }
  }

  if ((key.includes("temp") || key.includes("heat")) && value >= 28) {
    conditions.hot = true;
  }

  if ((key.includes("temp") || key.includes("chill")) && value <= 10) {
    conditions.cold = true;
  }

  if (key.includes("wind") && value >= 30) {
    conditions.wind = true;
  }

  if (
    (key.includes("distance") && value >= 12) ||
    (key.includes("duration") && value >= 5) ||
    (key.includes("hours") && value >= 5)
  ) {
    conditions.longHike = true;
  }
}

function applyTextCondition(text, conditions) {
  if (/\b(rain|showers|storm|thunderstorm|drizzle|wet)\b/.test(text)) {
    conditions.rainLevel = Math.max(conditions.rainLevel, 2);
  }

  if (/\b(heavy rain|downpour|storm|thunderstorm)\b/.test(text)) {
    conditions.rainLevel = Math.max(conditions.rainLevel, 3);
  }

  if (/\b(slippery|mud|muddy|wet rock|loose|steep|scramble)\b/.test(text)) {
    conditions.slippery = true;
  }

  if (/\b(rocky|rough|uneven|steep|scramble|technical)\b/.test(text)) {
    conditions.roughTerrain = true;
  }

  if (/\b(hot|heat|sunny|clear sky)\b/.test(text)) {
    conditions.hot = true;
  }

  if (/\b(cold|chilly|freezing|snow|ice|frost)\b/.test(text)) {
    conditions.cold = true;
  }

  if (/\b(windy|strong wind|gust)\b/.test(text)) {
    conditions.wind = true;
  }

  if (/\b(fog|mist|low visibility|dark|night)\b/.test(text)) {
    conditions.lowVisibility = true;
  }
}
