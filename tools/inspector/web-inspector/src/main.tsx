import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import WebInspector from "./components/WebInspector.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WebInspector />
  </StrictMode>,
);
