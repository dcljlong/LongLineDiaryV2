import React from "react";
import type { DailyForecast } from "@/lib/weather";
import WeatherIcon from "./WeatherIcon";

type Props = {
  forecast: DailyForecast | null;
  className?: string;
};

function weekdayShort(isoDate: string) {
  // use midday to avoid DST edge cases
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export default function WeatherSevenDay({ forecast, className }: Props) {
  if (!forecast?.days?.length) return null;

  return (
    <div className={className || ""}>
      <div className="flex flex-wrap gap-2">
        {forecast.days.slice(0, 7).map((d) => {
          const hi = Math.round(Number(d.tempMaxC ?? 0));
          const lo = Math.round(Number(d.tempMinC ?? 0));
          return (
            <div
              key={d.date}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-[hsl(var(--surface-1))] px-2 py-1 shadow-[var(--shadow-1)]"
              title={`${d.date} • ${hi}°/${lo}°`}
            >
              <div className="flex flex-col items-center leading-none w-10">
                <div className="text-[10px] font-semibold text-muted-foreground">
                  {weekdayShort(d.date)}
                </div>
                <WeatherIcon code={d.weatherCode} className="h-5 w-5" title={`WMO ${d.weatherCode}`} />
              </div>

              <div className="flex items-baseline gap-1 tabular-nums">
                <span className="text-xs font-extrabold text-foreground">{hi}°</span>
                <span className="text-[10px] font-semibold text-muted-foreground">/</span>
                <span className="text-[10px] font-semibold text-muted-foreground">{lo}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}