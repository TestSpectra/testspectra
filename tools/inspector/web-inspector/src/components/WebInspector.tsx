import { useCallback, useEffect, useRef, useState } from "react";
import { Bug, ArrowLeft, ArrowRight, Copy, Link2Off, RotateCcw } from "lucide-react";

interface ElementInfo {
  tagName: string;
  id: string;
  testId: string | null;
  className: string;
  text: string;
  type: string;
  name: string;
}

export default function WebInspector() {
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState("Ready");
  const [isInspectMode, setIsInspectMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordedScript, setShowRecordedScript] = useState(false);
  const [currentSelector, setCurrentSelector] = useState("");
  const [selectorOutputText, setSelectorOutputText] = useState(
    "Click an element...",
  );
  const [codeLog, setCodeLog] = useState<string[]>([]);
  const [recordedCode, setRecordedCode] = useState("");
  const [elementInfo, setElementInfo] = useState<ElementInfo>({
    tagName: "-",
    id: "-",
    testId: null,
    className: "-",
    text: "-",
    type: "-",
    name: "-",
  });

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeUrl, setIframeUrl] = useState("/");

  const emptyStateRef = useRef<HTMLDivElement | null>(null);
  const copyBtnRef = useRef<HTMLButtonElement | null>(null);
  const copyScriptBtnRef = useRef<HTMLButtonElement | null>(null);
  const resizeHandleRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);
  const isInspectModeRef = useRef(isInspectMode);
  const isRecordingRef = useRef(isRecording);
  const currentPageUrlRef = useRef<string | null>(null);

  const log = useCallback((msg: string) => {
    setCodeLog((prev) => [...prev, `> ${msg}`]);
  }, []);

  useEffect(() => {
    isInspectModeRef.current = isInspectMode;
  }, [isInspectMode]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const addToRecordedScript = useCallback((line: string) => {
    setRecordedCode((prev) => {
      const next = prev ? `${prev}\n${line}` : line;
      return next;
    });
  }, []);

  const updateInfo = useCallback((info: ElementInfo) => {
    const classText =
      typeof info.className === "string"
        ? info.className.replace("wdio-inspector-hover", "").trim() || "-"
        : "-";

    setElementInfo({
      tagName: info.tagName,
      id: info.id || "-",
      testId: info.testId,
      className: classText,
      text: info.text || "-",
      type: info.type || "-",
      name: info.name || "-",
    });
  }, []);

  const generateSelector = useCallback((el: HTMLElement): string => {
    const testId = el.getAttribute("data-test-id");
    if (testId) return `~${testId}`;

    if (el.id) return `#${el.id}`;

    if (el.className && typeof el.className === "string") {
      const classes = el.className
        .split(" ")
        .filter((c) => c !== "wdio-inspector-hover" && c.trim() !== "");
      if (classes.length > 0) {
        const escapedClass = (window as any).CSS?.escape
          ? (window as any).CSS.escape(classes[0])
          : classes[0];
        return `.${escapedClass}`;
      }
    }

    if (el.tagName === "BUTTON" || el.tagName === "A") {
      const text = el.innerText?.trim();
      if (text) return `${el.tagName.toLowerCase()}=${text}`;
    }

    return el.tagName.toLowerCase();
  }, []);

  const handleLoadUrl = useCallback(
    (rawUrl?: string) => {
      let url = rawUrl ?? urlInput;
      if (!url) return;

      if (!url.startsWith("http")) {
        url = `https://${url}`;
      }

      setStatus("Loading");
      log(`Loading: ${url}`);
      setUrlInput(url);

      const isCurrentServer =
        window.location.hostname === "127.0.0.1" &&
        window.location.pathname === "/__/inspector";

      try {
        const targetOrigin = new URL(url).origin;
        // If we want to navigate smoothly instead of full reloading
        if (isCurrentServer) {
          // First time loading from the empty placeholder state
          window.location.href = targetOrigin + "/__/inspector";
        } else if (window.location.origin !== targetOrigin) {
          // we are migrating across different origins so we must do a full redirect
          window.location.href = targetOrigin + "/__/inspector";
        } else {
          // Same origin map just navigating the active iframe
          const empty = emptyStateRef.current;
          if (empty) empty.classList.add("hidden");
          currentPageUrlRef.current = url;
          setIframeUrl(url.replace(targetOrigin, ""));
        }
      } catch (e) {
        log(`Invalid URL: ${url}`);
      }
    },
    [log, urlInput],
  );

  const injectInspectorScript = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) {
        log("Error: Cannot access iframe content.");
        return;
      }

      const style = doc.createElement("style");
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
        log("Error: Iframe body not available.");
        return;
      }

      body.addEventListener(
        "mouseover",
        (e) => {
          if (!isInspectModeRef.current) return;
          e.stopPropagation();

          const prev = doc.querySelectorAll(".wdio-inspector-hover");
          prev.forEach((el) => el.classList.remove("wdio-inspector-hover"));

          const target = e.target as HTMLElement;
          target.classList.add("wdio-inspector-hover");

          const info: ElementInfo = {
            tagName: target.tagName.toLowerCase(),
            id: target.id,
            testId: target.getAttribute("data-test-id"),
            className: target.className as string,
            text: (target as any).innerText?.substring(0, 100) || "",
            type: (target as any).type || "",
            name: (target as any).name || "",
          };
          updateInfo(info);
        },
        true,
      );

      body.addEventListener(
        "mouseout",
        (e) => {
          if (!isInspectModeRef.current) return;
          const target = e.target as HTMLElement;
          target.classList.remove("wdio-inspector-hover");
        },
        true,
      );

      body.addEventListener(
        "click",
        (e) => {
          const target = e.target as HTMLElement;

          if (isInspectModeRef.current) {
            e.preventDefault();
            e.stopPropagation();

            const link = target.closest("a");
            const element = link || target;

            const selector = generateSelector(element);
            setCurrentSelector(selector);
            setSelectorOutputText(`$('${selector}')`);
            log(`Selected: ${selector}`);

            element.classList.remove("wdio-inspector-hover");
            return;
          }

          if (isRecordingRef.current) {
            const link = target.closest("a");
            const element = link || target;
            const selector = generateSelector(element);
            addToRecordedScript(`await $('${selector}').click();`);
            // Do NOT preventDefault, let the SPA framework handle the navigation natively!
          }
        },
        true,
      );

      body.addEventListener(
        "change",
        (e) => {
          if (!isRecordingRef.current) return;
          const target = e.target as HTMLInputElement;
          const selector = generateSelector(target as unknown as HTMLElement);
          const value = (target.value || "").replace(/'/g, "\\'");
          addToRecordedScript(`await $('${selector}').setValue('${value}');`);
        },
        true,
      );

      log("Inspector script injected successfully.");
    } catch (e: any) {
      log(`Injection Failed: ${e?.message || String(e)}`);
    }
  }, [
    addToRecordedScript,
    generateSelector,
    handleLoadUrl,
    log,
    updateInfo,
    urlInput,
  ]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setStatus("Loaded");
      injectInspectorScript();
    };

    iframe.addEventListener("load", handleLoad);
    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, [injectInspectorScript]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = e.clientX;
      if (newWidth >= 250 && newWidth <= 600) {
        document.documentElement.style.setProperty(
          "--sidebar-width",
          `${newWidth}px`,
        );
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleResizeMouseDown = () => {
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleBack = () => {
    iframeRef.current?.contentWindow?.history.back();
  };

  const handleForward = () => {
    iframeRef.current?.contentWindow?.history.forward();
  };

  const handleReload = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        // Use current location, not initial src
        iframe.contentWindow.location.reload();
        setStatus("Reloading");
        log("Reloading page...");
      } catch (e) {
        // Fallback to src reload if cross-origin
        iframe.src = iframe.src;
        setStatus("Reloading");
        log("Reloading page (fallback)...");
      }
    }
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
    btn.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>';
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
    btn.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>';
    setTimeout(() => {
      btn.innerHTML = original;
    }, 1000);
  };

  useEffect(() => {
    // If we're on the local root proxy, keep empty state visible until nav
    const isCurrentServer =
      window.location.hostname === "127.0.0.1" &&
      window.location.pathname === "/__/inspector";

    // Check if we have a target URL from cross-origin redirect
    const urlParams = new URLSearchParams(window.location.search);
    const targetUrl = urlParams.get('target');
    const shouldInspect = urlParams.get('inspect') === '1';
    const shouldRecord = urlParams.get('record') === '1';
    
    if (targetUrl) {
      try {
        const decodedUrl = decodeURIComponent(targetUrl);
        log(`Loading target URL from redirect: ${decodedUrl}`);
        
        // Restore inspector modes
        if (shouldInspect) {
          setIsInspectMode(true);
          log('Restored inspect mode');
        }
        if (shouldRecord) {
          setIsRecording(true);
          setShowRecordedScript(true);
          log('Restored record mode');
        }
        
        const empty = emptyStateRef.current;
        if (empty) empty.classList.add("hidden");
        
        const targetUrlObj = new URL(decodedUrl);
        const cleanPath = targetUrlObj.pathname + targetUrlObj.search + targetUrlObj.hash;
        
        setIframeUrl(cleanPath);
        setUrlInput(decodedUrl);
        currentPageUrlRef.current = decodedUrl;
        
        // Clean up URL by removing all inspector parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('target');
        newUrl.searchParams.delete('inspect');
        newUrl.searchParams.delete('record');
        window.history.replaceState({}, '', newUrl.toString());
        
        return;
      } catch (e) {
        log(`Invalid target URL: ${targetUrl}`);
      }
    }

    // Only prefill iframe if we're on an actual user target site
    if (!isCurrentServer) {
      const empty = emptyStateRef.current;
      if (empty) empty.classList.add("hidden");
      // Remove origin from the url since iframe path is relative
      const cleanPath = window.location.href
        .replace(window.location.origin, "")
        .replace("/__/inspector", "");
      setIframeUrl(cleanPath || "/");
      if (!urlInput) {
        setUrlInput(window.location.origin + cleanPath);
        currentPageUrlRef.current = window.location.origin + cleanPath;
      }
    } else {
      setIframeUrl("about:blank");
    }

    // Interval to sync iframe URL to parent input for SPA routing compatibility
    const interval = setInterval(() => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          const href = iframe.contentWindow.location.href;
          if (
            href &&
            href !== "about:blank" &&
            href !== currentPageUrlRef.current &&
            !href.includes("/__/inspector")
          ) {
            const currentOrigin = window.location.origin;
            const newUrl = new URL(href);
            const newOrigin = newUrl.origin;
            
            // Check if we've navigated to a different domain
            if (newOrigin !== currentOrigin) {
              log(`Cross-origin navigation detected: ${href}`);
              log(`Redirecting to maintain inspector access...`);
              
              // Preserve full URL and current inspector modes using refs
              const encodedUrl = encodeURIComponent(href);
              const inspectParam = isInspectModeRef.current ? '&inspect=1' : '';
              const recordParam = isRecordingRef.current ? '&record=1' : '';
              window.location.href = `${newOrigin}/__/inspector?target=${encodedUrl}${inspectParam}${recordParam}`;
              return;
            }
            
            currentPageUrlRef.current = href;
            // Only update address bar if they're not manually typing
            if (document.activeElement?.id !== "currentUrl") {
              setUrlInput(href);
            }
          }
        }
      } catch (e) {
        // Cross-origin error detected - iframe navigated to different domain
        // Try to detect the new domain from the iframe src if possible
        const iframe = iframeRef.current;
        if (iframe && iframe.src && iframe.src !== "about:blank") {
          try {
            const newUrl = new URL(iframe.src);
            const newOrigin = newUrl.origin;
            const currentOrigin = window.location.origin;
            
            if (newOrigin !== currentOrigin) {
              log(`Cross-origin navigation detected via iframe src: ${iframe.src}`);
              log(`Redirecting to maintain inspector access...`);
              
              // Preserve full URL and current inspector modes using refs
              const encodedUrl = encodeURIComponent(iframe.src);
              const inspectParam = isInspectModeRef.current ? '&inspect=1' : '';
              const recordParam = isRecordingRef.current ? '&record=1' : '';
              window.location.href = `${newOrigin}/__/inspector?target=${encodedUrl}${inspectParam}${recordParam}`;
              return;
            }
          } catch (srcError) {
            // Ignore if iframe.src is also not accessible
          }
        }
        
        // If we can't determine the new origin, just log the cross-origin error
        log("Cross-origin navigation detected, but unable to determine target domain");
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="web-inspector-container">
      <header className="header">
        <div className="header-left">
          <Bug size={24} />
          <h1>Inspector</h1>
        </div>
        <div className="header-center">
          <div className="nav-buttons">
            <button
              type="button"
              className="nav-btn"
              onClick={handleBack}
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              className="nav-btn"
              onClick={handleForward}
              title="Forward"
            >
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="nav-btn"
              onClick={handleReload}
              title="Reload"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <input
            type="url"
            id="currentUrl"
            className="url-display"
            placeholder="Enter URL to inspect..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = e.currentTarget.value;
                if (!value) return;
                handleLoadUrl(value);
              }
            }}
          />
          <button
            id="loadUrl"
            className="load-btn"
            onClick={() => {
              if (!urlInput) return;
              handleLoadUrl(urlInput);
            }}
          >
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
                    {elementInfo.tagName === "-"
                      ? "-"
                      : `<${elementInfo.tagName}>`}
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
                    {elementInfo.testId || "-"}
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
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`element-panel ${showRecordedScript ? "" : "hidden"}`}
              id="recordedScriptPanel"
            >
              <div className="panel-header">
                <h3>Recorded Script</h3>
                <button
                  className="header-copy-btn"
                  id="copyScriptBtn"
                  title="Copy Script"
                  ref={copyScriptBtnRef}
                  onClick={handleCopyScript}
                >
                  <Copy size={16} />
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
            <pre id="codeLog">{codeLog.join("\n")}</pre>
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
              <Link2Off size={64} className="empty-icon-svg" />
              <h2>No URL Loaded</h2>
              <p>
                Please enter a target URL and click 'Load' to begin inspection.
              </p>
            </div>
            {iframeUrl !== "about:blank" && (
              <iframe id="targetFrame" src={iframeUrl} ref={iframeRef}></iframe>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
