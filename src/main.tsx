import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from './lib/theme-runtime';

initTheme();

// Register service worker
createRoot(document.getElementById("root")!).render(<App />);



