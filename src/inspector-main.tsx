import React from 'react';
import ReactDOM from 'react-dom/client';
import { TitleBar } from './components/TitleBar';
import { WebInspector } from './components/inspector/web-inspector/WebInspector';

const container = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(container).render(
    <React.StrictMode>
        <div className="h-screen flex flex-col overflow-hidden">
            <TitleBar subtitle="Web Inspector" showNotificationBadge={false} />
            <WebInspector />
        </div>
    </React.StrictMode>
);
