export type ForecastResponse = {
  current: {
    time: string;
    temperature: number;
    wind_speed: number;
    wind_direction?: number;
    condition_code: string;
    icon: string;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    precipitation_probability: number;
    wind_speed: number;
    condition_code: string;
    icon: string;
    humidity: number;
    feels_like: number;
    wind_gust?: number;
    uv_index: number;
  }>;
  daily: Array<{
    date: string;
    temp_min: number;
    temp_max: number;
    precipitation_sum: number;
    sunrise: string;
    sunset: string;
    condition_code: string;
    icon: string;
    precipitation_probability: number;
    wind_max: number;
  }>;
  gearRecommendations?: GearRecommendation[];
};

export type GearRecommendation = {
  id: string;
  item: string;
  priority: "essential" | "recommended" | string;
  reason: string;
};

export function describeCondition(code: string) {
  const conditions: Record<string, string> = {
    "0": "Clear",
    "1": "Mostly clear",
    "2": "Partly cloudy",
    "3": "Overcast",
    "45": "Fog",
    "48": "Rime fog",
    "51": "Light drizzle",
    "53": "Moderate drizzle",
    "55": "Dense drizzle",
    "61": "Slight rain",
    "63": "Rain",
    "65": "Heavy rain",
    "80": "Light showers",
    "81": "Showers",
    "82": "Heavy showers",
  };

  return conditions[code] ?? "Mixed conditions";
}

export function formatHour(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    hour12: true,
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}
