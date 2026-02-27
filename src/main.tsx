import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme-runtime";

initTheme();

function showFatal(msg: string) {
  try {
    const el = document.createElement("pre");
    el.style.whiteSpace = "pre-wrap";
    el.style.wordBreak = "break-word";
    el.style.padding = "16px";
    el.style.margin = "0";
    el.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
    el.textContent = msg;
    document.body.innerHTML = "";
    document.body.appendChild(el);
  } catch {
    // ignore
  }
}

// Catch runtime errors that might otherwise leave a blank screen
window.addEventListener("error", (e) => {
  const err = (e as any)?.error;
  const msg =
    "FATAL: window.error\n\n" +
    String((e as any)?.message || "Unknown error") +
    (err?.stack ? "\n\n" + err.stack : "");
  showFatal(msg);
});

window.addEventListener("unhandledrejection", (e) => {
  const reason = (e as any)?.reason;
  const msg =
    "FATAL: unhandledrejection\n\n" +
    String(reason?.message || reason || "Unknown rejection") +
    (reason?.stack ? "\n\n" + reason.stack : "");
  showFatal(msg);
});

// Defensive: unregister any previously-installed service workers that may be caching old bundles
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
