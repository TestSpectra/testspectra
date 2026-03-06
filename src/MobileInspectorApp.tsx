import { MobileInspector } from "./components/MobileInspector";
import { TitleBar } from "./components/TitleBar";
import { Toaster } from "./components/ui/sonner";
import { VersionGuard } from "./components/VersionGuard";

export function MobileInspectorApp() {
  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <TitleBar subtitle="Mobile Inspector" showNotificationBadge={false} />
        <main className="flex-1 overflow-hidden">
          <MobileInspector />
        </main>
      </div>
      <Toaster />
    </>
  );
}
