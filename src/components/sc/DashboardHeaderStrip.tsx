import React from "react";
import { RefreshCw, CloudSun, MapPin, Clock } from "lucide-react";

export type HeaderWeather = {
  locationLabel?: string;
  tempC?: number;
  summary?: string;
  updatedLabel?: string;
};

export type DashboardHeaderStripProps = {
  now: Date;
  weather?: HeaderWeather | null;
  weatherLoading?: boolean;
  onRefreshWeather?: (() => void) | null;

  // 4-item layout slots
  leftTop?: React.ReactNode;     // Item 1 (left / top line)
  leftBottom?: React.ReactNode;  // Item 2 (left / bottom line)
  rightTop?: React.ReactNode;    // Item 3 (right / top line)
  rightBottom?: React.ReactNode; // Item 4 (right / bottom line)

  // Optional compact text for far-left in wide view if you want it later
  leftLabel?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const hr12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  return pad2(hr12) + ":" + pad2(m) + " " + ampm;
}

function formatDateLine(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardHeaderStrip(props: DashboardHeaderStripProps) {
  const now = props.now;

  const temp =
    typeof props.weather?.tempC === "number"
      ? Math.round(props.weather!.tempC) + "°"
      : "—";

  const location = props.weather?.locationLabel || "—";
  const summary = props.weather?.summary || "";
  const updated = props.weather?.updatedLabel || "";

  return (
<div className=" -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 bg-card border-b border-border/50 shadow-sm">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* LEFT: 2-line slot (Items 1/2) */}
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">
            {props.leftTop ?? props.leftLabel ?? null}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground truncate">
            {props.leftBottom ?? null}
          </div>
        </div>

                                {/* CENTER: (date/time moved to top sticky header) */}
        <div className="flex items-center justify-center" title={formatDateLine(now) + " " + formatTime(now)}>
          <div />
        </div>

        {/* RIGHT: 2-line slot + weather + refresh (Items 3/4 live here by default) */}
        <div className="min-w-0 flex items-center justify-end gap-2">
          <div className="min-w-0 text-right">
            <div className="text-xs text-muted-foreground truncate">
              {props.rightTop ?? null}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground truncate">
              {props.rightBottom ?? null}
            </div>
          </div>

          {/* Compact weather pill (can be removed later once your 4 items are final) */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/60">
            <CloudSun className="w-4 h-4 text-foreground" />
            <div className="leading-tight min-w-0">
              <div className="flex items-center justify-end gap-2 text-sm font-semibold text-foreground">
                <span>{temp}</span>
                <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground min-w-0">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{location}</span>
                </span>
              </div>
              {(summary || updated) ? (
                <div className="text-[11px] text-muted-foreground truncate">
                  {summary ? summary : null}
                  {summary && updated ? " • " : null}
                  {updated ? updated : null}
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={props.onRefreshWeather ? props.onRefreshWeather : undefined}
            disabled={!props.onRefreshWeather || !!props.weatherLoading}
            className="p-2 rounded-lg border border-border hover:bg-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Refresh weather"
            title="Refresh weather"
          >
            <RefreshCw className={props.weatherLoading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          </button>
        </div>
      </div>
    </div>
  );
}












