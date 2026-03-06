import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function MobileInspector() {
  const [loading, setLoading] = useState(true);
  const inspectorUrl = "http://127.0.0.1:4723/inspector";

  useEffect(() => {
    // Simple check to see if the inspector is reachable
    const checkInspector = async () => {
      try {
        const response = await fetch(inspectorUrl, { mode: 'no-cors' });
        // Since we use no-cors, we can't check status, but it means network request succeeded
        setLoading(false);
      } catch (e) {
        // Retry after delay
        setTimeout(checkInspector, 1000);
      }
    };
    checkInspector();
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Waiting for Appium Inspector...</p>
          </div>
        </div>
      )}
      <iframe 
        src={inspectorUrl}
        className="w-full h-full border-none flex-1"
        title="Appium Inspector"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
