import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from './lib/theme-runtime';

initTheme();

// Register service worker
registerSW({
  immediate: true,
});

createRoot(document.getElementById("root")!).render(<App />);


