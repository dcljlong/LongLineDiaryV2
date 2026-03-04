import React from "react";
import type { DailyForecast } from "@/lib/weather";
import WeatherIcon from "./WeatherIcon";

type Props = {
  forecast: DailyForecast | null;
  className?: string;
};

function dayLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export default function WeatherSevenDay({ forecast, className }: Props) {
  const days = forecast?.days ?? [];
  if (!days.length) return null;

  return (
    <div className={className}>
      <div className="rounded-xl border border-border/50 bg-[hsl(var(--surface-1))] shadow-[var(--shadow-1)] p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">7-day forecast</div>
          <div className="text-xs text-muted-foreground">Max / Min</div>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {days.slice(0, 7).map((d, i) => (
            <div key={d.date + i} className="rounded-lg border border-border/40 bg-[hsl(var(--surface-0))] px-2 py-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-foreground">{i === 0 ? "Today" : dayLabel(d.date)}</div>
                <div className="text-[10px] text-muted-foreground tabular-nums">{d.date.slice(5)}</div>
              </div>

              <div className="mt-2 flex items-center justify-center">
                <WeatherIcon code={d.weatherCode} className="h-10 w-10" title={`WMO ${d.weatherCode}`} />
              </div>

              <div className="mt-2 flex items-center justify-center gap-2 tabular-nums">
                <span className="text-sm font-extrabold text-foreground">{Math.round(d.tempMaxC)}°</span>
                <span className="text-xs text-muted-foreground">{Math.round(d.tempMinC)}°</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
                <span>{Math.round(d.precipMm)}mm</span>
                <span>{Math.round(d.windMaxKph)}k</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
