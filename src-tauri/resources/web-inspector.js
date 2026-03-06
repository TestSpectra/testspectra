#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// bin/proxy-server.ts
var proxy_server_exports = {};
__export(proxy_server_exports, {
  PORT: () => PORT,
  server: () => server
});
import * as http from "http";
import * as https from "https";
import * as tls from "tls";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
function generateCert() {
  console.log("\u{1F510} Generating self-signed certificate...");
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wdio-inspector-"));
  const keyFile = path.join(tmpDir, "key.pem");
  const certFile = path.join(tmpDir, "cert.pem");
  fs.writeFileSync(keyFile, privateKey);
  execSync(
    `openssl req -new -x509 -key "${keyFile}" -out "${certFile}" -days 365 -subj "/CN=WDIO Inspector Proxy" -addext "subjectAltName=DNS:*,DNS:localhost,IP:127.0.0.1"`,
    { stdio: "pipe" }
  );
  const cert2 = fs.readFileSync(certFile, "utf8");
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("\u2705 Certificate generated");
  return { key: privateKey, cert: cert2 };
}
function getCachedCert() {
  if (fs.existsSync(CERT_CACHE_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CERT_CACHE_PATH, "utf8"));
      console.log("\u2705 Using cached certificate");
      return cached;
    } catch (err) {
      console.log("\u26A0\uFE0F  Cache corrupted, regenerating...");
    }
  }
  const cert2 = generateCert();
  fs.writeFileSync(CERT_CACHE_PATH, JSON.stringify(cert2));
  return cert2;
}
function serveStaticFile(filePath, res) {
  if (!fs.existsSync(filePath)) return false;
  const extname2 = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname2] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "Content-Type": contentType });
  res.end(content);
  return true;
}
function serveInspectorHtml(host, protocol, res) {
  console.log(`[INSPECTOR] Serving inspector UI for ${protocol}://${host}`);
  const htmlPath = path.join(CLIENT_DIR, "index.html");
  let html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, "utf8") : "<h1>Inspector UI not found</h1>";
  const injection = `<script>
    window.__INSPECTOR_HOST__ = "${host}";
    window.__INSPECTOR_PROTOCOL__ = "${protocol}";
    window.__INSPECTOR_TARGET__ = "${protocol}://${host}";
  </script>`;
  html = html.replace("</head>", `${injection}
</head>`);
  res.writeHead(200, {
    "Content-Type": "text/html",
    "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  });
  res.end(html);
}
function proxyToTarget(req, res, host, protocol, cleanUrl) {
  const targetUrl = `${protocol}://${host}${cleanUrl}`;
  console.log(`[PROXY] ${req.method} ${targetUrl}`);
  const requestOptions = {
    method: req.method,
    headers: {
      ...req.headers,
      host
    },
    agent: protocol === "https" ? httpsAgent : httpAgent,
    rejectUnauthorized: false
  };
  const onResponse = (proxyRes) => {
    const headers = { ...proxyRes.headers };
    delete headers["x-frame-options"];
    delete headers["content-security-policy"];
    delete headers["content-security-policy-report-only"];
    delete headers["frame-options"];
    delete headers["content-length"];
    res.writeHead(proxyRes.statusCode || 200, headers);
    proxyRes.pipe(res);
  };
  const onError = (err) => {
    console.error(`[PROXY ERROR] ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end(`Proxy Error: ${err.message}`);
    }
  };
  let proxyReq;
  if (protocol === "https") {
    proxyReq = https.request(targetUrl, requestOptions, onResponse);
  } else {
    proxyReq = http.request(targetUrl, requestOptions, onResponse);
  }
  proxyReq.on("error", onError);
  req.pipe(proxyReq);
}
function handleRequest(req, res, host, protocol) {
  let cleanUrl = req.url || "/";
  if (cleanUrl.startsWith("http")) {
    const urlObj = new URL(cleanUrl);
    cleanUrl = urlObj.pathname + urlObj.search;
  }
  if (cleanUrl.includes("/__/inspector")) {
    serveInspectorHtml(host, protocol, res);
    return;
  }
  const INSPECTOR_PREFIX = "/__/";
  const assetName = cleanUrl.startsWith(INSPECTOR_PREFIX) ? cleanUrl.slice(INSPECTOR_PREFIX.length) : cleanUrl.replace(/^\//, "");
  const staticPath = path.join(CLIENT_DIR, assetName);
  if (!assetName.includes("..") && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    console.log(`[STATIC] Serving ${assetName}`);
    serveStaticFile(staticPath, res);
    return;
  }
  proxyToTarget(req, res, host, protocol, cleanUrl);
}
var PORT, __filename, __dirname, CLIENT_DIR, CERT_CACHE_PATH, mimeTypes, key, cert, httpAgent, httpsAgent, server;
var init_proxy_server = __esm({
  "bin/proxy-server.ts"() {
    "use strict";
    PORT = 8888;
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    CLIENT_DIR = path.join(__dirname, "../client");
    CERT_CACHE_PATH = path.join(os.tmpdir(), "wdio-inspector-cert.json");
    mimeTypes = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ico": "image/x-icon"
    };
    ({ key, cert } = getCachedCert());
    httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
    httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 50,
      rejectUnauthorized: false
    });
    server = http.createServer(
      (req, res) => {
        const host = req.headers.host || "localhost";
        handleRequest(req, res, host, "http");
      }
    );
    server.on(
      "connect",
      (req, clientSocket, head) => {
        const [hostname, port] = (req.url || "").split(":");
        console.log(`[CONNECT] ${hostname}:${port} - Creating MITM TLS connection`);
        clientSocket.write(
          "HTTP/1.1 200 Connection Established\r\nProxy-Agent: WDIO-Inspector-Proxy\r\n\r\n"
        );
        const tlsSocket = new tls.TLSSocket(clientSocket, {
          isServer: true,
          key,
          cert
        });
        tlsSocket.on("error", (err) => {
          if (!err.message.includes("Parse Error")) {
            console.error(`[TLS ERROR] ${hostname}: ${err.message}`);
          }
        });
        const internalServer = http.createServer(
          (req2, res) => {
            handleRequest(req2, res, hostname, "https");
          }
        );
        internalServer.emit("connection", tlsSocket);
        if (head && head.length > 0) {
          tlsSocket.unshift(head);
        }
      }
    );
    server.on("error", (err) => {
      console.error(`[SERVER ERROR] ${err.message}`);
    });
    server.listen(PORT, () => {
      console.log(`\u{1F680} Inspector Proxy running on http://127.0.0.1:${PORT}`);
      console.log(`   Supports: HTTP & HTTPS (MITM)`);
      console.log(`   Inspector path: /__/inspector`);
    });
  }
});

// ../../../node_modules/.pnpm/cac@7.0.0/node_modules/cac/dist/index.js
function toArr(any) {
  return any == null ? [] : Array.isArray(any) ? any : [any];
}
function toVal(out, key2, val, opts) {
  var x, old = out[key2], nxt = !!~opts.string.indexOf(key2) ? val == null || val === true ? "" : String(val) : typeof val === "boolean" ? val : !!~opts.boolean.indexOf(key2) ? val === "false" ? false : val === "true" || (out._.push((x = +val, x * 0 === 0) ? x : val), !!val) : (x = +val, x * 0 === 0) ? x : val;
  out[key2] = old == null ? nxt : Array.isArray(old) ? old.concat(nxt) : [old, nxt];
}
function lib_default(args, opts) {
  args = args || [];
  opts = opts || {};
  var k, arr, arg, name, val, out = { _: [] };
  var i = 0, j = 0, idx = 0, len = args.length;
  const alibi = opts.alias !== void 0;
  const strict = opts.unknown !== void 0;
  const defaults = opts.default !== void 0;
  opts.alias = opts.alias || {};
  opts.string = toArr(opts.string);
  opts.boolean = toArr(opts.boolean);
  if (alibi) for (k in opts.alias) {
    arr = opts.alias[k] = toArr(opts.alias[k]);
    for (i = 0; i < arr.length; i++) (opts.alias[arr[i]] = arr.concat(k)).splice(i, 1);
  }
  for (i = opts.boolean.length; i-- > 0; ) {
    arr = opts.alias[opts.boolean[i]] || [];
    for (j = arr.length; j-- > 0; ) opts.boolean.push(arr[j]);
  }
  for (i = opts.string.length; i-- > 0; ) {
    arr = opts.alias[opts.string[i]] || [];
    for (j = arr.length; j-- > 0; ) opts.string.push(arr[j]);
  }
  if (defaults) for (k in opts.default) {
    name = typeof opts.default[k];
    arr = opts.alias[k] = opts.alias[k] || [];
    if (opts[name] !== void 0) {
      opts[name].push(k);
      for (i = 0; i < arr.length; i++) opts[name].push(arr[i]);
    }
  }
  const keys = strict ? Object.keys(opts.alias) : [];
  for (i = 0; i < len; i++) {
    arg = args[i];
    if (arg === "--") {
      out._ = out._.concat(args.slice(++i));
      break;
    }
    for (j = 0; j < arg.length; j++) if (arg.charCodeAt(j) !== 45) break;
    if (j === 0) out._.push(arg);
    else if (arg.substring(j, j + 3) === "no-") {
      name = arg.substring(j + 3);
      if (strict && !~keys.indexOf(name)) return opts.unknown(arg);
      out[name] = false;
    } else {
      for (idx = j + 1; idx < arg.length; idx++) if (arg.charCodeAt(idx) === 61) break;
      name = arg.substring(j, idx);
      val = arg.substring(++idx) || i + 1 === len || ("" + args[i + 1]).charCodeAt(0) === 45 || args[++i];
      arr = j === 2 ? [name] : name;
      for (idx = 0; idx < arr.length; idx++) {
        name = arr[idx];
        if (strict && !~keys.indexOf(name)) return opts.unknown("-".repeat(j) + name);
        toVal(out, name, idx + 1 < arr.length || val, opts);
      }
    }
  }
  if (defaults) {
    for (k in opts.default) if (out[k] === void 0) out[k] = opts.default[k];
  }
  if (alibi) for (k in out) {
    arr = opts.alias[k] || [];
    while (arr.length > 0) out[arr.shift()] = out[k];
  }
  return out;
}
function removeBrackets(v) {
  return v.replace(/[<[].+/, "").trim();
}
function findAllBrackets(v) {
  const ANGLED_BRACKET_RE_GLOBAL = /<([^>]+)>/g;
  const SQUARE_BRACKET_RE_GLOBAL = /\[([^\]]+)\]/g;
  const res = [];
  const parse = (match) => {
    let variadic = false;
    let value = match[1];
    if (value.startsWith("...")) {
      value = value.slice(3);
      variadic = true;
    }
    return {
      required: match[0].startsWith("<"),
      value,
      variadic
    };
  };
  let angledMatch;
  while (angledMatch = ANGLED_BRACKET_RE_GLOBAL.exec(v)) res.push(parse(angledMatch));
  let squareMatch;
  while (squareMatch = SQUARE_BRACKET_RE_GLOBAL.exec(v)) res.push(parse(squareMatch));
  return res;
}
function getMriOptions(options) {
  const result = {
    alias: {},
    boolean: []
  };
  for (const [index, option] of options.entries()) {
    if (option.names.length > 1) result.alias[option.names[0]] = option.names.slice(1);
    if (option.isBoolean) if (option.negated) {
      if (!options.some((o, i) => {
        return i !== index && o.names.some((name) => option.names.includes(name)) && typeof o.required === "boolean";
      })) result.boolean.push(option.names[0]);
    } else result.boolean.push(option.names[0]);
  }
  return result;
}
function findLongest(arr) {
  return arr.sort((a, b) => {
    return a.length > b.length ? -1 : 1;
  })[0];
}
function padRight(str, length) {
  return str.length >= length ? str : `${str}${" ".repeat(length - str.length)}`;
}
function camelcase(input) {
  return input.replaceAll(/([a-z])-([a-z])/g, (_, p1, p2) => {
    return p1 + p2.toUpperCase();
  });
}
function setDotProp(obj, keys, val) {
  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    const key2 = keys[i];
    if (i === keys.length - 1) {
      current[key2] = val;
      return;
    }
    if (current[key2] == null) {
      const nextKeyIsArrayIndex = +keys[i + 1] > -1;
      current[key2] = nextKeyIsArrayIndex ? [] : {};
    }
    current = current[key2];
  }
}
function setByType(obj, transforms) {
  for (const key2 of Object.keys(transforms)) {
    const transform = transforms[key2];
    if (transform.shouldTransform) {
      obj[key2] = [obj[key2]].flat();
      if (typeof transform.transformFunction === "function") obj[key2] = obj[key2].map(transform.transformFunction);
    }
  }
}
function getFileName(input) {
  const m = /([^\\/]+)$/.exec(input);
  return m ? m[1] : "";
}
function camelcaseOptionName(name) {
  return name.split(".").map((v, i) => {
    return i === 0 ? camelcase(v) : v;
  }).join(".");
}
var CACError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "CACError";
    if (typeof Error.captureStackTrace !== "function") this.stack = new Error(message).stack;
  }
};
var Option = class {
  rawName;
  description;
  /** Option name */
  name;
  /** Option name and aliases */
  names;
  isBoolean;
  required;
  config;
  negated;
  constructor(rawName, description, config) {
    this.rawName = rawName;
    this.description = description;
    this.config = Object.assign({}, config);
    rawName = rawName.replaceAll(".*", "");
    this.negated = false;
    this.names = removeBrackets(rawName).split(",").map((v) => {
      let name = v.trim().replace(/^-{1,2}/, "");
      if (name.startsWith("no-")) {
        this.negated = true;
        name = name.replace(/^no-/, "");
      }
      return camelcaseOptionName(name);
    }).sort((a, b) => a.length > b.length ? 1 : -1);
    this.name = this.names.at(-1);
    if (this.negated && this.config.default == null) this.config.default = true;
    if (rawName.includes("<")) this.required = true;
    else if (rawName.includes("[")) this.required = false;
    else this.isBoolean = true;
  }
};
var runtimeProcessArgs;
var runtimeInfo;
if (typeof process !== "undefined") {
  let runtimeName;
  if (typeof Deno !== "undefined" && typeof Deno.version?.deno === "string") runtimeName = "deno";
  else if (typeof Bun !== "undefined" && typeof Bun.version === "string") runtimeName = "bun";
  else runtimeName = "node";
  runtimeInfo = `${process.platform}-${process.arch} ${runtimeName}-${process.version}`;
  runtimeProcessArgs = process.argv;
} else if (typeof navigator === "undefined") runtimeInfo = `unknown`;
else runtimeInfo = `${navigator.platform} ${navigator.userAgent}`;
var Command = class {
  rawName;
  description;
  config;
  cli;
  options;
  aliasNames;
  name;
  args;
  commandAction;
  usageText;
  versionNumber;
  examples;
  helpCallback;
  globalCommand;
  constructor(rawName, description, config = {}, cli) {
    this.rawName = rawName;
    this.description = description;
    this.config = config;
    this.cli = cli;
    this.options = [];
    this.aliasNames = [];
    this.name = removeBrackets(rawName);
    this.args = findAllBrackets(rawName);
    this.examples = [];
  }
  usage(text) {
    this.usageText = text;
    return this;
  }
  allowUnknownOptions() {
    this.config.allowUnknownOptions = true;
    return this;
  }
  ignoreOptionDefaultValue() {
    this.config.ignoreOptionDefaultValue = true;
    return this;
  }
  version(version, customFlags = "-v, --version") {
    this.versionNumber = version;
    this.option(customFlags, "Display version number");
    return this;
  }
  example(example) {
    this.examples.push(example);
    return this;
  }
  /**
  * Add a option for this command
  * @param rawName Raw option name(s)
  * @param description Option description
  * @param config Option config
  */
  option(rawName, description, config) {
    const option = new Option(rawName, description, config);
    this.options.push(option);
    return this;
  }
  alias(name) {
    this.aliasNames.push(name);
    return this;
  }
  action(callback) {
    this.commandAction = callback;
    return this;
  }
  /**
  * Check if a command name is matched by this command
  * @param name Command name
  */
  isMatched(name) {
    return this.name === name || this.aliasNames.includes(name);
  }
  get isDefaultCommand() {
    return this.name === "" || this.aliasNames.includes("!");
  }
  get isGlobalCommand() {
    return this instanceof GlobalCommand;
  }
  /**
  * Check if an option is registered in this command
  * @param name Option name
  */
  hasOption(name) {
    name = name.split(".")[0];
    return this.options.find((option) => {
      return option.names.includes(name);
    });
  }
  outputHelp() {
    const { name, commands } = this.cli;
    const { versionNumber, options: globalOptions, helpCallback } = this.cli.globalCommand;
    let sections = [{ body: `${name}${versionNumber ? `/${versionNumber}` : ""}` }];
    sections.push({
      title: "Usage",
      body: `  $ ${name} ${this.usageText || this.rawName}`
    });
    if ((this.isGlobalCommand || this.isDefaultCommand) && commands.length > 0) {
      const longestCommandName = findLongest(commands.map((command) => command.rawName));
      sections.push({
        title: "Commands",
        body: commands.map((command) => {
          return `  ${padRight(command.rawName, longestCommandName.length)}  ${command.description}`;
        }).join("\n")
      }, {
        title: `For more info, run any command with the \`--help\` flag`,
        body: commands.map((command) => `  $ ${name}${command.name === "" ? "" : ` ${command.name}`} --help`).join("\n")
      });
    }
    let options = this.isGlobalCommand ? globalOptions : [...this.options, ...globalOptions || []];
    if (!this.isGlobalCommand && !this.isDefaultCommand) options = options.filter((option) => option.name !== "version");
    if (options.length > 0) {
      const longestOptionName = findLongest(options.map((option) => option.rawName));
      sections.push({
        title: "Options",
        body: options.map((option) => {
          return `  ${padRight(option.rawName, longestOptionName.length)}  ${option.description} ${option.config.default === void 0 ? "" : `(default: ${option.config.default})`}`;
        }).join("\n")
      });
    }
    if (this.examples.length > 0) sections.push({
      title: "Examples",
      body: this.examples.map((example) => {
        if (typeof example === "function") return example(name);
        return example;
      }).join("\n")
    });
    if (helpCallback) sections = helpCallback(sections) || sections;
    console.info(sections.map((section) => {
      return section.title ? `${section.title}:
${section.body}` : section.body;
    }).join("\n\n"));
  }
  outputVersion() {
    const { name } = this.cli;
    const { versionNumber } = this.cli.globalCommand;
    if (versionNumber) console.info(`${name}/${versionNumber} ${runtimeInfo}`);
  }
  checkRequiredArgs() {
    const minimalArgsCount = this.args.filter((arg) => arg.required).length;
    if (this.cli.args.length < minimalArgsCount) throw new CACError(`missing required args for command \`${this.rawName}\``);
  }
  /**
  * Check if the parsed options contain any unknown options
  *
  * Exit and output error when true
  */
  checkUnknownOptions() {
    const { options, globalCommand } = this.cli;
    if (!this.config.allowUnknownOptions) {
      for (const name of Object.keys(options)) if (name !== "--" && !this.hasOption(name) && !globalCommand.hasOption(name)) throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
    }
  }
  /**
  * Check if the required string-type options exist
  */
  checkOptionValue() {
    const { options: parsedOptions, globalCommand } = this.cli;
    const options = [...globalCommand.options, ...this.options];
    for (const option of options) {
      const value = parsedOptions[option.name.split(".")[0]];
      if (option.required) {
        const hasNegated = options.some((o) => o.negated && o.names.includes(option.name));
        if (value === true || value === false && !hasNegated) throw new CACError(`option \`${option.rawName}\` value is missing`);
      }
    }
  }
  /**
  * Check if the number of args is more than expected
  */
  checkUnusedArgs() {
    const maximumArgsCount = this.args.some((arg) => arg.variadic) ? Infinity : this.args.length;
    if (maximumArgsCount < this.cli.args.length) throw new CACError(`Unused args: ${this.cli.args.slice(maximumArgsCount).map((arg) => `\`${arg}\``).join(", ")}`);
  }
};
var GlobalCommand = class extends Command {
  constructor(cli) {
    super("@@global@@", "", {}, cli);
  }
};
var CAC = class extends EventTarget {
  /** The program name to display in help and version message */
  name;
  commands;
  globalCommand;
  matchedCommand;
  matchedCommandName;
  /**
  * Raw CLI arguments
  */
  rawArgs;
  /**
  * Parsed CLI arguments
  */
  args;
  /**
  * Parsed CLI options, camelCased
  */
  options;
  showHelpOnExit;
  showVersionOnExit;
  /**
  * @param name The program name to display in help and version message
  */
  constructor(name = "") {
    super();
    this.name = name;
    this.commands = [];
    this.rawArgs = [];
    this.args = [];
    this.options = {};
    this.globalCommand = new GlobalCommand(this);
    this.globalCommand.usage("<command> [options]");
  }
  /**
  * Add a global usage text.
  *
  * This is not used by sub-commands.
  */
  usage(text) {
    this.globalCommand.usage(text);
    return this;
  }
  /**
  * Add a sub-command
  */
  command(rawName, description, config) {
    const command = new Command(rawName, description || "", config, this);
    command.globalCommand = this.globalCommand;
    this.commands.push(command);
    return command;
  }
  /**
  * Add a global CLI option.
  *
  * Which is also applied to sub-commands.
  */
  option(rawName, description, config) {
    this.globalCommand.option(rawName, description, config);
    return this;
  }
  /**
  * Show help message when `-h, --help` flags appear.
  *
  */
  help(callback) {
    this.globalCommand.option("-h, --help", "Display this message");
    this.globalCommand.helpCallback = callback;
    this.showHelpOnExit = true;
    return this;
  }
  /**
  * Show version number when `-v, --version` flags appear.
  *
  */
  version(version, customFlags = "-v, --version") {
    this.globalCommand.version(version, customFlags);
    this.showVersionOnExit = true;
    return this;
  }
  /**
  * Add a global example.
  *
  * This example added here will not be used by sub-commands.
  */
  example(example) {
    this.globalCommand.example(example);
    return this;
  }
  /**
  * Output the corresponding help message
  * When a sub-command is matched, output the help message for the command
  * Otherwise output the global one.
  *
  */
  outputHelp() {
    if (this.matchedCommand) this.matchedCommand.outputHelp();
    else this.globalCommand.outputHelp();
  }
  /**
  * Output the version number.
  *
  */
  outputVersion() {
    this.globalCommand.outputVersion();
  }
  setParsedInfo({ args, options }, matchedCommand, matchedCommandName) {
    this.args = args;
    this.options = options;
    if (matchedCommand) this.matchedCommand = matchedCommand;
    if (matchedCommandName) this.matchedCommandName = matchedCommandName;
    return this;
  }
  unsetMatchedCommand() {
    this.matchedCommand = void 0;
    this.matchedCommandName = void 0;
  }
  /**
  * Parse argv
  */
  parse(argv, { run = true } = {}) {
    if (!argv) {
      if (!runtimeProcessArgs) throw new Error("No argv provided and runtime process argv is not available.");
      argv = runtimeProcessArgs;
    }
    this.rawArgs = argv;
    if (!this.name) this.name = argv[1] ? getFileName(argv[1]) : "cli";
    let shouldParse = true;
    for (const command of this.commands) {
      const parsed = this.mri(argv.slice(2), command);
      const commandName = parsed.args[0];
      if (command.isMatched(commandName)) {
        shouldParse = false;
        const parsedInfo = {
          ...parsed,
          args: parsed.args.slice(1)
        };
        this.setParsedInfo(parsedInfo, command, commandName);
        this.dispatchEvent(new CustomEvent(`command:${commandName}`, { detail: command }));
      }
    }
    if (shouldParse) {
      for (const command of this.commands) if (command.isDefaultCommand) {
        shouldParse = false;
        const parsed = this.mri(argv.slice(2), command);
        this.setParsedInfo(parsed, command);
        this.dispatchEvent(new CustomEvent("command:!", { detail: command }));
      }
    }
    if (shouldParse) {
      const parsed = this.mri(argv.slice(2));
      this.setParsedInfo(parsed);
    }
    if (this.options.help && this.showHelpOnExit) {
      this.outputHelp();
      run = false;
      this.unsetMatchedCommand();
    }
    if (this.options.version && this.showVersionOnExit && this.matchedCommandName == null) {
      this.outputVersion();
      run = false;
      this.unsetMatchedCommand();
    }
    const parsedArgv = {
      args: this.args,
      options: this.options
    };
    if (run) this.runMatchedCommand();
    if (!this.matchedCommand && this.args[0]) this.dispatchEvent(new CustomEvent("command:*", { detail: this.args[0] }));
    return parsedArgv;
  }
  mri(argv, command) {
    const cliOptions = [...this.globalCommand.options, ...command ? command.options : []];
    const mriOptions = getMriOptions(cliOptions);
    let argsAfterDoubleDashes = [];
    const doubleDashesIndex = argv.indexOf("--");
    if (doubleDashesIndex !== -1) {
      argsAfterDoubleDashes = argv.slice(doubleDashesIndex + 1);
      argv = argv.slice(0, doubleDashesIndex);
    }
    let parsed = lib_default(argv, mriOptions);
    parsed = Object.keys(parsed).reduce((res, name) => {
      return {
        ...res,
        [camelcaseOptionName(name)]: parsed[name]
      };
    }, { _: [] });
    const args = parsed._;
    const options = { "--": argsAfterDoubleDashes };
    const ignoreDefault = command && command.config.ignoreOptionDefaultValue ? command.config.ignoreOptionDefaultValue : this.globalCommand.config.ignoreOptionDefaultValue;
    const transforms = /* @__PURE__ */ Object.create(null);
    for (const cliOption of cliOptions) {
      if (!ignoreDefault && cliOption.config.default !== void 0) for (const name of cliOption.names) options[name] = cliOption.config.default;
      if (Array.isArray(cliOption.config.type) && transforms[cliOption.name] === void 0) {
        transforms[cliOption.name] = /* @__PURE__ */ Object.create(null);
        transforms[cliOption.name].shouldTransform = true;
        transforms[cliOption.name].transformFunction = cliOption.config.type[0];
      }
    }
    for (const key2 of Object.keys(parsed)) if (key2 !== "_") {
      setDotProp(options, key2.split("."), parsed[key2]);
      setByType(options, transforms);
    }
    return {
      args,
      options
    };
  }
  runMatchedCommand() {
    const { args, options, matchedCommand: command } = this;
    if (!command || !command.commandAction) return;
    command.checkUnknownOptions();
    command.checkOptionValue();
    command.checkRequiredArgs();
    command.checkUnusedArgs();
    const actionArgs = [];
    command.args.forEach((arg, index) => {
      if (arg.variadic) actionArgs.push(args.slice(index));
      else actionArgs.push(args[index]);
    });
    actionArgs.push(options);
    return command.commandAction.apply(this, actionArgs);
  }
};
var cac = (name = "") => new CAC(name);

// bin/web-inspector.ts
import { spawn } from "child_process";
import * as path2 from "path";
import * as net from "net";
import * as fs2 from "fs";
import * as os2 from "os";
if (process.argv[2] === "__internal-server") {
  Promise.resolve().then(() => init_proxy_server());
} else {
  const cli = cac("web-inspector");
  const PROXY_PORT = 8888;
  const PID_FILE = path2.join(os2.tmpdir(), "web-inspector-proxy.pid");
  const isPortInUse = (port) => {
    return new Promise((resolve) => {
      const server2 = net.createServer();
      server2.once("error", (err) => {
        resolve(err.code === "EADDRINUSE");
      });
      server2.once("listening", () => {
        server2.close();
        resolve(false);
      });
      server2.listen(port);
    });
  };
  cli.command("start", "Start proxy server").action(async () => {
    if (await isPortInUse(PROXY_PORT)) {
      console.log(`\u2139\uFE0F  Inspector proxy already running on port ${PROXY_PORT}`);
      const stopCommand = cli.commands.find((c) => c.name === "stop");
      stopCommand?.commandAction?.();
    }
    console.log("\u{1F680} Starting Web Inspector Proxy Server...");
    const serverProcess = spawn(
      process.execPath,
      [process.argv[1], "__internal-server"],
      {
        detached: true,
        stdio: "ignore"
      }
    );
    if (serverProcess.pid) {
      fs2.writeFileSync(PID_FILE, serverProcess.pid.toString());
      serverProcess.unref();
      console.log(
        `\u2705 Inspector proxy started in background (PID: ${serverProcess.pid})`
      );
    } else {
      console.error("\u274C Failed to start proxy server process");
    }
  });
  cli.command("stop", "Stop proxy server").action(async () => {
    if (fs2.existsSync(PID_FILE)) {
      const pid = parseInt(fs2.readFileSync(PID_FILE, "utf-8"), 10);
      try {
        process.kill(pid);
        console.log(`\u2705 Proxy server (PID: ${pid}) stopped.`);
      } catch (e) {
        console.error(
          `\u274C Failed to stop server. It might not be running: ${e.message}`
        );
      }
      fs2.unlinkSync(PID_FILE);
    } else {
      if (await isPortInUse(PROXY_PORT)) {
        console.log(
          `\u2139\uFE0F  No PID file found, but port ${PROXY_PORT} is in use. Please kill the process manually.`
        );
      } else {
        console.log("\u2139\uFE0F  Proxy server is not running.");
      }
    }
  });
  cli.command("open [url]", "Open inspector with wdio").action(async (url) => {
    let remote;
    try {
      const wdio = await import("webdriverio");
      remote = wdio.remote;
    } catch (e) {
      try {
        const { createRequire } = await import("module");
        const require2 = createRequire(import.meta.url);
        const wdio = require2("webdriverio");
        remote = wdio.remote;
      } catch (e2) {
        console.error(
          "\u274C webdriverio is not installed. Please install it using 'npm install webdriverio' to use the 'open' command."
        );
        process.exit(1);
      }
    }
    if (!await isPortInUse(PROXY_PORT)) {
      console.warn(
        `\u26A0\uFE0F  Proxy server does not seem to be running on port ${PROXY_PORT}.`
      );
      console.warn(
        `\u26A0\uFE0F  Run 'web-inspector start' first, or the browser won't load the inspector UI!`
      );
    }
    const capabilities = {
      browserName: "chrome",
      "goog:chromeOptions": {
        excludeSwitches: ["enable-automation"],
        args: [
          `--proxy-server=http://127.0.0.1:${PROXY_PORT}`,
          "--ignore-certificate-errors",
          "--disable-web-security",
          "--allow-running-insecure-content",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-site-isolation-trials",
          "--test-type",
          "--window-size=1200,800"
        ]
      }
    };
    console.log("\u{1F310} Opening Browser...");
    const browser = await remote({
      capabilities,
      logLevel: "error"
    });
    try {
      const screen = await browser.execute(() => {
        return {
          width: window.screen.availWidth,
          height: window.screen.availHeight
        };
      });
      const x = Math.max(0, Math.floor((screen.width - 1200) / 2));
      const y = Math.max(0, Math.floor((screen.height - 800) / 2));
      await browser.setWindowRect(x, y, 1200, 800);
    } catch (err) {
    }
    let targetOrigin;
    try {
      if (url) {
        targetOrigin = new URL(url).origin;
      } else {
        targetOrigin = `http://127.0.0.1:${PROXY_PORT}`;
      }
    } catch (e) {
      console.error(`\u274C Invalid URL provided: ${url}`);
      process.exit(1);
    }
    const inspectorUrl = `${targetOrigin}/__/inspector`;
    console.log(`\u{1F449} Opening Inspector at: ${inspectorUrl}`);
    await browser.url(inspectorUrl);
    console.log("\n\u2705 Inspector Ready!");
    console.log("\u{1F449} INSTRUCTIONS:");
    console.log("1. The browser window shows the Inspector UI.");
    console.log("2. The target site is loaded in the iframe on the right.");
    console.log('3. Toggle "Inspect Mode" to enable element highlighting.');
    console.log("4. Click elements to generate WDIO selectors.");
    console.log(
      '5. Toggle "Record Mode" to record interactions as a script.'
    );
    console.log("6. Press Ctrl+C to exit.\n");
    const keepAlive = setInterval(() => {
    }, 1e3);
    const cleanup = async () => {
      console.log("\n\u{1F6D1} Stopping Inspector Browser...");
      clearInterval(keepAlive);
      try {
        await browser.deleteSession();
        console.log("\u2705 Browser session closed.");
      } catch (e) {
        console.error("\u26A0\uFE0F Failed to close browser session:", e);
      }
      process.exit(0);
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  });
  cli.help();
  cli.version("0.0.1");
  cli.parse();
}
