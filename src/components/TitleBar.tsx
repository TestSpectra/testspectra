import { useEffect, useState } from 'react';

export function TitleBar() {
    const [isMacOS, setIsMacOS] = useState(false);

    useEffect(() => {
        // Check if running on macOS
        const checkPlatform = async () => {
            try {
                // @ts-ignore
                if (window.__TAURI__) {
                    const { platform } = await import('@tauri-apps/plugin-os');
                    const currentPlatform = platform();
                    setIsMacOS(currentPlatform === 'macos');
                }
            } catch (error) {
                // Fallback to user agent check for browser
                setIsMacOS(navigator.userAgent.includes('Mac'));
            }
        };
        
        checkPlatform();
    }, []);

    // Don't render if not macOS
    if (!isMacOS) {
        return null;
    }

    return (
        <div
            data-tauri-drag-region
            className="h-8 w-full bg-slate-900 border-b border-slate-800 flex items-center select-none shrink-0"
        >
            {/* Left side - Reserve space for macOS traffic lights */}
            <div className="w-20" />

            {/* Center - App info (draggable area) */}
            <div className="w-full flex items-center gap-2 flex-1 justify-center cursor-default select-none" data-tauri-drag-region>
                <span className="text-xs font-semibold text-slate-300">TestSpectra</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">QA Automation Platform</span>
            </div>

            {/* Right side - Empty space for balance */}
            <div className="w-20" />
        </div>
    );
}
