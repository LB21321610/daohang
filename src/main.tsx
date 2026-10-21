import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import "./styles.css";

// Only Chromium renders SVG filters inside backdrop-filter, so the refraction layer is opt-in there.
const userAgentData = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData;
if (userAgentData?.brands?.some(({ brand }) => brand === "Chromium")) {
  document.documentElement.dataset.glass = "refract";
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
