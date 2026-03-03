import React from "react";
import ReactDOM from "react-dom/client";
import { WebInspector } from "../components/inspector/web-inspector/WebInspector";
import { TitleBar } from "@/components/TitleBar";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <div className="flex flex-col h-screen">
      <TitleBar showNotificationBadge={false} subtitle="Web Inspector" />
      <WebInspector />
    </div>
  </React.StrictMode>,
);
