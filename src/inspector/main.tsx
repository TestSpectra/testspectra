import React from "react";
import ReactDOM from "react-dom/client";
import { WebInspector } from "../components/inspector/web-inspector/WebInspector";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WebInspector />
  </React.StrictMode>,
);
