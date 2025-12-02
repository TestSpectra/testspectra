import { useEffect, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { NotificationBadge } from './NotificationBadge';

type Platform = 'macos' | 'windows' | 'linux' | 'unknown';

export function TitleBar() {
    const [platform, setPlatform] = useState<Platform>('unknown');
    const [isMaximized, setIsMaximized] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const checkPlatform = async () => {
            try {
                // @ts-ignore
                if (window.__TAURI__) {
                    const { platform: getPlatform } = await import('@tauri-apps/plugin-os');
                    const { getCurrentWindow } = await import('@tauri-apps/api/window');

                    const currentPlatform = getPlatform();
                    setPlatform(currentPlatform as Platform);

                    // Check if window is maximized
                    const appWindow = getCurrentWindow();
                    const maximized = await appWindow.isMaximized();
                    setIsMaximized(maximized);
                }
            } catch (error) {
                console.error('Failed to detect platform:', error);
                // Fallback to user agent check
                if (navigator.userAgent.includes('Mac')) setPlatform('macos');
                else if (navigator.userAgent.includes('Win')) setPlatform('windows');
                else setPlatform('linux');
            }
        };

        checkPlatform();
    }, []);

    const handleMinimize = async () => {
        try {
            // @ts-ignore
            if (window.__TAURI__) {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                await getCurrentWindow().minimize();
            }
        } catch (error) {
            console.error('Failed to minimize:', error);
        }
    };

    const handleMaximize = async () => {
        try {
            // @ts-ignore
            if (window.__TAURI__) {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');

                // macOS uses fullscreen, Windows/Linux uses maximize
                if (platform === 'macos') {
                    const isFullscreen = await getCurrentWindow().isFullscreen();
                    await getCurrentWindow().setFullscreen(!isFullscreen);
                } else {
                    await getCurrentWindow().toggleMaximize();
                    const isMaximized = await getCurrentWindow().isMaximized();
                    setIsMaximized(isMaximized);
                }
            }
        } catch (error) {
            console.error('Failed to maximize:', error);
        }
    };

    const handleClose = async () => {
        try {
            // @ts-ignore
            if (window.__TAURI__) {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                await getCurrentWindow().close();
            }
        } catch (error) {
            console.error('Failed to close:', error);
        }
    };

    // macOS style window controls
    const MacOSControls = () => (
        <div className="flex items-center gap-2 pl-3 group">
            <button
                onClick={handleClose}
                className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff4136] flex items-center justify-center group-hover:opacity-100 opacity-100 transition-opacity"
                aria-label="Close"
            >
                <X className="w-2 h-2 text-[#4d0000] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
            </button>
            <button
                onClick={handleMinimize}
                className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffaa00] flex items-center justify-center group-hover:opacity-100 opacity-100 transition-opacity"
                aria-label="Minimize"
            >
                <Minus className="w-2 h-2 text-[#995700] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
            </button>
            <button
                onClick={handleMaximize}
                className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#1fa832] flex items-center justify-center group-hover:opacity-100 opacity-100 transition-opacity"
                aria-label="Maximize"
            >
                <Square className="w-1.5 h-1.5 text-[#004d00] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
            </button>
        </div>
    );

    // Windows/Linux style window controls
    const WindowsControls = () => (
        <div className="flex items-center h-full">
            <button
                onClick={handleMinimize}
                className="h-full px-4 hover:bg-slate-800 flex items-center justify-center transition-colors"
                aria-label="Minimize"
            >
                <Minus className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            </button>
            <button
                onClick={handleMaximize}
                className="h-full px-4 hover:bg-slate-800 flex items-center justify-center transition-colors"
                aria-label="Maximize"
            >
                {isMaximized ? (
                    <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="1" width="8" height="8" />
                        <path d="M1 3 L1 11 L9 11" />
                    </svg>
                ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                )}
            </button>
            <button
                onClick={handleClose}
                className="h-full px-4 hover:bg-red-600 flex items-center justify-center transition-colors"
                aria-label="Close"
            >
                <X className="w-4 h-4 text-slate-400 hover:text-white" strokeWidth={1.5} />
            </button>
        </div>
    );

    return (
        <div
            data-tauri-drag-region
            className="z-200 h-10 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none shrink-0 overflow-hidden"
        >
            {/* Left side - macOS controls or empty space */}
            <div className="flex items-center h-full">
                {platform === 'macos' && <MacOSControls />}
            </div>

            {/* Center - App info (draggable area) */}
            <div
                className={`flex items-center gap-2 flex-1 cursor-default select-none px-4 transition-all duration-200 ${platform !== 'macos' ? 'justify-start' : 'justify-center'}`}
                data-tauri-drag-region
            >
                <span className="text-xs font-semibold text-slate-300">TestSpectra</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">QA Automation Platform</span>
            </div>

            {/* Right side - Notification badge and Windows/Linux controls */}
            <div className="flex items-center h-full gap-2">
                <div className="pr-4">
                    <NotificationBadge
                        unreadCount={unreadCount}
                        onUnreadCountChange={setUnreadCount}
                    />
                </div>
                {platform !== 'macos' && platform !== 'unknown' && <WindowsControls />}
            </div>
        </div>
    );
}
