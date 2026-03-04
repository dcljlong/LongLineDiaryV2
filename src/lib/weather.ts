export type DailyForecastDay = {
  date: string;          // YYYY-MM-DD
  tempMaxC: number;
  tempMinC: number;
  windMaxKph: number;
  precipMm: number;
  weatherCode: number;
};

export type DailyForecast = {
  latitude: number;
  longitude: number;
  timezone: string;
  days: DailyForecastDay[];
};

export async function getBrowserCoords(timeoutMs: number = 8000): Promise<{ lat: number; lon: number } | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return null;

    return await new Promise((resolve) => {
      let settled = false;
      const done = (v: { lat: number; lon: number } | null) => {
        if (settled) return;
        settled = true;
        resolve(v);
      };

      const t = globalThis.setTimeout(() => done(null), timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          globalThis.clearTimeout(t);
          done({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          globalThis.clearTimeout(t);
          done(null);
        },
        {
          enableHighAccuracy: false,
          timeout: timeoutMs,
          maximumAge: 5 * 60 * 1000,
        }
      );
    });
  } catch {
    return null;
  }
}

// Open-Meteo (no key): https://open-meteo.com/
export async function fetch7DayForecast(lat: number, lon: number): Promise<DailyForecast> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${encodeURIComponent(String(lat))}` +
    `&longitude=${encodeURIComponent(String(lon))}` +
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code" +
    "&timezone=auto";

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed (${res.status})`);

  const data: any = await res.json();
  const t = data?.daily?.time || [];
  const max = data?.daily?.temperature_2m_max || [];
  const min = data?.daily?.temperature_2m_min || [];
  const pr = data?.daily?.precipitation_sum || [];
  const wind = data?.daily?.wind_speed_10m_max || [];
  const code = data?.daily?.weather_code || [];

  const days: DailyForecastDay[] = t.map((d: string, i: number) => ({
    date: String(d),
    tempMaxC: Number(max[i] ?? 0),
    tempMinC: Number(min[i] ?? 0),
    windMaxKph: Number(wind[i] ?? 0),
    precipMm: Number(pr[i] ?? 0),
    weatherCode: Number(code[i] ?? 0),
  }));

  return {
    latitude: Number(data?.latitude ?? lat),
    longitude: Number(data?.longitude ?? lon),
    timezone: String(data?.timezone ?? "auto"),
    days: days.slice(0, 7),
  };
}



