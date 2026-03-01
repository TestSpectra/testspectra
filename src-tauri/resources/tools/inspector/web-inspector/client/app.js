const currentUrl = document.getElementById("currentUrl");
const targetFrame = document.getElementById("targetFrame");
const selectorOutput = document.getElementById("selectorOutput");
const elementInfo = document.getElementById("elementInfo");
const codeLog = document.getElementById("codeLog");
const inspectMode = document.getElementById("inspectMode");
const recordMode = document.getElementById("recordMode");
const copyBtn = document.getElementById("copyBtn");
const copyScriptBtn = document.getElementById("copyScriptBtn");
const recordedCode = document.getElementById("recordedCode");
const emptyState = document.getElementById("emptyState");
const infoTag = document.getElementById("infoTag");
const infoId = document.getElementById("infoId");
const infoTestId = document.getElementById("infoTestId");
const infoClass = document.getElementById("infoClass");
const infoText = document.getElementById("infoText");
const infoType = document.getElementById("infoType");
const infoName = document.getElementById("infoName");

const recordedScriptPanel = document.getElementById("recordedScriptPanel");

let currentSelector = "";
let isInspectMode = true;
let isRecording = false;

// Initialize with query param if present
const urlParams = new URLSearchParams(window.location.search);
const initialUrl = urlParams.get("url");
if (initialUrl) {
  currentUrl.value = initialUrl;
  loadUrl(initialUrl);
}

// Toggle inspect mode
inspectMode.addEventListener("click", () => {
  isInspectMode = !isInspectMode;
  inspectMode.setAttribute("aria-checked", isInspectMode);

  // If inspect mode is on, turn off recording
  if (isInspectMode && isRecording) {
    isRecording = false;
    recordMode.setAttribute("aria-checked", false);
    recordedScriptPanel.classList.add("hidden");
  }
});

// Toggle record mode
recordMode.addEventListener("click", () => {
  isRecording = !isRecording;
  recordMode.setAttribute("aria-checked", isRecording);

  if (isRecording) {
    recordedScriptPanel.classList.remove("hidden");
  } else {
    recordedScriptPanel.classList.add("hidden");
  }

  // If recording is on, turn off inspect mode
  if (isRecording && isInspectMode) {
    isInspectMode = false;
    inspectMode.setAttribute("aria-checked", false);
  }
});

copyBtn.addEventListener("click", () => {
  if (currentSelector) {
    navigator.clipboard.writeText(currentSelector);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<span class="material-icons-outlined">check</span>';
    setTimeout(() => (copyBtn.innerHTML = originalText), 1000);
  }
});

copyScriptBtn.addEventListener("click", () => {
  if (recordedCode.textContent) {
    navigator.clipboard.writeText(recordedCode.textContent);
    const originalText = copyScriptBtn.innerHTML;
    copyScriptBtn.innerHTML =
      '<span class="material-icons-outlined">check</span>';
    setTimeout(() => (copyScriptBtn.innerHTML = originalText), 1000);
  }
});

// Sidebar resize functionality
const resizeHandle = document.querySelector(".resize-handle");
const sidebar = document.querySelector(".sidebar");
let isResizing = false;

resizeHandle.addEventListener("mousedown", (e) => {
  isResizing = true;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
});

document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;

  const newWidth = e.clientX;
  if (newWidth >= 250 && newWidth <= 600) {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${newWidth}px`
    );
  }
});

document.addEventListener("mouseup", () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }
});

function loadUrl(url) {
  if (!url.startsWith("http")) {
    url = "https://" + url;
  }
  emptyState.classList.add("hidden");
  targetFrame.classList.add("loaded");
  targetFrame.src = `/proxy?url=${encodeURIComponent(url)}`;
  currentUrl.value = url;
  log(`Loading: ${url}`);
}

targetFrame.onload = () => {
  log("Target loaded. Injecting inspector script...");
  injectInspectorScript();
  updateCurrentUrl();
  startUrlMonitoring();
};

// Monitor iframe URL changes for SPA navigation
let lastIframeUrl = "";
function startUrlMonitoring() {
  setInterval(() => {
    try {
      const iframeDoc =
        targetFrame.contentDocument || targetFrame.contentWindow.document;
      const iframeUrl = iframeDoc.location.href;

      if (iframeUrl !== lastIframeUrl && !iframeUrl.includes("about:blank")) {
        lastIframeUrl = iframeUrl;
        updateCurrentUrl();
      }
    } catch (e) {
      // Cross-origin access error - ignore
    }
  }, 500);
}

function updateCurrentUrl() {
  try {
    const iframeDoc =
      targetFrame.contentDocument || targetFrame.contentWindow.document;

    // Get the actual location from the iframe
    const iframePath = iframeDoc.location.pathname;
    const iframeSearch = iframeDoc.location.search;
    const iframeHash = iframeDoc.location.hash;

    // Get the base target URL from the initial load
    const urlParams = new URLSearchParams(window.location.search);
    const targetBaseUrl = urlParams.get("url");

    if (targetBaseUrl) {
      // Construct the full URL with the actual domain and current path
      let fullUrl = targetBaseUrl;

      // Only append path if it's not the proxy path and not just '/'
      if (iframePath && iframePath !== "/" && !iframePath.includes("/proxy")) {
        fullUrl += iframePath;
      }
      if (iframeSearch && !iframeSearch.includes("url=")) {
        fullUrl += iframeSearch;
      }
      if (iframeHash) {
        fullUrl += iframeHash;
      }

      currentUrl.value = fullUrl;
    }
  } catch (e) {
    // Cross-origin access error - keep current value
  }
}

function injectInspectorScript() {
  try {
    const doc = targetFrame.contentDocument;
    const win = targetFrame.contentWindow;

    if (!doc) {
      log(
        "Error: Cannot access iframe content. Ensure --disable-web-security is active."
      );
      return;
    }

    // Inject Styles for highlighting
    const style = doc.createElement("style");
    style.textContent = `
            .wdio-inspector-hover {
                outline: 2px solid #3b82f6 !important;
                cursor: crosshair !important;
                background-color: rgba(59, 130, 246, 0.1) !important;
            }
        `;
    doc.head.appendChild(style);

    // Event Listeners
    doc.body.addEventListener("mouseover", (e) => {
      if (!isInspectMode) return;
      e.stopPropagation();

      const prev = doc.querySelectorAll(".wdio-inspector-hover");
      prev.forEach((el) => el.classList.remove("wdio-inspector-hover"));

      e.target.classList.add("wdio-inspector-hover");

      const info = {
        tagName: e.target.tagName.toLowerCase(),
        id: e.target.id,
        testId: e.target.getAttribute("data-test-id"),
        className: e.target.className,
        text: e.target.innerText?.substring(0, 100) || "",
        type: e.target.type || "",
        name: e.target.name || "",
      };
      updateInfo(info);
    });

    doc.body.addEventListener("mouseout", (e) => {
      if (!isInspectMode) return;
      e.target.classList.remove("wdio-inspector-hover");
    });

    doc.body.addEventListener("click", (e) => {
      // Handle link navigation for both Inspect and Record modes (and normal browsing)
      const link = e.target.closest("a");
      if (link && link.href) {
        // Prevent default navigation which would go to localhost
        e.preventDefault();
        e.stopPropagation();

        if (isInspectMode) {
          const selector = generateSelector(link);
          currentSelector = selector;
          selectorOutput.textContent = `$('${selector}')`;
          log(`Selected: ${selector}`);
          link.classList.remove("wdio-inspector-hover");
          return;
        }

        if (isRecording) {
          const selector = generateSelector(link);
          addToRecordedScript(`await $('${selector}').click();`);
        }

        // Navigate via proxy
        const href = link.getAttribute("href");
        if (href) {
          // Construct absolute URL based on the current proxied URL
          const currentProxiedUrl = new URL(currentUrl.value);
          const targetUrl = new URL(href, currentProxiedUrl.href).href;
          loadUrl(targetUrl);
        }
        return;
      }

      if (!isInspectMode && !isRecording) return;

      if (isRecording) {
        const selector = generateSelector(e.target);
        addToRecordedScript(`await $('${selector}').click();`);
        return; // Allow default action for non-links
      }

      if (isInspectMode) {
        e.preventDefault();
        e.stopPropagation();

        const selector = generateSelector(e.target);
        currentSelector = selector;
        selectorOutput.textContent = `$('${selector}')`;
        log(`Selected: ${selector}`);

        e.target.classList.remove("wdio-inspector-hover");
      }
    });

    doc.body.addEventListener("change", (e) => {
      if (!isRecording) return;
      const selector = generateSelector(e.target);
      // Escape single quotes in value
      const value = e.target.value.replace(/'/g, "\\'");
      addToRecordedScript(`await $('${selector}').setValue('${value}');`);
    });

    log("Inspector script injected successfully.");
  } catch (e) {
    log(`Injection Failed: ${e.message}`);
    log("Make sure Chrome was launched with --disable-web-security");
  }
}

function generateSelector(el) {
  // 1. Try data-test-id first (highest priority)
  const testId = el.getAttribute("data-test-id");
  if (testId) return `~${testId}`;

  // 2. Try id
  if (el.id) return `#${el.id}`;

  // 3. Try class
  if (el.className && typeof el.className === "string") {
    const classes = el.className
      .split(" ")
      .filter((c) => c !== "wdio-inspector-hover" && c.trim() !== "");
    if (classes.length > 0) {
      // Escape special characters in class name for CSS selector
      const escapedClass = CSS.escape(classes[0]);
      return `.${escapedClass}`;
    }
  }

  // 4. Fallback to tag + text for buttons/links
  if (el.tagName === "BUTTON" || el.tagName === "A") {
    const text = el.innerText?.trim();
    if (text) return `${el.tagName.toLowerCase()}=${text}`;
  }

  // 5. Last resort: just the tag name
  return el.tagName.toLowerCase();
}

function updateInfo(info) {
  infoTag.textContent = `<${info.tagName}>`;
  infoId.textContent = info.id || "-";
  infoTestId.textContent = info.testId || "-";

  // Handle className which might be an object or string
  const classText =
    typeof info.className === "string"
      ? info.className.replace("wdio-inspector-hover", "").trim() || "-"
      : "-";
  document.getElementById("infoClass").textContent = classText;

  document.getElementById("infoText").textContent = info.text || "-";
  document.getElementById("infoType").textContent = info.type || "-";
  document.getElementById("infoName").textContent = info.name || "-";
}

function log(msg) {
  const div = document.createElement("div");
  div.textContent = `> ${msg}`;
  codeLog.appendChild(div);
  codeLog.scrollTop = codeLog.scrollHeight;
}

function addToRecordedScript(line) {
  recordedCode.textContent += line + "\n";
  recordedCode.scrollTop = recordedCode.scrollHeight;
}
