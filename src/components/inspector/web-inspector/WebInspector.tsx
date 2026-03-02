import { useCallback, useEffect, useRef, useState } from 'react';
import './style.css';

interface ElementInfo {
    tagName: string;
    id: string;
    testId: string | null;
    className: string;
    text: string;
    type: string;
    name: string;
}

export function WebInspector() {
    const [urlInput, setUrlInput] = useState('');
    const [status, setStatus] = useState('Ready');
    const [isInspectMode, setIsInspectMode] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [showRecordedScript, setShowRecordedScript] = useState(false);
    const [currentSelector, setCurrentSelector] = useState('');
    const [selectorOutputText, setSelectorOutputText] = useState('Click an element...');
    const [codeLog, setCodeLog] = useState<string[]>([]);
    const [recordedCode, setRecordedCode] = useState('');
    const [elementInfo, setElementInfo] = useState<ElementInfo>({
        tagName: '-',
        id: '-',
        testId: null,
        className: '-',
        text: '-',
        type: '-',
        name: '-',
    });

    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const emptyStateRef = useRef<HTMLDivElement | null>(null);
    const copyBtnRef = useRef<HTMLButtonElement | null>(null);
    const copyScriptBtnRef = useRef<HTMLButtonElement | null>(null);
    const resizeHandleRef = useRef<HTMLDivElement | null>(null);
    const isResizingRef = useRef(false);

    const log = useCallback((msg: string) => {
        setCodeLog(prev => [...prev, `> ${msg}`]);
    }, []);

    const addToRecordedScript = useCallback((line: string) => {
        setRecordedCode(prev => {
            const next = prev ? `${prev}\n${line}` : line;
            return next;
        });
    }, []);

    const updateInfo = useCallback((info: ElementInfo) => {
        const classText =
            typeof info.className === 'string'
                ? info.className.replace('wdio-inspector-hover', '').trim() || '-'
                : '-';

        setElementInfo({
            tagName: info.tagName,
            id: info.id || '-',
            testId: info.testId,
            className: classText,
            text: info.text || '-',
            type: info.type || '-',
            name: info.name || '-',
        });
    }, []);

    const generateSelector = useCallback((el: HTMLElement): string => {
        const testId = el.getAttribute('data-test-id');
        if (testId) return `~${testId}`;

        if (el.id) return `#${el.id}`;

        if (el.className && typeof el.className === 'string') {
            const classes = el.className
                .split(' ')
                .filter(c => c !== 'wdio-inspector-hover' && c.trim() !== '');
            if (classes.length > 0) {
                const escapedClass = (window as any).CSS?.escape
                    ? (window as any).CSS.escape(classes[0])
                    : classes[0];
                return `.${escapedClass}`;
            }
        }

        if (el.tagName === 'BUTTON' || el.tagName === 'A') {
            const text = el.innerText?.trim();
            if (text) return `${el.tagName.toLowerCase()}=${text}`;
        }

        return el.tagName.toLowerCase();
    }, []);

    const injectInspectorScript = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        try {
            const doc = iframe.contentDocument;
            if (!doc) {
                log('Error: Cannot access iframe content.');
                return;
            }

            const style = doc.createElement('style');
            style.textContent = `
                .wdio-inspector-hover {
                    outline: 2px solid #3b82f6 !important;
                    cursor: crosshair !important;
                    background-color: rgba(59, 130, 246, 0.1) !important;
                }
            `;
            doc.head.appendChild(style);

            const body = doc.body;
            if (!body) {
                log('Error: Iframe body not available.');
                return;
            }

            body.addEventListener(
                'mouseover',
                e => {
                    if (!isInspectMode) return;
                    e.stopPropagation();

                    const prev = doc.querySelectorAll('.wdio-inspector-hover');
                    prev.forEach(el => el.classList.remove('wdio-inspector-hover'));

                    const target = e.target as HTMLElement;
                    target.classList.add('wdio-inspector-hover');

                    const info: ElementInfo = {
                        tagName: target.tagName.toLowerCase(),
                        id: target.id,
                        testId: target.getAttribute('data-test-id'),
                        className: target.className as string,
                        text: (target as any).innerText?.substring(0, 100) || '',
                        type: (target as any).type || '',
                        name: (target as any).name || '',
                    };
                    updateInfo(info);
                },
                true
            );

            body.addEventListener(
                'mouseout',
                e => {
                    if (!isInspectMode) return;
                    const target = e.target as HTMLElement;
                    target.classList.remove('wdio-inspector-hover');
                },
                true
            );

            body.addEventListener(
                'click',
                e => {
                    const target = e.target as HTMLElement;

                    const link = target.closest('a');
                    if (link && (link as HTMLAnchorElement).href) {
                        e.preventDefault();
                        e.stopPropagation();

                        if (isInspectMode) {
                            const selector = generateSelector(link as HTMLElement);
                            setCurrentSelector(selector);
                            setSelectorOutputText(`$('${selector}')`);
                            log(`Selected: ${selector}`);
                            link.classList.remove('wdio-inspector-hover');
                            return;
                        }

                        if (isRecording) {
                            const selector = generateSelector(link as HTMLElement);
                            addToRecordedScript(`await $('${selector}').click();`);
                        }

                        const href = (link as HTMLAnchorElement).getAttribute('href');
                        if (href) {
                            const current = urlInput || iframe.src;
                            try {
                                const currentUrl = new URL(current);
                                const targetUrl = new URL(href, currentUrl.href).href;
                                setUrlInput(targetUrl);
                                iframe.src = targetUrl;
                                log(`Loading: ${targetUrl}`);
                            } catch {
                                log('Invalid navigation URL');
                            }
                        }
                        return;
                    }

                    if (!isInspectMode && !isRecording) return;

                    if (isRecording) {
                        const selector = generateSelector(target);
                        addToRecordedScript(`await $('${selector}').click();`);
                        return;
                    }

                    if (isInspectMode) {
                        e.preventDefault();
                        e.stopPropagation();

                        const selector = generateSelector(target);
                        setCurrentSelector(selector);
                        setSelectorOutputText(`$('${selector}')`);
                        log(`Selected: ${selector}`);

                        target.classList.remove('wdio-inspector-hover');
                    }
                },
                true
            );

            body.addEventListener(
                'change',
                e => {
                    if (!isRecording) return;
                    const target = e.target as HTMLInputElement;
                    const selector = generateSelector(target as unknown as HTMLElement);
                    const value = (target.value || '').replace(/'/g, "\\'");
                    addToRecordedScript(`await $('${selector}').setValue('${value}');`);
                },
                true
            );

            log('Inspector script injected successfully.');
        } catch (e: any) {
            log(`Injection Failed: ${e?.message || String(e)}`);
        }
    }, [addToRecordedScript, generateSelector, isInspectMode, isRecording, log, updateInfo, urlInput]);

    const handleLoadUrl = useCallback(
        (rawUrl?: string) => {
            let url = rawUrl ?? urlInput;
            if (!url) return;

            if (!url.startsWith('http')) {
                url = `https://${url}`;
            }

            const iframe = iframeRef.current;
            const empty = emptyStateRef.current;
            if (iframe && empty) {
                empty.classList.add('hidden');
                iframe.classList.add('loaded');
                iframe.src = url;
                setUrlInput(url);
                setStatus('Loading');
                log(`Loading: ${url}`);
            }
        },
        [log, urlInput]
    );

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            setStatus('Loaded');
            injectInspectorScript();
        };

        iframe.addEventListener('load', handleLoad);
        return () => {
            iframe.removeEventListener('load', handleLoad);
        };
    }, [injectInspectorScript]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const initial = params.get('url');
        if (initial) {
            setUrlInput(initial);
            handleLoadUrl(initial);
        }
    }, [handleLoadUrl]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            const newWidth = e.clientX;
            if (newWidth >= 250 && newWidth <= 600) {
                document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
            }
        };

        const handleMouseUp = () => {
            if (isResizingRef.current) {
                isResizingRef.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleResizeMouseDown = () => {
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleToggleInspect = () => {
        const next = !isInspectMode;
        setIsInspectMode(next);
        if (next && isRecording) {
            setIsRecording(false);
            setShowRecordedScript(false);
        }
    };

    const handleToggleRecord = () => {
        const next = !isRecording;
        setIsRecording(next);
        setShowRecordedScript(next);
        if (next && isInspectMode) {
            setIsInspectMode(false);
        }
    };

    const handleCopySelector = () => {
        if (!currentSelector) return;
        const btn = copyBtnRef.current;
        if (!btn) return;
        navigator.clipboard.writeText(currentSelector);
        const original = btn.innerHTML;
        btn.innerHTML = '<span class="material-icons-outlined">check</span>';
        setTimeout(() => {
            btn.innerHTML = original;
        }, 1000);
    };

    const handleCopyScript = () => {
        if (!recordedCode) return;
        const btn = copyScriptBtnRef.current;
        if (!btn) return;
        navigator.clipboard.writeText(recordedCode);
        const original = btn.innerHTML;
        btn.innerHTML = '<span class="material-icons-outlined">check</span>';
        setTimeout(() => {
            btn.innerHTML = original;
        }, 1000);
    };

    return (
        <div className="web-inspector-container">
            <header className="header">
                <div className="header-left">
                    <span className="material-icons-outlined">bug_report</span>
                    <h1>Inspector</h1>
                </div>
                <div className="header-center">
                    <input
                        type="text"
                        id="currentUrl"
                        className="url-display"
                        placeholder="Enter URL to inspect..."
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleLoadUrl();
                        }}
                    />
                    <button id="loadUrl" className="load-btn" onClick={() => handleLoadUrl()}>
                        Load
                    </button>
                </div>
                <div className="header-right">
                    <span className="status" id="status">
                        {status}
                    </span>
                    <div className="toggle-wrapper">
                        <label htmlFor="recordMode">Record Mode</label>
                        <button
                            className="toggle"
                            id="recordMode"
                            role="switch"
                            aria-checked={isRecording}
                            onClick={handleToggleRecord}
                        >
                            <span className="toggle-slider"></span>
                        </button>
                    </div>
                    <div className="toggle-wrapper">
                        <label htmlFor="inspectMode">Inspect Mode</label>
                        <button
                            className="toggle"
                            id="inspectMode"
                            role="switch"
                            aria-checked={isInspectMode}
                            onClick={handleToggleInspect}
                        >
                            <span className="toggle-slider"></span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="main-layout">
                <aside className="sidebar">
                    <div className="sidebar-content">
                        <div className="element-panel">
                            <div className="panel-header">
                                <h3>Selected Element</h3>
                            </div>
                            <div className="element-info" id="elementInfo">
                                <div className="info-row">
                                    <span className="info-label">Tag:</span>
                                    <span className="info-value" id="infoTag">
                                        {elementInfo.tagName === '-' ? '-' : `<${elementInfo.tagName}>`}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">ID:</span>
                                    <span className="info-value" id="infoId">
                                        {elementInfo.id}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Test ID:</span>
                                    <span className="info-value" id="infoTestId">
                                        {elementInfo.testId || '-'}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Class:</span>
                                    <span className="info-value" id="infoClass">
                                        {elementInfo.className}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Text:</span>
                                    <span className="info-value" id="infoText">
                                        {elementInfo.text}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Type:</span>
                                    <span className="info-value" id="infoType">
                                        {elementInfo.type}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Name:</span>
                                    <span className="info-value" id="infoName">
                                        {elementInfo.name}
                                    </span>
                                </div>
                                <div className="selector-group">
                                    <label>WebDriverIO Selector</label>
                                    <div className="selector-display">
                                        <code id="selectorOutput">{selectorOutputText}</code>
                                        <button
                                            className="copy-btn"
                                            id="copyBtn"
                                            title="Copy"
                                            ref={copyBtnRef}
                                            onClick={handleCopySelector}
                                        >
                                            <span className="material-icons-outlined">content_copy</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`element-panel ${showRecordedScript ? '' : 'hidden'}`} id="recordedScriptPanel">
                            <div className="panel-header">
                                <h3>Recorded Script</h3>
                                <button
                                    className="header-copy-btn"
                                    id="copyScriptBtn"
                                    title="Copy Script"
                                    ref={copyScriptBtnRef}
                                    onClick={handleCopyScript}
                                >
                                    <span className="material-icons-outlined">content_copy</span>
                                </button>
                            </div>
                            <div className="script-display">
                                <pre id="recordedCode">{recordedCode}</pre>
                            </div>
                        </div>
                    </div>

                    <div className="code-section">
                        <div className="code-header">
                            <label>Command History</label>
                        </div>
                        <pre id="codeLog">{codeLog.join('\n')}</pre>
                    </div>
                </aside>

                <div
                    className="resize-handle"
                    ref={resizeHandleRef}
                    onMouseDown={handleResizeMouseDown}
                ></div>

                <main className="main-content">
                    <div className="iframe-wrapper" id="iframeWrapper">
                        <div className="empty-state" id="emptyState" ref={emptyStateRef}>
                            <span className="material-icons-outlined empty-icon">link_off</span>
                            <h2>No URL Loaded</h2>
                            <p>Please enter a target URL and click 'Load' to begin inspection.</p>
                        </div>
                        <iframe id="targetFrame" src="about:blank" ref={iframeRef}></iframe>
                    </div>
                </main>
            </div>
        </div>
    );
}

