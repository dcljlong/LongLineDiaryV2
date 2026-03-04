import React from "react";

type Props = {
  code?: number | null;   // Open-Meteo weather_code
  isNight?: boolean;
  className?: string;
  title?: string;
};

const BASE = new URL(/* @vite-ignore */ "../../assets/weather-icons/weather-icons-main/animated/", import.meta.url);

function fileFor(code: number, isNight: boolean): string {
  if (code === 0) return isNight ? "clear-night.svg" : "clear-day.svg";
  if (code === 1) return isNight ? "cloudy-1-night.svg" : "cloudy-1-day.svg";
  if (code === 2) return isNight ? "cloudy-2-night.svg" : "cloudy-2-day.svg";
  if (code === 3) return "cloudy.svg";

  if (code === 45 || code === 48) return "fog.svg";

  if (code === 51 || code === 53 || code === 55) return "rainy-1.svg";
  if (code === 56 || code === 57) return "rain-and-sleet-mix.svg";

  if (code === 61 || code === 63) return "rainy-2.svg";
  if (code === 65) return "rainy-3.svg";
  if (code === 66 || code === 67) return "rain-and-snow-mix.svg";

  if (code === 71 || code === 73) return "snowy-2.svg";
  if (code === 75) return "snowy-3.svg";
  if (code === 77) return "snowy-1.svg";

  if (code === 80 || code === 81) return isNight ? "rainy-2-night.svg" : "rainy-2-day.svg";
  if (code === 82) return isNight ? "rainy-3-night.svg" : "rainy-3-day.svg";

  if (code === 85 || code === 86) return isNight ? "snowy-2-night.svg" : "snowy-2-day.svg";

  if (code === 95 || code === 96 || code === 99) return "thunderstorms.svg";

  return "cloudy.svg";
}

export default function WeatherIcon({ code, isNight = false, className, title }: Props) {
  const c = typeof code === "number" ? code : 3;
  const file = fileFor(c, isNight);
  const src = new URL(file, BASE).toString();

  return (
    <img
      src={src}
      className={className}
      alt={title || "Weather"}
      title={title || "Weather"}
      draggable={false}
    />
  );
}


