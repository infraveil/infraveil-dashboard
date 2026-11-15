(function () {
  "use strict";

  const NAV_ICONS = {
    command: "command",
    runtime: "server-cog",
    monitoring: "activity",
    policy: "shield-check",
    resources: "book-open",
  };

  const SEARCH_ALIASES = [
    { label: "Uptime, SLO and error budgets", detail: "External HTTPS checks and measurement coverage", view: "reliability", icon: "activity" },
    { label: "TOTP and authenticator", detail: "Authentication settings", view: "auth-settings", target: "settings-auth-panel", icon: "key-round", settings: "authentication" },
    { label: "Account PIN", detail: "Approval security", view: "auth-settings", target: "settings-pin-input", icon: "lock-keyhole", settings: "authentication" },
    { label: "Windows Hello and passkeys", detail: "Authentication settings", view: "auth-settings", target: "settings-webauthn-status", icon: "fingerprint", settings: "authentication" },
    { label: "Proof packet", detail: "Runtime reports", view: "auth-settings", target: "settings-trust-panel", icon: "receipt-text", settings: "trust" },
    { label: "Dashboard appearance", detail: "Theme, colors, density, and motion", view: "auth-settings", target: "settings-appearance-panel", icon: "palette", settings: "appearance" },
    { label: "Export workspace data", detail: "Account data", view: "export-data", icon: "archive" },
    { label: "Billing and invoices", detail: "Account", view: "billing", icon: "credit-card" },
    { label: "Integrations", detail: "Edge integrations", view: "integrations", icon: "plug-zap" },
  ];

  const THEME_STORAGE_KEY = "infraveil-dashboard-theme-config";
  const THEME_SCOPE_KEY = "infraveil-dashboard-theme-scope";
  const BETA_NOTICE_STORAGE_KEY = "infraveil-beta-notice-v1";
  const THEME_TOKEN_DEFS = [
    { key: "page", label: "Page", group: "Surfaces", css: ["--bg-body"] },
    { key: "panel", label: "Panel", group: "Surfaces", css: ["--panel-bg", "--panel-solid", "--menu-bg"] },
    { key: "raised", label: "Raised panel", group: "Surfaces", css: ["--surface-raised"] },
    { key: "mutedSurface", label: "Muted surface", group: "Surfaces", css: ["--surface-muted", "--table-stripe"] },
    { key: "hoverSurface", label: "Hover surface", group: "Surfaces", css: ["--surface-hover", "--nav-hover"] },
    { key: "input", label: "Input", group: "Surfaces", css: ["--input-bg"] },
    { key: "border", label: "Panel border", group: "Structure", css: ["--panel-border"] },
    { key: "inputBorder", label: "Input border", group: "Structure", css: ["--input-border", "--range-track"] },
    { key: "tableBorder", label: "Table divider", group: "Structure", css: ["--table-border"] },
    { key: "text", label: "Primary text", group: "Typography", css: ["--text-main"] },
    { key: "mutedText", label: "Muted text", group: "Typography", css: ["--text-muted", "--nav-label"] },
    { key: "subtleText", label: "Subtle text", group: "Typography", css: ["--text-subtle"] },
    { key: "accent", label: "Primary accent", group: "Interaction", css: ["--accent", "--chart-active", "--nav-active-border"] },
    { key: "accentText", label: "Text on accent", group: "Interaction", css: ["--accent-contrast"] },
    { key: "selection", label: "Selected surface", group: "Interaction", css: ["--nav-active-bg"] },
    { key: "focus", label: "Focus ring", group: "Interaction", css: ["--focus-color"] },
    { key: "healthy", label: "Healthy", group: "Signals", css: ["--signal-healthy"] },
    { key: "warning", label: "Warning", group: "Signals", css: ["--signal-warning"] },
    { key: "critical", label: "Critical", group: "Signals", css: ["--signal-critical"] },
    { key: "info", label: "Information", group: "Signals", css: ["--signal-info"] },
    { key: "chartOne", label: "Chart series 1", group: "Charts", css: ["--chart-one"] },
    { key: "chartTwo", label: "Chart series 2", group: "Charts", css: ["--chart-two"] },
    { key: "chartThree", label: "Chart series 3", group: "Charts", css: ["--chart-three"] },
    { key: "chartFour", label: "Chart series 4", group: "Charts", css: ["--chart-four"] },
  ];

  // Migrate only the exact former default, never a named or custom theme.
  const PREVIOUS_ENTERPRISE_GRAY = { page: "#202020", panel: "#282828", raised: "#303030", mutedSurface: "#242424", hoverSurface: "#383838", input: "#1c1c1c", border: "#454545", inputBorder: "#686868", tableBorder: "#3c3c3c", text: "#f3f3f3", mutedText: "#c6c6c6", subtleText: "#a8a8a8", accent: "#2878ff", accentText: "#ffffff", selection: "#353535", focus: "#2878ff", healthy: "#75e0b2", warning: "#f7c66f", critical: "#ff9b92", info: "#9bb7ff", chartOne: "#2878ff", chartTwo: "#32d6a0", chartThree: "#f7b955", chartFour: "#b69cff" };

  const THEME_PRESETS = {
    light: {
      label: "Light", mode: "light",
      tokens: { page: "#f6f7f9", panel: "#ffffff", raised: "#ffffff", mutedSurface: "#f6f8fb", hoverSurface: "#eef3f8", input: "#ffffff", border: "#d0d5dd", inputBorder: "#bfc7d1", tableBorder: "#e4e7ec", text: "#101828", mutedText: "#475467", subtleText: "#667085", accent: "#175cd3", accentText: "#ffffff", selection: "#eaf2ff", focus: "#2563eb", healthy: "#067647", warning: "#b54708", critical: "#b42318", info: "#175cd3", chartOne: "#2563eb", chartTwo: "#12b76a", chartThree: "#f79009", chartFour: "#7f56d9" },
    },
    dark: {
      label: "Enterprise black", mode: "dark",
      tokens: { page: "#000000", panel: "#000000", raised: "#000000", mutedSurface: "#000000", hoverSurface: "#000000", input: "#000000", border: "#262626", inputBorder: "#686868", tableBorder: "#262626", text: "#f3f3f3", mutedText: "#b5b5b5", subtleText: "#858585", accent: "#2878ff", accentText: "#ffffff", selection: "#000000", focus: "#2878ff", healthy: "#75e0b2", warning: "#f7c66f", critical: "#ff9b92", info: "#9bb7ff", chartOne: "#2878ff", chartTwo: "#32d6a0", chartThree: "#f7b955", chartFour: "#b69cff" },
    },
  };

  const PREVIOUS_DEFAULT_DARK = { page: "#000000", panel: "#07080a", raised: "#0a0c10", mutedSurface: "#080a0d", hoverSurface: "#12151b", input: "#040507", border: "#343437", inputBorder: "#45454a", tableBorder: "#303033", text: "#f1f1f2", mutedText: "#b9b9be", subtleText: "#8d8d94", accent: "#6f92ff", accentText: "#08101f", selection: "#101827", focus: "#6f92ff", healthy: "#75e0b2", warning: "#f7c66f", critical: "#ff9b92", info: "#9bb7ff", chartOne: "#6f92ff", chartTwo: "#32d6a0", chartThree: "#f7b955", chartFour: "#b69cff" };
  const PREVIOUS_GRAPHITE_DARK = { ...PREVIOUS_DEFAULT_DARK, page: "#101011", panel: "#19191b", raised: "#1d1d1f", mutedSurface: "#202023", hoverSurface: "#29292c", input: "#141415", selection: "#29292c" };
  const PREVIOUS_NEUTRAL_DARK = { page: "#000000", panel: "#080808", raised: "#101010", mutedSurface: "#0c0c0c", hoverSurface: "#181818", input: "#050505", border: "#343434", inputBorder: "#454545", tableBorder: "#303030", text: "#f1f1f1", mutedText: "#b9b9b9", subtleText: "#8d8d8d", accent: "#e5e5e5", accentText: "#111111", selection: "#202020", focus: "#e5e5e5", healthy: "#75e0b2", warning: "#f7c66f", critical: "#ff9b92", info: "#9bb7ff", chartOne: "#e5e5e5", chartTwo: "#32d6a0", chartThree: "#f7b955", chartFour: "#b69cff" };
  const PREVIOUS_ENTERPRISE_DARK = { page: "#000000", panel: "#000000", raised: "#080a0d", mutedSurface: "#06080a", hoverSurface: "#111418", input: "#030507", border: "#282f37", inputBorder: "#3a434f", tableBorder: "#1b2027", text: "#f4f6f8", mutedText: "#b4bdc8", subtleText: "#949eac", accent: "#2878ff", accentText: "#ffffff", selection: "#0b1930", focus: "#74a8ff", healthy: "#75e0b2", warning: "#f7c66f", critical: "#ff9b92", info: "#9bb7ff", chartOne: "#2878ff", chartTwo: "#32d6a0", chartThree: "#f7b955", chartFour: "#b69cff" };

  const PREVIOUS_BLACK_DARK = { page: "#000000", panel: "#000000", raised: "#000000", mutedSurface: "#000000", hoverSurface: "#000000", input: "#000000", border: "#262626", inputBorder: "#333333", tableBorder: "#262626", text: "#f3f3f3", mutedText: "#b5b5b5", subtleText: "#858585", accent: "#2878ff", accentText: "#ffffff", selection: "#000000", focus: "#2878ff", healthy: "#75e0b2", warning: "#f7c66f", critical: "#ff9b92", info: "#9bb7ff", chartOne: "#2878ff", chartTwo: "#32d6a0", chartThree: "#f7b955", chartFour: "#b69cff" };
  const PREVIOUS_CHARCOAL_DARK = { ...PREVIOUS_BLACK_DARK, panel: "#080808", raised: "#0e0e0e", mutedSurface: "#0e0e0e", hoverSurface: "#141414", input: "#080808", selection: "#141414" };

  const THEME_LIBRARY = {
    cloud: {
      label: "Cloud", mode: "light",
      tokens: { ...THEME_PRESETS.light.tokens, page: "#f6f8fb", panel: "#ffffff", raised: "#ffffff", mutedSurface: "#f1f4f8", hoverSurface: "#e8eef6", input: "#ffffff", border: "#ccd5e0", inputBorder: "#aebccc", tableBorder: "#dce3eb", text: "#142033", mutedText: "#4b5d73", subtleText: "#6d7d91", accent: "#1d4ed8", selection: "#e2eaff", focus: "#2563eb", info: "#1d4ed8", chartOne: "#1d4ed8", chartTwo: "#0f9f76", chartThree: "#d97706", chartFour: "#7c3aed" },
    },
    porcelain: {
      label: "Porcelain", mode: "light",
      tokens: { ...THEME_PRESETS.light.tokens, page: "#f5f5f7", panel: "#ffffff", raised: "#ffffff", mutedSurface: "#f0f0f3", hoverSurface: "#e8e8ed", input: "#ffffff", border: "#d1d1d8", inputBorder: "#b5b5bf", tableBorder: "#e0e0e5", text: "#18181b", mutedText: "#52525b", subtleText: "#71717a", accent: "#6d28d9", selection: "#ede9fe", focus: "#7c3aed", healthy: "#047857", warning: "#a16207", critical: "#b91c1c", info: "#5b21b6", chartOne: "#6d28d9", chartTwo: "#0891b2", chartThree: "#db2777", chartFour: "#4f46e5" },
    },
    glacier: {
      label: "Glacier", mode: "light",
      tokens: { ...THEME_PRESETS.light.tokens, page: "#f1f7fa", panel: "#ffffff", raised: "#ffffff", mutedSurface: "#eaf3f7", hoverSurface: "#deedf3", input: "#ffffff", border: "#c5d7df", inputBorder: "#9eb8c4", tableBorder: "#d5e3e9", text: "#102a36", mutedText: "#435f6c", subtleText: "#637d88", accent: "#0369a1", selection: "#dff2ff", focus: "#0284c7", healthy: "#047857", warning: "#a16207", critical: "#b42318", info: "#0369a1", chartOne: "#0284c7", chartTwo: "#0d9488", chartThree: "#ca8a04", chartFour: "#7c3aed" },
    },
    mint: {
      label: "Mint", mode: "light",
      tokens: { ...THEME_PRESETS.light.tokens, page: "#f2f8f5", panel: "#ffffff", raised: "#ffffff", mutedSurface: "#eaf4ef", hoverSurface: "#deede5", input: "#ffffff", border: "#c8d9cf", inputBorder: "#a5bdae", tableBorder: "#d7e4dc", text: "#15261d", mutedText: "#496256", subtleText: "#698075", accent: "#047857", selection: "#d9f4e6", focus: "#059669", healthy: "#047857", warning: "#a16207", critical: "#b42318", info: "#0f766e", chartOne: "#059669", chartTwo: "#2563eb", chartThree: "#d97706", chartFour: "#9333ea" },
    },
    signal: {
      label: "Signal", mode: "light",
      tokens: { ...THEME_PRESETS.light.tokens, page: "#f7f7f8", panel: "#ffffff", raised: "#ffffff", mutedSurface: "#f1f1f2", hoverSurface: "#e9e9eb", input: "#ffffff", border: "#d3d3d8", inputBorder: "#b6b6be", tableBorder: "#e2e2e6", text: "#1c1917", mutedText: "#57534e", subtleText: "#78716c", accent: "#c2410c", selection: "#ffeadf", focus: "#ea580c", healthy: "#15803d", warning: "#a16207", critical: "#b91c1c", info: "#1d4ed8", chartOne: "#ea580c", chartTwo: "#2563eb", chartThree: "#16a34a", chartFour: "#9333ea" },
    },
    midnight: {
      label: "Midnight", mode: "dark",
      tokens: { ...THEME_PRESETS.dark.tokens, page: "#090d18", panel: "#111827", raised: "#172033", mutedSurface: "#182235", hoverSurface: "#202c43", input: "#0d1422", border: "#2c3a52", inputBorder: "#41516d", tableBorder: "#26344a", text: "#f2f5fb", mutedText: "#b7c2d5", subtleText: "#8795ad", accent: "#7c9cff", accentText: "#071126", selection: "#202e52", focus: "#8aa7ff", healthy: "#67d7ad", warning: "#f3c66b", critical: "#ff9188", info: "#8eb6ff", chartOne: "#7c9cff", chartTwo: "#36cfa0", chartThree: "#f0b84b", chartFour: "#cf8cff" },
    },
    black: {
      label: "Black", mode: "dark",
      tokens: { ...THEME_PRESETS.dark.tokens, page: "#050506", panel: "#101012", raised: "#17171a", mutedSurface: "#1b1b1e", hoverSurface: "#242428", input: "#0a0a0c", border: "#303034", inputBorder: "#494950", tableBorder: "#28282c", text: "#f7f7f8", mutedText: "#c4c4ca", subtleText: "#92929a", accent: "#a78bfa", accentText: "#120b22", selection: "#29213d", focus: "#b59cff", healthy: "#6ee7b7", warning: "#fde68a", critical: "#fca5a5", info: "#93c5fd", chartOne: "#a78bfa", chartTwo: "#5eead4", chartThree: "#fbbf24", chartFour: "#f472b6" },
    },
    graphite: {
      label: "Graphite", mode: "dark",
      // An explicitly selected named theme keeps its established inherited colors.
      tokens: { ...PREVIOUS_ENTERPRISE_DARK, page: "#101011", panel: "#19191b", raised: "#1d1d1f", mutedSurface: "#202023", hoverSurface: "#29292c", input: "#141415", selection: "#29292c" },
    },
    aurora: {
      label: "Aurora", mode: "dark",
      tokens: { ...THEME_PRESETS.dark.tokens, page: "#091311", panel: "#111e1b", raised: "#172723", mutedSurface: "#1a2b27", hoverSurface: "#223732", input: "#0d1715", border: "#2d4841", inputBorder: "#41645a", tableBorder: "#263d37", text: "#effbf7", mutedText: "#b7d1c8", subtleText: "#84a79b", accent: "#2dd4bf", accentText: "#05201c", selection: "#183d37", focus: "#5eead4", healthy: "#6ee7b7", warning: "#fcd34d", critical: "#fb8f87", info: "#7dd3fc", chartOne: "#2dd4bf", chartTwo: "#60a5fa", chartThree: "#fbbf24", chartFour: "#c084fc" },
    },
    nocturne: {
      label: "Nocturne", mode: "dark",
      tokens: { ...THEME_PRESETS.dark.tokens, page: "#130d18", panel: "#1d1424", raised: "#261a2e", mutedSurface: "#291d32", hoverSurface: "#352440", input: "#180f1e", border: "#44304f", inputBorder: "#60416f", tableBorder: "#382843", text: "#fbf4ff", mutedText: "#d2bddb", subtleText: "#a58daf", accent: "#e879f9", accentText: "#26052d", selection: "#45204d", focus: "#f0abfc", healthy: "#6ee7b7", warning: "#fcd34d", critical: "#fda4af", info: "#93c5fd", chartOne: "#e879f9", chartTwo: "#60a5fa", chartThree: "#34d399", chartFour: "#fbbf24" },
    },
  };

  let activeThemeConfig = null;
  let activeThemeScope = localStorage.getItem(THEME_SCOPE_KEY) === "workspace" ? "workspace" : "personal";
  let themeTokenFrame = 0;
  let pendingThemeTokenUpdates = {};

  const MODERN_DEMO_STEPS = [
    { view: "launcher", target: "#launcher-host-grid", title: "Choose your server", copy: "Select the Linux server you want to connect. Don't have one listed? Add it below. You'll run setup on that server—not on your PC.", outcome: "Use a server you control, with a regular Linux login and sudo access.", action: "Use this server", details: "You need permission to install software. A server card is a setup record, not a connection. The guide never installs, starts or approves anything for you." },
    { view: "trust-receipts", target: "#trust-console-download", title: "Run the setup command", copy: "Open your server's terminal using SSH or your hosting provider's console. Click Copy setup command here, paste it into that terminal and press Enter. Follow the terminal prompts. This page watches for the connection.", outcome: "No file transfer. No manual key or signature copy/paste.", action: "Copy setup command", details: "This prepares and copies a curl command. It expires after five minutes and installs on the machine where you run it. Run as a regular non-root user. Keep the command private. Manual approval remains the default. If this workspace already has a separate approval key, setup must use it rather than replace it. Automatic progress uses fresh reports from the dashboard's existing status refresh, not a separate poller." },
    { view: "deployments", target: "#view-deployments .iv-inventory-toolbar", title: "Start your first app", copy: "In the server terminal, allow the named demo apps you want to start. If you skipped one, use the installed console's review option. We'll continue when an app reports in from this server.", outcome: "Your server is connected. Now bring an app online.", action: "Check app", details: "A listed app is not a running app. Setup and approval remain explicit actions. The guide checks the selected server, current app heartbeat and matching runtime hashes without bypassing those controls. Advanced setup remains available under Connect & review." },
    { view: "overview", target: "#operations-fleet-navigator", title: "You're connected", copy: "This is your live workspace. Open App Logs for startup output or Request Trace for traffic. Check the app's health, then open the dashboard to explore.", outcome: "Server connection and app health are shown separately.", action: "Open dashboard", details: "The final check requires fresh server and app reports from the same server. Reports describe what the software observed, not independent inspection of the operating system. Gateway policies apply to configured routes; recovery depends on your app and settings. Empty logs stay empty until real activity arrives." },
  ];

  const DEMO_STEPS = MODERN_DEMO_STEPS.map((step, index) => ({
    ...step,
    kicker: `${index + 1} of ${MODERN_DEMO_STEPS.length} / Live setup`,
  }));

  const DEMO_GUIDE_STORAGE_PREFIX = "infraveil-demo-guide-v3";
  let demoStepIndex = 0;
  let demoTargetTimer = 0;
  let demoReturnFocus = null;
  let demoUnlockedStep = 0;
  let demoHostId = "";
  let demoCheckController = null;
  let demoCheckEpoch = 0;
  let demoCheckBusy = false;
  let demoEvidenceMessage = "No connection verified yet. Choose a server to begin.";

  // Learning is intentionally independent of the four evidence-gated connection
  // checkpoints. Reading a feature must never mark a server or app connected.
  const FEATURE_GUIDES = [
    { view: "reliability", title: "Reliability", purpose: "Check a public HTTPS health endpoint from outside its local agent and track an explicit good-check target.", steps: ["Add a read-only endpoint you control, choose the expected HTTP status, header latency and interval, then explicitly enable it. Checks come from one hosted location; no response body is stored.", "Read current check results alongside coverage and error budget. Missing, late or refused checks remain unknown. Budgets are advisory and do not pause releases or stop applications.", "Use Runtime signals in an enabled Edge Integration for deduplicated failure/recovery notifications. Edit or pause starts a new measurement series; deleting removes that monitor and its check history."] },
    { view: "overview", title: "Operations Home", purpose: "Start here to understand the fleet and choose the evidence scope for other operational pages.", steps: ["Use Fit fleet to see the existing servers. Select a server to inspect its workloads; select a workload to narrow telemetry. Clear scope to return to the entire fleet.", "Click a card to inspect it. Ctrl-click selects peers for a command; the selected peers also define the data scope. Right-click opens explicit commands. Dragging cards changes rollout order; double-click edits delay.", "Read launcher connection and workload heartbeat separately. A disconnected launcher can coexist with an app still reporting. A healthy badge is reported evidence, not an independent uptime test."] },
    { view: "launcher", title: "Servers", purpose: "Register, connect, and manage the launcher installed on each server you control.", steps: ["Add a named server record, choose that server, then use Connections & History to obtain its setup command. Run it on the intended machine as the instructed non-root login.", "Search filters the paged server inventory. A registered card does not mean the launcher connected. Inspect last sync, version, host identity, capacity, labels, and command receipt before acting.", "Restart launcher, restart or stop its workloads, drain placement, choose a separate backup server, or request a capacity diagnostic deliberately. Offline targets cannot acknowledge immediately; inspect their receipts rather than assuming the button completed the work."] },
    { view: "deployments", title: "Workloads", purpose: "A workload is the supervised app plus its runtime contract and telemetry identity, not an uploaded source repository.", steps: ["Find a workload using inventory search and paging. Confirm its assigned server, runtime type, heartbeat and contract before opening Runtime Contract or sending a command.", "Open App Logs for app output, Runtime Logs for process/supervisor evidence, and Request Trace for traffic. These answer different questions; empty logs mean no retained observations, not a healthy app.", "Stopping, restarting and deleting are explicit protected actions. Wait for a receipt and fresh heartbeat after changes. This view follows the fleet scope; clear it in Operations Home to see every workload."] },
    { view: "editor", title: "Runtime Contract", purpose: "Describe how an app runs on your server without handing over its source code. Start with one service, then add only the routes and recovery settings it needs.", steps: ["Confirm the target workload. Use Guided Setup for runtime, existing local port, dependency preparation and exact start command. Use external-process mode when the app is managed independently; a start command is not proof of attaching to systemd or Docker.", "Review the generated JSON. Services name the runtime and command; routes map gateway paths to service names; the gateway port must be free and different from local service ports. The gateway only sees traffic actually sent through its configured routes.", "Validate, then save deliberately. Saving creates a new contract/package and can queue a restart; release approval is a separate gate. A parsed JSON document is not proof that paths, commands, packages or ports exist on the target server. Recheck logs and receipts after applying."] },
    { view: "rollout", title: "Rollout Plan", purpose: "Choose the order and delay for servers and workloads so changes can be observed in stages.", steps: ["Inspect the current order and per-target delay. Reorder from Operations Home or this plan and review the selected targets before saving.", "Delay is scheduling intent, not a health guarantee. A disconnected target may not receive or acknowledge the command when other targets do.", "Watch command receipts, fresh app heartbeats and Updates health windows after each stage. Keep a known-good runtime and independent backups; a saved plan does not itself approve releases."] },
    { view: "incidents", title: "Incident Command", purpose: "Bring related runtime and traffic evidence into one operational investigation.", steps: ["Open the incident, identify the workload/server and inspect the observed error, timestamps, severity and activity. Follow links to logs and traces before deciding a cause.", "Use the timeline and recorded actions to distinguish a new event from an older unresolved one. Narrow fleet scope when you want one server or app's evidence.", "Acknowledge or resolve intentionally only when the underlying condition has been checked. An empty incident list is not proof every app is healthy; telemetry might be disconnected or outside retention."] },
    { view: "status-page", title: "Status Page", purpose: "Share a limited public health summary while retaining private operational details.", steps: ["Review component states and decide whether public sharing is appropriate. Generate a link deliberately and inspect what the public page exposes before sharing it.", "Copy the generated link, or revoke and regenerate when the current audience should lose access. Disabling stops that link; reopening the dashboard does not publish one automatically.", "Component states summarize reported workload status, not an external probe or uptime SLA. Revoking a link cannot erase information someone already copied."] },
    { view: "catalog", title: "Service Catalog", purpose: "See the fleet's ownership map: services, runtimes, host assignment and exact contract identity.", steps: ["Inspect a service's name, runtime, assigned host and reported status. Use its workload identity to follow operational logs and commands.", "Compare contract hashes when investigating whether two servers run the same declared package. A matching contract does not mean every dependency or environment variable is identical.", "Treat missing ownership, host or contract fields as incomplete evidence, not defaults. Catalog inventory can include offline registered workloads that still need intentional removal."] },
    { view: "app-logs", title: "App Logs", purpose: "Read retained output emitted by your application, including startup messages and errors.", steps: ["Choose service, stream, severity and time filters, then search for an error or request identifier. Pause the display if you need a stable slice while investigating.", "Open a row for full text and correlate its workload, phase and timestamp with Request Trace or process events. Output can include secrets; use the configured redaction and be careful when exporting.", "No lines may mean the app is quiet, disconnected, outside the selected scope or outside retention. Logs are historical observations and do not by themselves prove the process is still alive."] },
    { view: "console", title: "Runtime Logs", purpose: "Inspect launcher and agent process activity: startup, supervision, stdout/stderr, health failures and exits.", steps: ["Filter by node, stream and severity or search process names, errors and ports. Follow a startup sequence through launch, output, health check and command receipt.", "Use charts for the currently retained slice, not the fleet's complete history. The active fleet scope limits the agents included in operational telemetry.", "A restart click is a request. A completion receipt plus fresh heartbeat/log sequence is evidence of execution. Never infer recovery merely because the feed is empty."] },
    { view: "api-reference", title: "Demo API Surface", purpose: "Explore the demo apps' routes and understand what request and runtime evidence each exercise produces.", steps: ["Choose an app and read a route's method, purpose and expected result before opening it. Use a harmless health route first.", "Intentional failure or security exercise routes can generate real errors, logs and policy decisions on your own demo server. They are optional exercises, not setup checkpoints.", "Check App Logs, Request Trace, Incident Command and Pipeline Analytics after a request. This page is demo-only; it is not a complete automatically discovered inventory of your private production API."] },
    { view: "network", title: "Request Trace", purpose: "Inspect requests observed through the configured gateway and correlate them with runtime evidence.", steps: ["Search path, IP, method or stack, then filter decisions and status. Open a row to see selected headers, payload preview, timing and pipeline telemetry.", "Follow one request through capture, score and response stages. Correlate its identifier and time with App Logs to distinguish an app error from a gateway or policy decision.", "The gateway does not observe traffic that bypasses it. Headers and previews are bounded/redacted, and forwarded identity depends on trusted proxy configuration. A missing trace is not proof no request happened."] },
    { view: "internal-network", title: "Control Trace", purpose: "Inspect internal calls and control-plane activity separately from public application requests.", steps: ["Filter internal route, payload, agent and call type to locate sync, command, or evidence exchange. Read the timestamp and outcome before correlating with a workload command.", "Compare control trace with command receipts when a restart or update appears delayed. A successful request acceptance is different from a target acknowledging and executing it.", "Internal traces are bounded retained observations. Missing rows can result from retention or a disconnected reporter; do not treat them as a complete network packet capture."] },
    { view: "runtime-evidence", title: "Runtime Control", purpose: "Review what launchers and agents report about their running software, contracts and recorded commands.", steps: ["Inspect runtime identity, versions, hashes, host fingerprints and receipts. Check freshness before relying on a reported state.", "Compare desired contract with reported applied state. Queued, dispatched, completed and failed receipts are different phases; inspect the exact target and command.", "Evidence proves what the reporting software observed. An old code hash or fingerprint is not fresh proof of connection, and a receipt is not independent operating-system attestation."] },
    { view: "capacity-audit", title: "Capacity Audit", purpose: "Read a requested host diagnostic to make an informed placement decision.", steps: ["Start a diagnostic deliberately from Servers. Then inspect its sample time, CPU, memory, disk, running workloads, limiting resource and recommendations here.", "Filter and sort hosts to find pressure. Compare current workload demand with reported safe and burst capacity before changing max slots or placement.", "A short sample is an estimate, not a load test or permanent capacity guarantee. No diagnostic is not zero capacity, and disconnected hosts may have stale reports."] },
    { view: "cache-queue", title: "Cache & Queue", purpose: "Understand local recovery copies and whether telemetry is backing up or being dropped.", steps: ["Inspect cached versions, encryption evidence, cache timestamps, queued events and drops for the selected workload scope.", "Use the queue threshold and sorting to identify reporters under backpressure. Correlate a rising queue with sync failures or control-plane access before restarting anything.", "A cache-present report does not always confirm encryption, a usable backup, or every application data file. Independent application backups remain necessary. Historical queue size is not a fresh connectivity check."] },
    { view: "process-supervisor", title: "Process Supervisor", purpose: "Inspect each declared service's process lifecycle and supervision state.", steps: ["Check PID, runtime, start/exit times, health, restart counts and stdout/stderr details for the workload. Filter failing or stopped services first.", "Distinguish launcher-owned managed processes from independently managed external services. A process heartbeat and application health are different signals.", "Read a crash loop's logs and health command before requesting restart. A stale PID is not proof the process currently exists, and detached/systemd/Docker lifecycles require the appropriate external monitoring contract."] },
    { view: "gateway-routes", title: "Gateway & Routes", purpose: "Review the actual declared path-to-service routing and public listener configuration.", steps: ["Search route, service or workload, then confirm path pattern, target service, local port and gateway listener. Match each route to a named contract service.", "Send a harmless request through the intended gateway and check Request Trace plus app health to verify routing. Ensure your reverse proxy points at that listener.", "Traffic sent directly to the app bypasses this gateway and its policies. A declared route is configuration evidence, not a verified DNS, firewall or reachability check."] },
    { view: "trust-receipts", title: "Connections & History", purpose: "Connect a server, review explicit release approvals, and inspect the evidence chain without exposing your private approval key.", steps: ["Use Connect & review for the selected server's short-lived one-use setup command. Run it on that server and follow the local prompts; server enrollment, launcher connection and app heartbeat are separate milestones.", "Review named app, server and runtime changes before approval. Manual approval is the default; advanced signatures and separate administrator-workstation arrangements remain available when needed.", "Open Reports & history for identities, continuity and recorded commands. Export only what you intend to share. A hash or fingerprint without a fresh report does not prove the server is currently connected."] },
    { view: "security", title: "Security Policy", purpose: "Set the gateway's policy and inspect the decisions made from observed traffic.", steps: ["Review existing capture settings, score/risk rules, actions, countries, fingerprints and custom defenses in the local sections. Begin in observability/review mode when evaluating a new rule.", "Preview a specific route and request shape, then intentionally save through the protected approval flow. Watch actual decisions in Request Trace and Pipeline Analytics.", "Policies affect configured gateway traffic, not all packets or apps on the host. False positives can block legitimate users. Keep a known-good configuration and confirm the runtime applied the change."] },
    { view: "pipelines", title: "Pipeline Builder", purpose: "Build a readable request path: first collect facts, then choose responses. Draft changes remain local until an explicit protected save.", steps: ["Choose a goal: observe traffic, inspect payloads, understand geography or respond to risk. A preset creates a draft only. Pick the pipeline stack and target servers/apps before editing stages.", "Capture stages gather telemetry such as route, fingerprint or payload. Action stages consume those facts to score, log, limit or block. Order matters: dependencies must run before their consumers. Review each stage's settings and warnings.", "Validate the whole stack, save deliberately, and inspect receipts plus real pipeline logs. Start with log/review responses, then tune limits or blocks using observed legitimate traffic. Custom modules and adaptive tools are advanced configuration, not proof a model or rule is correct."] },
    { view: "pipeline-logs", title: "Pipeline Analytics", purpose: "Understand which pipeline steps ran and why traffic was allowed, limited, blocked or deceived.", steps: ["Filter request, route, stack, decision, risk and time. Inspect one execution before using charts to compare decision distribution and route hotspots.", "Read capture evidence, score, response and reason in order. Compare the applied stack with your draft to verify the requested configuration reached the runtime.", "Charts describe the retained slice and current scope, not all historical requests. No decisions can mean no observed gateway traffic, disconnected telemetry or a filter mismatch; it is not proof no threats exist."] },
    { view: "remediation", title: "MCP Control", purpose: "Connect an MCP-capable AI client to inspect your workspace and request supported operations.", steps: ["Choose the client, its computer and workspace access. Get a private setup prompt and paste it into your agent's private chat. Name and lifetime are under Connection options. The prompt contains a five-minute, one-use command: do not save it in AGENTS.md or source control.", "The agent checks Python and existing configuration, runs the exact verified setup command, then lists tools and makes a read-only workspace_status request. Client reload may be needed; copying or installing alone does not verify a connection.", "Read-only access cannot mutate. Workspace-wide control retains exact-target previews, one-use confirmations and freshness checks under your chosen action policy. Review expiry and real last use, and revoke unused connections. Release-signing keys and separate hardware approvals remain outside this grant."] },
    { view: "updates", title: "Updates", purpose: "Compare published runtime with reported agent/server versions and follow a guarded rollout.", steps: ["Read the release notes, eligible/current/waiting/rolled-back counts and canary or batch phase. A server launcher may need re-download even when agents are current.", "Observe the health window before expansion. A halted rollout needs investigation; do not assume retry is safe merely because a newer version exists.", "Auto-update preference does not bypass a customer-held release approval. Unknown or stale reporters cannot establish fleet-wide success. The dashboard can also offer a UI update after you finish editing."] },
    { view: "docs", title: "Documentation", purpose: "Use the local reference sections to understand supervision, contracts, evidence, pipelines and extension/tool contracts.", steps: ["Choose the relevant section from the local navigation. Use the feature walkthrough for the practical sequence, then reference exact fields in documentation.", "Match the example to your deployment mode and platform. An example command is not an action performed by opening this page.", "Validate examples against your actual server and current runtime. Documentation is explanation, not a fresh connectivity or security receipt."] },
    { view: "billing", title: "Billing, Usage & Capacity", purpose: "Review subscription, invoices, usage and capacity in one place before increasing operational scope.", steps: ["Use Plan & billing for subscription and invoices, Usage for metering and diagnostics, and Capacity for fleet sizing. Read the billing period and units before interpreting a number.", "Changes to paid plans or payment details are intentional account actions. A learning tour or MCP connection must not purchase capacity or bypass a workspace lock.", "Resolve billing/access restrictions from this page when required. Reports may remain viewable while live actions are blocked; do not infer a purchase or active subscription from a button click."] },
    { view: "auth-settings", title: "Account Settings", purpose: "Manage sign-in, recovery, action approvals, and dashboard preferences.", steps: ["Use Account for workspace details, Authentication for TOTP, PIN and passkeys, Runtime reports for export settings, and Appearance for theme preferences.", "Verify a new sign-in method before retiring an existing one. Sensitive actions require the configured approval method.", "Keep recovery codes, PINs and private keys confidential. The guide does not change credentials or account settings."] },
    { view: "integrations", title: "Integrations", purpose: "Deliver selected operational events to your team's existing tools.", steps: ["Configure a supported destination and select the event categories it should receive. OpenTelemetry export is not supported.", "Send a test and confirm delivery at the destination. Saving configuration alone does not confirm delivery.", "Event details can contain sensitive operational data. Use scoped credentials and verify the destination before enabling delivery."] },
    { view: "export-data", title: "Export Data", purpose: "Download workspace records and evidence for an audit or independent review.", steps: ["Read the included categories, retention window and scope before exporting. Select only the relevant proof, receipts, logs and contract metadata.", "Inspect the exported package and hashes. An export is a point-in-time snapshot; it is not a continuously verified mirror or an application data backup.", "Treat logs, identities and optional package metadata as confidential. Store and share intentionally; export access does not authorize publishing customer evidence."] },
    { view: "support", title: "Support", purpose: "Send a focused operational question with enough bounded evidence to investigate.", steps: ["Choose the relevant category, describe expected versus observed behavior, and identify the workload/server and timestamps.", "Attach only redacted evidence you intend to disclose. Include error text and command receipt phase instead of credentials or private approval keys.", "A submitted ticket is not an immediate fix or proof someone has reviewed it. Track replies and verify any suggested action in your own environment."] },
    { view: "feedback", title: "Feedback", purpose: "Report confusing, sharp or blocked workflow experiences so they can be reproduced.", steps: ["Pick the sentiment and affected page, then describe the action, expected outcome and what actually happened.", "Include enough environment and timing detail to reproduce, but do not paste secrets, tokens or customer payloads.", "Feedback does not issue a server command or open an incident automatically. Use Support for operational help and validate fixes before depending on them."] },
  ];
  let featureGuideIndex = 0, featureGuideReturnFocus = null;

  function buildFeatureGuide() {
    if (document.getElementById("iv-feature-guide")) return;
    const guide = document.createElement("aside");
    guide.id = "iv-feature-guide"; guide.className = "iv-feature-guide"; guide.hidden = true;
    guide.setAttribute("role", "dialog"); guide.setAttribute("aria-modal", "false"); guide.setAttribute("aria-labelledby", "iv-feature-title");
    guide.innerHTML = `<div class="iv-demo-guide-header"><div class="iv-demo-guide-brand"><span class="iv-demo-guide-mark"><i data-lucide="book-open"></i></span><div><strong>Learn the dashboard</strong><span>Explanation, not a live action</span></div></div><button type="button" data-feature-close class="iv-demo-guide-close" aria-label="Close feature walkthrough"><i data-lucide="x"></i></button></div><div class="iv-feature-body"><label>Choose a feature<select id="iv-feature-select" class="ink-input">${FEATURE_GUIDES.map((item, index) => `<option value="${index}">${item.title}</option>`).join("")}</select></label><h2 id="iv-feature-title"></h2><p id="iv-feature-purpose"></p><ol id="iv-feature-steps"></ol><p class="iv-feature-safety">This walkthrough does not install, save, restart, approve or verify anything. Live connection checks remain separate.</p></div><div class="iv-demo-guide-footer"><div class="iv-demo-guide-actions"><button type="button" data-feature-back class="iv-demo-guide-secondary">Previous feature</button><button type="button" data-feature-page class="iv-demo-guide-secondary">Open this page</button><button type="button" data-feature-next class="iv-demo-guide-primary">Next feature</button></div><span id="iv-feature-progress"></span></div>`;
    document.body.appendChild(guide);
    guide.querySelector("[data-feature-close]").addEventListener("click", closeFeatureGuide);
    guide.querySelector("#iv-feature-select").addEventListener("change", (event) => renderFeatureGuide(Number(event.target.value)));
    guide.querySelector("[data-feature-back]").addEventListener("click", () => renderFeatureGuide(featureGuideIndex - 1));
    guide.querySelector("[data-feature-next]").addEventListener("click", () => renderFeatureGuide(featureGuideIndex + 1));
    guide.querySelector("[data-feature-page]").addEventListener("click", () => {
      if (demoGuideCanNavigate()) window.switchView?.(FEATURE_GUIDES[featureGuideIndex].view);
    });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !guide.hidden) closeFeatureGuide(); });
    window.addEventListener("infraveil:access-paused", () => { guide.querySelector("[data-feature-page]").disabled = true; });
    document.querySelectorAll(".dashboard-main .view-section").forEach((view) => {
      const key = view.id.replace(/^view-/, "");
      if (!FEATURE_GUIDES.some((item) => item.view === key)) return;
      const button = document.createElement("button"); button.type = "button";
      button.className = "btn-secondary iv-feature-page-help"; button.textContent = "How to use this page";
      button.addEventListener("click", () => window.ivOpenFeatureGuide(key)); view.prepend(button);
    });
  }

  function renderFeatureGuide(index) {
    const guide = document.getElementById("iv-feature-guide"); if (!guide) return;
    featureGuideIndex = Math.max(0, Math.min(FEATURE_GUIDES.length - 1, index));
    const feature = FEATURE_GUIDES[featureGuideIndex];
    guide.querySelector("#iv-feature-select").value = String(featureGuideIndex);
    guide.querySelector("#iv-feature-title").textContent = feature.title;
    guide.querySelector("#iv-feature-purpose").textContent = feature.purpose;
    const list = guide.querySelector("#iv-feature-steps"); list.replaceChildren();
    feature.steps.forEach((copy) => { const item = document.createElement("li"); item.textContent = copy; list.appendChild(item); });
    guide.querySelector("[data-feature-back]").disabled = featureGuideIndex === 0;
    guide.querySelector("[data-feature-next]").disabled = featureGuideIndex === FEATURE_GUIDES.length - 1;
    guide.querySelector("[data-feature-page]").disabled = !demoGuideCanNavigate() || (feature.view === "api-reference" && document.body.dataset.demoMode !== "true");
    guide.querySelector("#iv-feature-progress").textContent = `${featureGuideIndex + 1} of ${FEATURE_GUIDES.length} features`;
  }

  function closeFeatureGuide({ restoreFocus = true } = {}) {
    const guide = document.getElementById("iv-feature-guide"); if (!guide) return;
    guide.hidden = true;
    if (restoreFocus && featureGuideReturnFocus?.isConnected) featureGuideReturnFocus.focus({ preventScroll: true });
  }

  window.ivOpenFeatureGuide = (view = "overview") => {
    if (typeof closeDemoGuide === "function") closeDemoGuide({ restoreFocus: false });
    if (typeof ivCloseFleetMenu === "function") ivCloseFleetMenu();
    buildFeatureGuide(); const guide = document.getElementById("iv-feature-guide");
    featureGuideReturnFocus = document.activeElement;
    renderFeatureGuide(Math.max(0, FEATURE_GUIDES.findIndex((item) => item.view === view)));
    guide.hidden = false; guide.querySelector("#iv-feature-select").focus({ preventScroll: true }); refreshIcons();
  };

  window.ivCloseGuides = () => {
    closeFeatureGuide({ restoreFocus: false });
    if (typeof closeDemoGuide === "function") closeDemoGuide({ restoreFocus: false });
    if (typeof ivCloseFleetMenu === "function") ivCloseFleetMenu();
  };
  document.addEventListener("pointerdown", (event) => {
    const learn = document.getElementById("iv-feature-guide");
    const setup = document.getElementById("iv-demo-guide");
    if (learn && !learn.hidden && !learn.contains(event.target)) closeFeatureGuide({ restoreFocus: false });
    if (setup && !setup.hidden && !setup.contains(event.target) && typeof closeDemoGuide === "function") closeDemoGuide({ restoreFocus: false });
  }, true);

  function icon(name, className) {
    const node = document.createElement("i");
    node.setAttribute("data-lucide", name);
    node.className = className || "w-4 h-4";
    return node;
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function buildBetaNotice() {
    if (document.getElementById("iv-beta-notice")) return;
    try {
      if (localStorage.getItem(BETA_NOTICE_STORAGE_KEY) === "acknowledged") return;
    } catch (_) {
      // Storage may be unavailable in hardened browsers; the notice can still be shown.
    }

    const notice = document.createElement("div");
    notice.id = "iv-beta-notice";
    notice.className = "iv-beta-notice";
    notice.setAttribute("role", "dialog");
    notice.setAttribute("aria-modal", "true");
    notice.setAttribute("aria-labelledby", "iv-beta-notice-title");
    notice.setAttribute("aria-describedby", "iv-beta-notice-copy");
    notice.innerHTML = `
      <section class="iv-beta-notice-card iv-modal-card">
        <div class="iv-modal-header">
          <span class="iv-modal-icon"><i data-lucide="flask-conical"></i></span>
          <div>
            <span class="iv-modal-eyebrow">Beta software</span>
            <h3 id="iv-beta-notice-title">Infraveil is currently in beta</h3>
            <p id="iv-beta-notice-copy">Infraveil is functional and actively being tested, but it is not perfect. Features, interfaces, and behavior may change, and defects may still occur.</p>
          </div>
        </div>
        <div class="iv-modal-callout iv-beta-notice-callout">
          <i data-lucide="shield-alert"></i>
          <div>
            <strong>Use appropriate safeguards</strong>
            <span>Keep independent backups and validate critical operations in your own environment before relying on them in production.</span>
          </div>
        </div>
        <div class="iv-modal-actions">
          <button type="button" class="btn-primary iv-beta-notice-accept">I understand</button>
        </div>
      </section>`;

    const accept = notice.querySelector(".iv-beta-notice-accept");
    accept.addEventListener("click", () => {
      try { localStorage.setItem(BETA_NOTICE_STORAGE_KEY, "acknowledged"); } catch (_) {}
      notice.remove();
      document.documentElement.classList.remove("iv-beta-notice-open");
    });
    document.body.appendChild(notice);
    document.documentElement.classList.add("iv-beta-notice-open");
    refreshIcons();
    window.setTimeout(() => accept.focus(), 0);
  }

  function presetTheme(name) {
    const catalog = { ...THEME_PRESETS, ...THEME_LIBRARY };
    const key = catalog[name] ? name : "light";
    const preset = catalog[key];
    return { version: 1, preset: key, mode: preset.mode, density: "comfortable", radius: 10, reduceMotion: false, tokens: { ...preset.tokens } };
  }

  function normalizeThemeConfig(value, fallbackName) {
    const fallback = presetTheme(fallbackName || "light");
    if (!value || typeof value !== "object") return fallback;
    const mode = value.mode === "dark" ? "dark" : "light";
    const catalog = { ...THEME_PRESETS, ...THEME_LIBRARY };
    const baseName = catalog[value.preset] ? value.preset : mode === "dark" ? "dark" : "light";
    const base = presetTheme(baseName);
    const tokens = { ...base.tokens };
    // Migrate only exact former defaults; preserve custom colors and all geometry.
    const previousDefaultDark = value.preset === "dark" && value.tokens &&
      [PREVIOUS_ENTERPRISE_GRAY, PREVIOUS_DEFAULT_DARK, PREVIOUS_GRAPHITE_DARK, PREVIOUS_NEUTRAL_DARK, PREVIOUS_ENTERPRISE_DARK, PREVIOUS_CHARCOAL_DARK, PREVIOUS_BLACK_DARK, THEME_LIBRARY.graphite.tokens].some((palette) =>
        THEME_TOKEN_DEFS.every(({ key }) => String(value.tokens[key]).toLowerCase() === palette[key]));
    Object.entries(previousDefaultDark ? {} : value.tokens || {}).forEach(([key, color]) => {
      if (THEME_TOKEN_DEFS.some((item) => item.key === key) && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(String(color))) tokens[key] = String(color).toLowerCase();
    });
    const preset = catalog[value.preset] ? value.preset : "custom";
    return { version: 1, preset, mode, density: value.density === "compact" ? "compact" : "comfortable", radius: Math.max(4, Math.min(16, Number(value.radius) || 10)), reduceMotion: !!value.reduceMotion, tokens };
  }

  function updateThemeToggle() {
    const button = document.getElementById("iv-theme-toggle");
    if (button) {
      const mode = document.documentElement.dataset.theme || "light";
      button.setAttribute("aria-label", mode === "dark" ? "Use light theme" : "Use dark theme");
      button.innerHTML = "";
      button.appendChild(icon(mode === "dark" ? "sun" : "moon", "w-[17px] h-[17px]"));
      refreshIcons();
    }
  }

  function applyThemeConfig(value, options) {
    const config = normalizeThemeConfig(value, value?.mode === "dark" ? "dark" : "light");
    activeThemeConfig = config;
    const root = document.documentElement;
    root.dataset.theme = config.mode;
    root.dataset.density = config.density;
    root.dataset.reducedMotion = config.reduceMotion ? "true" : "false";
    root.style.setProperty("--radius-sm", `${Math.max(4, config.radius - 2)}px`);
    root.style.setProperty("--radius-md", `${config.radius}px`);
    root.style.setProperty("--radius-lg", `${Math.min(20, config.radius + 2)}px`);
    THEME_TOKEN_DEFS.forEach((definition) => definition.css.forEach((property) => root.style.setProperty(property, config.tokens[definition.key])));
    root.style.setProperty("--focus-ring", `color-mix(in srgb, ${config.tokens.focus} 28%, transparent)`);
    root.style.setProperty("--accent-glow", `color-mix(in srgb, ${config.tokens.accent} 16%, transparent)`);
    root.style.setProperty("--chart-color", `color-mix(in srgb, ${config.tokens.chartOne} 16%, transparent)`);
    root.style.setProperty("--range-thumb-border", config.tokens.page);
    localStorage.setItem("infraveil-dashboard-theme", config.mode);
    if (options?.persist) localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
    updateThemeToggle();
    syncThemeEditor();
    window.dispatchEvent(new CustomEvent("infraveil:themechange", { detail: config }));
    return config;
  }

  function setTheme(theme) {
    applyThemeConfig(presetTheme(theme === "dark" ? "dark" : "light"), { persist: true });
  }

  function initializeTheme() {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || "null"); } catch (_) { stored = null; }
    const fallback = localStorage.getItem("infraveil-dashboard-theme") === "light" ? "light" : "dark";
    applyThemeConfig(stored || presetTheme(fallback), { persist: false });
    if (activeThemeScope === "workspace") loadWorkspaceTheme(true);
  }

  function updateSidebarToggle() {
    const sidebar = document.querySelector(".dashboard-sidebar");
    const button = document.getElementById("iv-sidebar-toggle");
    if (!sidebar || !button) return;
    const expanded = sidebar.dataset.expanded === "true";
    button.setAttribute("aria-pressed", expanded ? "true" : "false");
    button.setAttribute("aria-label", expanded ? "Collapse sidebar" : "Expand sidebar");
    button.title = expanded ? "Collapse sidebar" : "Expand sidebar";
    button.innerHTML = "";
    button.appendChild(icon(expanded ? "panel-left-close" : "panel-left-open", "w-[17px] h-[17px]"));
    refreshIcons();
  }

  function setSidebarPinned(pinned) {
    const sidebar = document.querySelector(".dashboard-sidebar");
    if (!sidebar) return;
    sidebar.dataset.pinned = pinned ? "true" : "false";
    sidebar.dataset.expanded = pinned ? "true" : "false";
    localStorage.setItem("infraveil-sidebar-expanded", pinned ? "1" : "0");
    updateSidebarToggle();
  }

  function buildNavigation() {
    const sidebar = document.querySelector(".dashboard-sidebar");
    const navHost = sidebar && sidebar.querySelector(":scope > .flex-1");
    if (!navHost || navHost.dataset.modernized) return;
    navHost.dataset.modernized = "true";
    const pinned = localStorage.getItem("infraveil-sidebar-expanded") !== "0";
    sidebar.dataset.pinned = pinned ? "true" : "false";
    sidebar.dataset.expanded = pinned ? "true" : "false";
    const mobileSidebar = window.matchMedia("(max-width: 860px)");
    const mobileToggle = document.querySelector(".mobile-menu-button");
    if (mobileToggle) {
      if (!sidebar.id) sidebar.id = "dashboard-sidebar";
      mobileToggle.setAttribute("aria-controls", sidebar.id);
      const syncMobileToggle = () => {
        const open = document.body.classList.contains("mobile-nav-open");
        mobileToggle.setAttribute("aria-expanded", String(open));
        mobileToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        sidebar.inert = mobileSidebar.matches && !open;
      };
      mobileSidebar.addEventListener("change", syncMobileToggle);
      syncMobileToggle();
      new MutationObserver(syncMobileToggle).observe(document.body, {
        attributes: true, attributeFilter: ["class"],
      });
    }

    Array.from(navHost.children).forEach((group) => {
      const label = group.querySelector(":scope > div");
      const nav = group.querySelector("nav");
      if (!label || !nav) return;
      const name = label.textContent.trim();
      const key = name.toLowerCase();
      group.classList.add("iv-nav-group");
      group.dataset.navGroup = key;

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "iv-nav-trigger";
      trigger.setAttribute("aria-label", name);
      trigger.setAttribute("aria-expanded", "false");
      trigger.title = name;
      trigger.appendChild(icon(NAV_ICONS[key] || "circle-dot", "w-[18px] h-[18px]"));
      const triggerLabel = document.createElement("span");
      triggerLabel.className = "iv-nav-trigger-label";
      triggerLabel.textContent = name;
      trigger.appendChild(triggerLabel);
      trigger.appendChild(icon("chevron-down", "iv-nav-trigger-chevron w-4 h-4"));

      const flyout = document.createElement("div");
      flyout.className = "iv-nav-flyout";
      flyout.id = `iv-nav-${key}`;
      trigger.setAttribute("aria-controls", flyout.id);
      const title = document.createElement("div");
      title.className = "iv-nav-flyout-title";
      title.textContent = name;
      flyout.appendChild(title);
      flyout.appendChild(nav);
      group.insertBefore(trigger, group.firstChild);
      group.appendChild(flyout);

      trigger.addEventListener("click", () => {
        const open = group.dataset.open === "true";
        document.querySelectorAll(".iv-nav-group[data-open='true']").forEach((item) => {
          item.dataset.open = "false";
          const itemTrigger = item.querySelector(".iv-nav-trigger");
          if (itemTrigger) itemTrigger.setAttribute("aria-expanded", "false");
        });
        group.dataset.open = open ? "false" : "true";
        trigger.setAttribute("aria-expanded", open ? "false" : "true");
        if (window.innerWidth > 860 && sidebar.dataset.pinned !== "true") {
          sidebar.dataset.expanded = open ? "false" : "true";
          updateSidebarToggle();
        }
      });
      nav.addEventListener("click", () => {
        if (window.innerWidth <= 860) {
          group.dataset.open = "false";
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (window.innerWidth <= 860 || sidebar.contains(event.target) || sidebar.dataset.pinned === "true") return;
      sidebar.dataset.expanded = "false";
      updateSidebarToggle();
      sidebar.querySelectorAll(".iv-nav-group[data-open='true']").forEach((group) => {
        group.dataset.open = "false";
        const trigger = group.querySelector(".iv-nav-trigger");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (window.innerWidth <= 860) {
        if (!document.body.classList.contains("mobile-nav-open")) return;
        // A dialog owns its Escape first; do not close navigation underneath it.
        if (document.querySelector(".iv-modal-overlay, #activeModal, #wh-modal:not(.hidden), #iv-feature-guide:not([hidden])")) return;
        window.toggleMobileNav(false);
        event.preventDefault();
        mobileToggle?.focus({ preventScroll: true });
        return;
      }
      if (sidebar.dataset.pinned !== "true") sidebar.dataset.expanded = "false";
      updateSidebarToggle();
      sidebar.querySelectorAll(".iv-nav-group[data-open='true']").forEach((group) => {
        group.dataset.open = "false";
        const trigger = group.querySelector(".iv-nav-trigger");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      });
    });

    const observer = new MutationObserver(updateActiveNavGroup);
    sidebar.querySelectorAll(".nav-item").forEach((item) => {
      observer.observe(item, { attributes: true, attributeFilter: ["class"] });
    });
    updateActiveNavGroup();
  }

  function updateActiveNavGroup() {
    document.querySelectorAll(".iv-nav-group").forEach((group) => {
      group.dataset.active = group.querySelector(".nav-item.active") ? "true" : "false";
    });
  }

  function buildHeader() {
    const host = document.querySelector(".dashboard-main > header > div:last-child");
    if (!host || host.dataset.modernized) return;
    const mobileMenu = document.querySelector(".mobile-menu-button");
    if (mobileMenu) mobileMenu.setAttribute("aria-label", "Open navigation");
    host.dataset.modernized = "true";
    host.className = "iv-header-actions";

    const search = document.createElement("button");
    search.type = "button";
    search.className = "iv-command-button";
    search.setAttribute("aria-label", "Search dashboard");
    search.appendChild(icon("search", "w-4 h-4"));
    const text = document.createElement("span");
    text.textContent = "Search pages, settings, and actions";
    search.appendChild(text);
    const shortcut = document.createElement("kbd");
    shortcut.textContent = "Ctrl K";
    search.appendChild(shortcut);
    search.addEventListener("click", openCommandPalette);

    const sidebarToggle = document.createElement("button");
    sidebarToggle.type = "button";
    sidebarToggle.id = "iv-sidebar-toggle";
    sidebarToggle.className = "iv-icon-button iv-sidebar-toggle";
    sidebarToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const sidebar = document.querySelector(".dashboard-sidebar");
      if (!sidebar) return;
      setSidebarPinned(sidebar.dataset.expanded !== "true");
    });

    const theme = document.createElement("button");
    theme.type = "button";
    theme.id = "iv-theme-toggle";
    theme.className = "iv-icon-button";
    theme.title = "Toggle theme";
    theme.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    };

    const fleetIndicator = document.createElement("div");
    fleetIndicator.id = "iv-global-fleet-scope";
    fleetIndicator.className = "iv-global-fleet-scope";
    fleetIndicator.title = "Data scope. Change it from Operations Home.";
    fleetIndicator.append(icon("crosshair", "w-3.5 h-3.5"), Object.assign(document.createElement("span"), { textContent: "Entire fleet" }));

    const headerItems = [sidebarToggle, search, fleetIndicator];
    const learn = document.createElement("button"); learn.type = "button"; learn.className = "iv-demo-launcher";
    learn.setAttribute("aria-label", "Learn every dashboard feature");
    learn.append(icon("book-open", "w-4 h-4"), Object.assign(document.createElement("span"), { textContent: "Learn" }));
    learn.addEventListener("click", () => window.ivOpenFeatureGuide(document.querySelector(".view-section.active")?.id.replace(/^view-/, "") || "overview"));
    headerItems.push(learn);
    if (document.body.dataset.demoMode === "true") {
      const guide = document.createElement("button");
      guide.type = "button";
      guide.className = "iv-demo-launcher";
      guide.setAttribute("aria-label", "Open demo guide");
      guide.append(icon("route", "w-4 h-4"), Object.assign(document.createElement("span"), { textContent: "Connect server" }));
      guide.addEventListener("click", openDemoGuide);
      headerItems.push(guide);
    }
    headerItems.push(theme);
    const issues = document.createElement("button");
    issues.type = "button"; issues.id = "iv-issue-indicator"; issues.className = "iv-issue-indicator";
    issues.append(icon("bell", "w-4 h-4"), Object.assign(document.createElement("span"), {className: "iv-issue-label", textContent: "Checking health"}), Object.assign(document.createElement("span"), {className: "iv-issue-count", textContent: "…"}));
    issues.setAttribute("aria-label", "Checking fleet health");
    issues.setAttribute("aria-live", "polite");
    issues.addEventListener("click", () => window.switchView?.("incidents"));
    headerItems.push(issues);
    const aiAccess = document.getElementById("global-ai-access");
    if (aiAccess) { aiAccess.className = "iv-icon-button"; headerItems.push(aiAccess); }
    host.append(...headerItems);
    updateSidebarToggle();
    updateThemeToggle();
  }

  function demoGuideStorage(suffix, value) {
    const scope = String(window.APP_CONFIG?.client_id || "demo");
    const key = `${DEMO_GUIDE_STORAGE_PREFIX}:${scope}:${suffix}`;
    try {
      if (value === undefined) return sessionStorage.getItem(key);
      sessionStorage.setItem(key, String(value));
    } catch (_) {
      // Browsing the demo still works when browser storage is unavailable.
    }
    return null;
  }

  function demoGuideCanNavigate() {
    return !window.ivDashboardAccess?.paused && !window.APP_STATE?.payment_required && !window.APP_STATE?.workspace_locked;
  }

  function demoSelectedHostId() {
    const selected = window.currentLauncherHostId || (typeof fleetSelectionState.currentLauncherHostId !== "undefined" ? fleetSelectionState.currentLauncherHostId : "");
    return String(typeof canonicalLauncherHostId === "function" ? canonicalLauncherHostId(selected) : selected || "").trim();
  }

  function resetDemoEvidence(message) {
    demoCheckEpoch += 1;
    demoCheckController?.abort();
    demoCheckController = null;
    demoCheckBusy = false;
    demoUnlockedStep = 0;
    demoHostId = "";
    demoEvidenceMessage = message || "No connection verified yet. Choose a server to begin.";
    demoGuideStorage("complete", "0");
  }

  // These match the status endpoint's host / heartbeat windows. Use its HTTP Date,
  // never a browser clock or a stored / previously rendered inventory, as evidence.
  function demoFreshTimestamp(value, serverNow, maxAge) {
    const timestamp = Number(value);
    return Number.isFinite(timestamp) && timestamp > 0 && timestamp <= serverNow + 1 && serverNow - timestamp < maxAge;
  }

  async function demoReadEvidence(path, signal) {
    const started = performance.now();
    const response = await window.fetch(`${path}?_tour_check=${Date.now()}`, {
      method: "GET", credentials: "same-origin", cache: "no-store", signal,
      headers: { Accept: "application/json", "Cache-Control": "no-cache, no-store", Pragma: "no-cache" },
    });
    if (!response.ok) {
      if ([401, 402, 403, 423].includes(response.status)) {
        closeDemoGuide({ restoreFocus: false });
        throw new Error("Sign in or resolve workspace access before checking again.");
      }
      throw new Error(`Live status is unavailable (HTTP ${response.status}). Retry when it is available.`);
    }
    const serverNow = Date.parse(response.headers.get("Date")) / 1000;
    const ageHeader = response.headers.get("Age");
    const cacheAge = ageHeader == null ? 0 : Number(ageHeader);
    if (!Number.isFinite(serverNow) || !Number.isFinite(cacheAge) || cacheAge !== 0
        || (ageHeader != null && !/^0$/.test(ageHeader.trim()))) {
      throw new Error("The response could not be verified as fresh. Try the check again.");
    }
    const data = await response.json();
    return { data, serverNow: serverNow + (performance.now() - started) / 1000 };
  }

  async function advanceDemoGuide(receipts = null) {
    const guide = document.getElementById("iv-demo-guide");
    if (!guide || guide.hidden || !demoGuideCanNavigate() || demoCheckBusy) return;
    const selected = demoSelectedHostId();
    if (!selected) {
      demoEvidenceMessage = "Select the Linux server card you intend to connect first.";
      renderDemoGuide();
      return;
    }
    if (demoHostId && demoHostId !== selected) {
      resetDemoEvidence("The selected server changed. Verify this server from the first step.");
      activateDemoStep(0);
      return;
    }
    demoCheckBusy = true;
    const epoch = demoCheckEpoch;
    const stepIndex = demoStepIndex;
    const workspaceId = String(window.APP_CONFIG?.client_id || "");
    const controller = new AbortController();
    demoCheckController = controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    demoEvidenceMessage = "Checking your server…";
    renderDemoGuide();
    try {
      // Reuse a fresh receipt from existing dashboard refreshes; explicit clicks
      // retain a bounded check. Neither path installs, approves or adds a poller.
      const [status, approval] = receipts ? [receipts.status, receipts.approval] : await Promise.all([
        demoReadEvidence("/client/api/status", controller.signal),
        demoReadEvidence("/client/api/release-approval/pending", controller.signal),
      ]);
      if (epoch !== demoCheckEpoch || guide.hidden || demoStepIndex !== stepIndex || !demoGuideCanNavigate()) return;
      if (demoSelectedHostId() !== selected) {
        resetDemoEvidence("The selected server changed during the check. Choose it again.");
        activateDemoStep(0);
        return;
      }
      if (!workspaceId || String(status.data.client_id || "") !== workspaceId || String(window.APP_CONFIG?.client_id || "") !== workspaceId) {
        throw new Error("The workspace changed or could not be verified. Reload its dashboard and try again.");
      }
      const hosts = Array.isArray(status.data.launcher_hosts) ? status.data.launcher_hosts : [];
      const host = hosts.find((item) => String(item.host_id || "") === selected);
      if (!host) throw new Error("The selected server was not returned by live status. Select its current server card and retry.");
      if (stepIndex === 0) {
        demoHostId = selected;
        demoUnlockedStep = 1;
        demoEvidenceMessage = `${String(host.name || "Selected server")}: selected. Connection is not verified yet.`;
        activateDemoStep(1);
        return;
      }
      const hostRuntime = host.runtime_status;
      const connected = host.status === "online" && demoFreshTimestamp(host.last_sync, status.serverNow, 12)
        && demoFreshTimestamp(host.runtime_status_at, status.serverNow, 12)
        && hostRuntime && typeof hostRuntime === "object" && !Array.isArray(hostRuntime)
        && /^[a-f0-9]{64}$/i.test(String(hostRuntime.launcher_source_hash || ""))
        && typeof hostRuntime.host_fingerprint === "string" && !!hostRuntime.host_fingerprint.trim();
      if (approval.data.enrolled !== true) {
        demoEvidenceMessage = "Waiting for setup. Paste the command into your server's terminal and follow its prompts.";
        renderDemoGuide();
        return;
      }
      if (!connected) {
        demoEvidenceMessage = "Setup is ready. Waiting for your server to connect—keep its terminal open.";
        renderDemoGuide();
        return;
      }
      if (stepIndex === 1) {
        demoUnlockedStep = Math.max(demoUnlockedStep, 2);
        demoEvidenceMessage = `${String(host.name || "Server")}: connected and reporting now. Next, bring an app online.`;
        activateDemoStep(2);
        return;
      }
      const agents = Array.isArray(status.data.agents) ? status.data.agents : [];
      const app = agents.find((item) => String(item.launcher_host_id || "") === selected && item.status === "online"
        && demoFreshTimestamp(item.last_heartbeat, status.serverNow, 10)
        && demoFreshTimestamp(item.runtime_status_at, status.serverNow, 10)
        && /^[a-f0-9]{64}$/i.test(String(item.payload_hash || ""))
        && item.runtime_status?.payload_hash === item.payload_hash
        && hostRuntime.running_agents?.[item.agent_id]?.alive === true
        && hostRuntime.running_agents[item.agent_id].last_payload_hash === item.payload_hash);
      if (!app) {
        demoEvidenceMessage = "Server connected. Waiting for your first app—allow the named apps in the server terminal.";
        renderDemoGuide();
        return;
      }
      const health = ["healthy", "unhealthy", "unknown"].includes(app.health) ? app.health : "unknown";
      demoEvidenceMessage = `${String(host.name || "Server")}: connected. ${String(app.name || "App")}: reporting from this server. Reported app health: ${health}.`;
      if (stepIndex === DEMO_STEPS.length - 1) {
        demoGuideStorage("complete", "1");
        closeDemoGuide();
        if (typeof window.showToast === "function") window.showToast(demoEvidenceMessage, health === "healthy" ? "success" : "info");
      } else {
        demoUnlockedStep = Math.max(demoUnlockedStep, stepIndex + 1);
        activateDemoStep(stepIndex + 1);
      }
    } catch (error) {
      if (epoch !== demoCheckEpoch || guide.hidden || !demoGuideCanNavigate()) return;
      demoEvidenceMessage = error.name === "AbortError" ? "The live check timed out. No milestone was verified. Try again." : String(error.message || "Could not check live status. Try again.");
      renderDemoGuide();
    } finally {
      clearTimeout(timeout);
      if (epoch === demoCheckEpoch) {
        demoCheckBusy = false;
        demoCheckController = null;
        renderDemoGuide();
      }
    }
  }

  function buildDemoGuide() {
    if (document.body.dataset.demoMode !== "true" || document.getElementById("iv-demo-guide") || !demoGuideCanNavigate()) return;
    try {
      sessionStorage.setItem("infraveil-demo-questionnaire-complete", "1");
      sessionStorage.setItem("infraveil-demo-tour-closed", "1");
    } catch (_) { /* The stylesheet also keeps the legacy tour suppressed. */ }
    document.body.classList.remove("tour-welcome-blur");
    const legacyTourGuard = new MutationObserver(() => {
      if (document.body.classList.contains("tour-welcome-blur")) document.body.classList.remove("tour-welcome-blur");
    });
    legacyTourGuard.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const guide = document.createElement("aside");
    guide.id = "iv-demo-guide";
    guide.className = "iv-demo-guide";
    guide.setAttribute("aria-labelledby", "iv-demo-guide-title");
    guide.innerHTML = `
      <div class="iv-demo-guide-header">
        <div class="iv-demo-guide-brand">
          <span class="iv-demo-guide-mark"><i data-lucide="route" class="w-4 h-4"></i></span>
          <div><strong>Connect your server</strong><span>Four live connection checkpoints</span></div>
        </div>
        <button type="button" class="iv-demo-guide-close" aria-label="Close demo guide"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>
      <div class="iv-demo-guide-progress" role="progressbar" aria-label="Tour progress" aria-valuemin="1" aria-valuemax="${DEMO_STEPS.length}"><span></span></div>
      <div class="iv-demo-guide-body">
        <div class="iv-demo-guide-toolbar">
          <div class="iv-demo-guide-kicker"></div>
          <label class="iv-demo-guide-jump-wrap" hidden>
            <span>Review</span>
            <select class="iv-demo-guide-jump" aria-label="Review an unlocked setup step">
              ${DEMO_STEPS.map((step, index) => `<option value="${index}">${index + 1}. ${step.title}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="iv-demo-guide-summary" aria-live="polite" aria-atomic="true">
          <h2 id="iv-demo-guide-title"></h2>
          <p class="iv-demo-guide-copy"></p>
        </div>
        <div class="iv-demo-guide-outcome"><i data-lucide="circle-dot" class="w-4 h-4 shrink-0"></i><div><span></span></div></div>
        <p class="iv-demo-guide-evidence" role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="iv-demo-guide-links">
          <button type="button" class="iv-demo-guide-secondary" data-demo-view="app-logs">App Logs</button>
          <button type="button" class="iv-demo-guide-secondary" data-demo-view="network">Request Trace</button>
        </div>
        <details class="iv-demo-guide-details"><summary>Advanced setup details</summary><p></p></details>
        <p class="iv-demo-guide-note">You can close this guide and explore at any time.</p>
      </div>
      <div class="iv-demo-guide-footer">
        <div class="iv-demo-guide-actions">
          <button type="button" class="iv-demo-guide-secondary" data-demo-back>Back</button>
          <button type="button" class="iv-demo-guide-primary" data-demo-next><span></span><i data-lucide="arrow-right" class="w-4 h-4"></i></button>
        </div>
        <button type="button" class="iv-demo-guide-restart" data-demo-check hidden>Check connection</button>
        <button type="button" class="iv-demo-guide-restart" data-demo-restart>Start again</button>
        <button type="button" class="iv-demo-guide-restart" data-demo-explore>Explore without completing</button>
        <button type="button" class="iv-demo-guide-restart" data-demo-learn>Learn every dashboard feature</button>
        <a href="/demo/request" class="iv-demo-guide-restart">Schedule a guided demo</a>
        <div class="iv-demo-guide-steps" aria-hidden="true">${DEMO_STEPS.map(() => '<span class="iv-demo-guide-step"></span>').join("")}</div>
      </div>`;
    document.body.appendChild(guide);
    window.ivDemoGuideStatusHost = () => !guide.hidden && demoGuideCanNavigate() && [1, 2].includes(demoStepIndex) ? demoSelectedHostId() : "";
    guide.querySelector(".iv-demo-guide-close").addEventListener("click", closeDemoGuide);
    guide.querySelector("[data-demo-back]").addEventListener("click", () => activateDemoStep(demoStepIndex - 1));
    guide.querySelector(".iv-demo-guide-jump").addEventListener("change", (event) => activateDemoStep(Number(event.target.value)));
    guide.querySelector("[data-demo-restart]").addEventListener("click", () => {
      resetDemoEvidence();
      activateDemoStep(0);
    });
    guide.querySelector("[data-demo-next]").addEventListener("click", () => demoStepIndex === 1 ? copyDemoSetupCommand() : advanceDemoGuide());
    guide.querySelector("[data-demo-check]").addEventListener("click", () => advanceDemoGuide());
    guide.querySelector("[data-demo-explore]").addEventListener("click", closeDemoGuide);
    guide.querySelector("[data-demo-learn]").addEventListener("click", () => { closeDemoGuide({ restoreFocus: false }); window.ivOpenFeatureGuide("overview"); });
    guide.querySelectorAll("[data-demo-view]").forEach((button) => button.addEventListener("click", () => {
      if (demoGuideCanNavigate() && typeof window.switchView === "function") window.switchView(button.dataset.demoView);
    }));
    document.addEventListener("keydown", handleDemoGuideKey);
    window.addEventListener("infraveil:access-paused", () => closeDemoGuide({ restoreFocus: false }));
    window.addEventListener("infraveil:status-receipt", (event) => {
      const receipt = event.detail;
      if (!receipt || !receipt.data || typeof receipt.data.release_approval_enrolled !== "boolean"
          || !Number.isFinite(receipt.serverNow) || !Number.isFinite(receipt.receivedAt)
          || performance.now() - receipt.receivedAt < 0 || performance.now() - receipt.receivedAt > 2000
          || guide.hidden || !demoGuideCanNavigate() || demoCheckBusy || ![1, 2].includes(demoStepIndex)) return;
      advanceDemoGuide({ status: receipt, approval: { data: { enrolled: receipt.data.release_approval_enrolled } } });
    });
    // Stored navigation is not live evidence. Every replay/reload starts by
    // identifying and checking the actual server again.
    demoStepIndex = 0;
    renderDemoGuide();
    guide.hidden = demoGuideStorage("complete") === "1" || demoGuideStorage("dismissed") === "1";
    if (!guide.hidden) activateDemoStep(demoStepIndex);
    refreshIcons();
  }

  function renderDemoGuide() {
    const guide = document.getElementById("iv-demo-guide");
    if (!guide) return;
    const step = DEMO_STEPS[demoStepIndex];
    guide.querySelector(".iv-demo-guide-kicker").textContent = step.kicker;
    guide.querySelector("h2").textContent = step.title;
    guide.querySelector(".iv-demo-guide-copy").textContent = step.copy;
    guide.querySelector(".iv-demo-guide-outcome span").textContent = step.outcome;
    guide.querySelector(".iv-demo-guide-evidence").textContent = demoEvidenceMessage;
    guide.querySelector(".iv-demo-guide-details p").textContent = step.details;
    guide.querySelector(".iv-demo-guide-jump").value = String(demoStepIndex);
    guide.querySelector(".iv-demo-guide-jump").disabled = demoCheckBusy;
    guide.querySelectorAll(".iv-demo-guide-jump option").forEach((option, index) => { option.disabled = index > demoUnlockedStep; });
    guide.querySelector("[data-demo-next] span").textContent = step.action;
    guide.querySelector("[data-demo-next]").disabled = demoCheckBusy;
    guide.querySelector("[data-demo-check]").hidden = demoStepIndex !== 1;
    guide.querySelector("[data-demo-check]").disabled = demoCheckBusy;
    guide.setAttribute("aria-busy", String(demoCheckBusy));
    guide.querySelector(".iv-demo-guide-links").hidden = demoStepIndex !== DEMO_STEPS.length - 1;
    guide.querySelector("[data-demo-back]").disabled = demoStepIndex === 0 || demoCheckBusy;
    guide.querySelector(".iv-demo-guide-progress").setAttribute("aria-valuenow", String(demoStepIndex + 1));
    guide.querySelector(".iv-demo-guide-progress").setAttribute("aria-valuetext", `Step ${demoStepIndex + 1} of ${DEMO_STEPS.length}: ${step.title}`);
    guide.querySelector(".iv-demo-guide-progress span").style.width = `${((demoStepIndex + 1) / DEMO_STEPS.length) * 100}%`;
    guide.querySelectorAll(".iv-demo-guide-step").forEach((item, index) => {
      item.dataset.state = index < demoStepIndex ? "complete" : index === demoStepIndex ? "active" : "pending";
    });
    refreshIcons();
  }

  async function copyDemoSetupCommand() {
    const guide = document.getElementById("iv-demo-guide");
    if (!guide || guide.hidden || !demoGuideCanNavigate() || demoCheckBusy || demoStepIndex !== 1) return;
    const selected = demoSelectedHostId(), workspace = String(window.APP_CONFIG?.client_id || ""), epoch = demoCheckEpoch;
    const button = guide.querySelector("[data-demo-next]");
    demoCheckBusy = true;
    renderDemoGuide();
    try {
      if (!window.ivTrustConsole) throw new Error("Setup is unavailable. Reload this dashboard and try again.");
      await window.ivTrustConsole.command();
      if (epoch !== demoCheckEpoch || guide.hidden || demoStepIndex !== 1 || !demoGuideCanNavigate()
          || selected !== demoSelectedHostId() || workspace !== String(window.APP_CONFIG?.client_id || "")) return;
      const copied = await window.ivTrustConsole.copy();
      if (epoch !== demoCheckEpoch || guide.hidden || demoStepIndex !== 1 || !demoGuideCanNavigate()) return;
      demoEvidenceMessage = copied ? "Copied. Paste into your server's terminal, press Enter and follow its prompts. Waiting for the connection…"
        : "Could not copy the command. Close this guide and use View command to copy it manually, or try again.";
      renderDemoGuide();
    } catch (error) {
      if (epoch === demoCheckEpoch && !guide.hidden && demoGuideCanNavigate()) {
        demoEvidenceMessage = String(error.message || "Could not prepare setup. Try again.");
        renderDemoGuide();
      }
    } finally {
      if (epoch === demoCheckEpoch) { demoCheckBusy = false; renderDemoGuide(); }
    }
  }

  function activateDemoStep(index) {
    if (!demoGuideCanNavigate()) return;
    const guide = document.getElementById("iv-demo-guide");
    if (!guide || guide.hidden || !Number.isInteger(index)) return;
    demoStepIndex = Math.max(0, Math.min(DEMO_STEPS.length - 1, demoUnlockedStep, index));
    demoGuideStorage("step", demoStepIndex);
    document.querySelectorAll(".iv-demo-target").forEach((node) => node.classList.remove("iv-demo-target"));
    const step = DEMO_STEPS[demoStepIndex];
    if (typeof window.switchView === "function") window.switchView(step.view);
    if (step.view === "trust-receipts" && typeof selectLocalSection === "function") {
      const layout = document.querySelector("#view-trust-receipts .iv-trust-layout");
      if (layout) selectLocalSection(layout, "configure");
    }
    renderDemoGuide();
    clearTimeout(demoTargetTimer);
    demoTargetTimer = setTimeout(() => {
      const guide = document.getElementById("iv-demo-guide");
      if (!guide || guide.hidden || !demoGuideCanNavigate()) return;
      const target = document.querySelector(step.target);
      if (!target) return;
      target.classList.add("iv-demo-target");
      const reducedMotion = activeThemeConfig?.reduceMotion || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ block: "center", behavior: reducedMotion ? "auto" : "smooth" });
    }, 160);
  }

  function openDemoGuide() {
    const guide = document.getElementById("iv-demo-guide");
    if (!guide || !demoGuideCanNavigate()) return;
    closeFeatureGuide({ restoreFocus: false });
    if (typeof ivCloseFleetMenu === "function") ivCloseFleetMenu();
    demoReturnFocus = document.activeElement;
    if (demoGuideStorage("complete") === "1") {
      demoStepIndex = 0;
      resetDemoEvidence();
    }
    demoGuideStorage("dismissed", "0");
    guide.hidden = false;
    activateDemoStep(demoStepIndex);
    guide.querySelector(".iv-demo-guide-close").focus({ preventScroll: true });
  }

  function closeDemoGuide({ restoreFocus = true } = {}) {
    const guide = document.getElementById("iv-demo-guide");
    const focusInside = guide?.contains(document.activeElement);
    demoCheckEpoch += 1;
    demoCheckController?.abort();
    demoCheckController = null;
    demoCheckBusy = false;
    clearTimeout(demoTargetTimer);
    demoTargetTimer = 0;
    if (guide) guide.hidden = true;
    demoGuideStorage("dismissed", "1");
    document.querySelectorAll(".iv-demo-target").forEach((node) => node.classList.remove("iv-demo-target"));
    if (restoreFocus && focusInside) {
      const returnTarget = demoReturnFocus?.isConnected && !guide.contains(demoReturnFocus) ? demoReturnFocus : document.querySelector(".iv-demo-launcher");
      returnTarget?.focus({ preventScroll: true });
    }
    demoReturnFocus = null;
  }

  function handleDemoGuideKey(event) {
    const guide = document.getElementById("iv-demo-guide");
    if (!guide || guide.hidden || event.defaultPrevented || !demoGuideCanNavigate()) return;
    if (document.querySelector("dialog[open], [role='dialog'][aria-modal='true'], .iv-modal-overlay.iv-show")) return;
    const target = event.target;
    const editing = target?.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target?.tagName || "");
    if (event.key === "Escape" && !editing) {
      event.preventDefault();
      closeDemoGuide();
    } else if (guide.contains(target) && !editing && !event.altKey && !event.ctrlKey && !event.metaKey && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "ArrowRight") demoStepIndex === 1 ? copyDemoSetupCommand() : advanceDemoGuide();
      else activateDemoStep(demoStepIndex - 1);
    }
  }

  let commandItems = [];
  let commandIndex = 0;
  let commandReturnFocus = null;

  function buildCommandPalette() {
    if (document.getElementById("iv-command-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "iv-command-overlay";
    overlay.className = "iv-command-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Dashboard search");
    overlay.innerHTML = `
      <div class="iv-command-palette">
        <div class="iv-command-input-wrap">
          <i data-lucide="search" class="w-5 h-5" style="color:var(--text-subtle)"></i>
          <input id="iv-command-input" class="iv-command-input" autocomplete="off" placeholder="Find TOTP, runtime logs, deployments..." />
          <kbd style="color:var(--text-subtle);font-size:11px">Esc</kbd>
        </div>
        <div id="iv-command-results" class="iv-command-results" role="listbox"></div>
      </div>`;
    overlay.addEventListener("mousedown", (event) => {
      if (event.target === overlay) closeCommandPalette();
    });
    document.body.appendChild(overlay);
    const input = overlay.querySelector("#iv-command-input");
    input.addEventListener("input", () => renderCommandResults(input.value));
    input.addEventListener("keydown", handleCommandKeys);
    refreshIcons();
  }

  function collectCommandItems() {
    const navItems = Array.from(document.querySelectorAll(".nav-item[id^='nav-']")).map((node) => ({
      label: node.textContent.trim().replace(/\s+/g, " "),
      detail: node.closest(".iv-nav-group")?.dataset.navGroup || "Navigation",
      view: node.id.replace(/^nav-/, ""),
      icon: node.querySelector("[data-lucide]")?.getAttribute("data-lucide") || "arrow-right",
    }));
    const guides = FEATURE_GUIDES.filter((item) => document.getElementById(`view-${item.view}`)).map((item) => ({ label: item.title, view: item.view, detail: "Dashboard feature", icon: "arrow-right" }));
    const seen = new Set();
    commandItems = navItems.concat(SEARCH_ALIASES, guides).filter((item) => {
      const key = `${item.view || ""}:${item.label.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }

  function scoreItem(item, query) {
    const haystack = `${item.label} ${item.detail || ""} ${item.view || ""}`.toLowerCase();
    if (!query) return 1;
    if (item.label.toLowerCase().startsWith(query)) return 12;
    if (item.label.toLowerCase().includes(query)) return 8;
    const terms = query.split(/\s+/).filter(Boolean);
    return terms.every((term) => haystack.includes(term)) ? 4 : 0;
  }

  function renderCommandResults(value) {
    const query = (value || "").trim().toLowerCase();
    const results = commandItems
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
      .slice(0, 16)
      .map((entry) => entry.item);
    commandIndex = Math.min(commandIndex, Math.max(0, results.length - 1));
    const host = document.getElementById("iv-command-results");
    host.innerHTML = "";
    if (!results.length) {
      host.innerHTML = '<div class="iv-command-empty">No dashboard destination matches that search.</div>';
      return;
    }
    results.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "iv-command-result";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", index === commandIndex ? "true" : "false");
      const iconWrap = document.createElement("span");
      iconWrap.className = "iv-result-icon";
      iconWrap.appendChild(icon(item.icon || "arrow-right", "w-4 h-4"));
      const copy = document.createElement("span");
      const label = document.createElement("strong");
      label.textContent = item.label;
      const detail = document.createElement("small");
      detail.style.display = "block";
      detail.textContent = item.detail || "Dashboard";
      copy.append(label, detail);
      const go = document.createElement("small");
      go.textContent = "Open";
      button.append(iconWrap, copy, go);
      button.addEventListener("click", () => activateCommand(item));
      host.appendChild(button);
    });
    host.dataset.results = JSON.stringify(results);
    refreshIcons();
  }

  function activateCommand(item) {
    closeCommandPalette();
    if (typeof window.switchView === "function") window.switchView(item.view);
    if (item.settings) setTimeout(() => selectSettingsSection(item.settings), 60);
    if (item.target) {
      setTimeout(() => {
        const target = document.getElementById(item.target);
        if (!target) return;
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        target.classList.add("iv-focus-flash");
        setTimeout(() => target.classList.remove("iv-focus-flash"), 1500);
        if (typeof target.focus === "function" && /INPUT|BUTTON|SELECT|TEXTAREA/.test(target.tagName)) target.focus({ preventScroll: true });
      }, 120);
    }
  }

  function handleCommandKeys(event) {
    const host = document.getElementById("iv-command-results");
    const buttons = Array.from(host.querySelectorAll(".iv-command-result"));
    if (event.key === "Escape") return closeCommandPalette();
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      commandIndex = (commandIndex + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
      buttons.forEach((button, index) => button.setAttribute("aria-selected", index === commandIndex ? "true" : "false"));
      buttons[commandIndex]?.scrollIntoView({ block: "nearest" });
    }
    if (event.key === "Enter") {
      event.preventDefault();
      buttons[commandIndex]?.click();
    }
  }

  function openCommandPalette() {
    window.ivCloseUserMenu?.();
    window.ivCloseGuides?.();
    collectCommandItems();
    const overlay = document.getElementById("iv-command-overlay");
    if (overlay.dataset.open !== "true") commandReturnFocus = document.activeElement;
    overlay.dataset.open = "true";
    const input = document.getElementById("iv-command-input");
    input.value = "";
    commandIndex = 0;
    renderCommandResults("");
    setTimeout(() => { if (overlay.dataset.open === "true") input.focus(); }, 10);
  }

  function closeCommandPalette() {
    const overlay = document.getElementById("iv-command-overlay");
    if (overlay && overlay.dataset.open === "true") {
      overlay.dataset.open = "false";
      const target = commandReturnFocus;
      commandReturnFocus = null;
      if (target?.isConnected && typeof target.focus === "function") target.focus({ preventScroll: true });
    }
  }
  window.ivCloseDashboardSearch = closeCommandPalette;

  function themeColorControl(definition, compact) {
    return `<label class="iv-theme-color ${compact ? "is-compact" : ""}">
      <span>${definition.label}</span>
      <span class="iv-theme-color-control">
        <input type="color" value="#000000" data-theme-token="${definition.key}" aria-label="${definition.label} color">
        <input type="text" value="#000000" maxlength="9" spellcheck="false" data-theme-hex="${definition.key}" aria-label="${definition.label} hex value">
      </span>
    </label>`;
  }

  function buildAppearanceSettingsSection() {
    const section = document.createElement("section");
    section.id = "settings-appearance-panel";
    section.className = "iv-appearance-panel";
    const groups = [...new Set(THEME_TOKEN_DEFS.map((item) => item.group))];
    const basicKeys = new Set(["accent", "page", "panel", "text", "mutedText", "critical", "warning", "healthy"]);
    const libraryGroups = ["light", "dark"];
    section.innerHTML = `
      <div class="iv-appearance-heading">
        <div><span class="iv-eyebrow">Dashboard theme</span><h3>Appearance</h3></div>
        <div class="iv-theme-scope" role="group" aria-label="Theme scope">
          <button type="button" data-theme-scope="personal">Personal</button>
          <button type="button" data-theme-scope="workspace">Workspace</button>
        </div>
      </div>
      <div class="iv-theme-presets" aria-label="Theme modes">
        ${Object.entries(THEME_PRESETS).map(([key, preset]) => `<button type="button" data-theme-preset="${key}"><span class="iv-theme-preset-swatch">${["page", "panel", "accent", "healthy"].map((token) => `<i style="background:${preset.tokens[token]}"></i>`).join("")}</span><strong>${preset.label}</strong></button>`).join("")}
        <button type="button" data-theme-preset="custom"><span class="iv-theme-preset-swatch iv-theme-custom-swatch"><i></i><i></i><i></i><i></i></span><strong>Custom</strong></button>
      </div>
      <div class="iv-theme-library" aria-label="Preset library">
        <div class="iv-theme-library-heading"><div><strong>Preset library</strong><span>Choose a polished baseline, then tune every token below.</span></div></div>
        <div class="iv-theme-library-groups">
          ${libraryGroups.map((mode) => `<section><span>${mode === "light" ? "Light presets" : "Dark presets"}</span><div>${Object.entries(THEME_LIBRARY).filter(([, preset]) => preset.mode === mode).map(([key, preset]) => `<button type="button" data-theme-library-preset="${key}"><span class="iv-theme-preset-swatch">${["page", "panel", "accent", "healthy"].map((token) => `<i style="background:${preset.tokens[token]}"></i>`).join("")}</span><strong>${preset.label}</strong></button>`).join("")}</div></section>`).join("")}
        </div>
      </div>
      <div class="iv-theme-workbench">
        <div class="iv-theme-controls">
          <div class="iv-theme-basic-grid">${THEME_TOKEN_DEFS.filter((item) => basicKeys.has(item.key)).map((item) => themeColorControl(item, true)).join("")}</div>
          <div class="iv-theme-geometry">
            <label><span>Density</span><select id="iv-theme-density"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
            <label><span>Corner radius</span><div><input id="iv-theme-radius" type="range" min="4" max="16" step="1" value="10"><output id="iv-theme-radius-value">10px</output></div></label>
            <label class="iv-theme-motion"><span>Reduce motion</span><input id="iv-theme-motion" type="checkbox"></label>
          </div>
          <details class="iv-theme-advanced">
            <summary><span><i data-lucide="sliders-horizontal" class="w-4 h-4"></i>Advanced tokens</span><i data-lucide="chevron-down" class="w-4 h-4"></i></summary>
            <div class="iv-theme-token-groups">${groups.map((group) => `<fieldset><legend>${group}</legend><div>${THEME_TOKEN_DEFS.filter((item) => item.group === group).map((item) => themeColorControl(item, false)).join("")}</div></fieldset>`).join("")}</div>
          </details>
        </div>
        <div class="iv-theme-preview-column">
          <div class="iv-theme-preview" aria-label="Theme preview">
            <div class="iv-theme-preview-sidebar"><i></i><i></i><i class="active"></i><i></i></div>
            <div class="iv-theme-preview-main">
              <div class="iv-theme-preview-top"><span>Operations</span><button type="button">Deploy</button></div>
              <div class="iv-theme-preview-kpis"><div><small>HEALTHY</small><strong>14</strong></div><div><small>WARNING</small><strong>2</strong></div><div><small>CRITICAL</small><strong>0</strong></div></div>
              <div class="iv-theme-preview-chart">${[28, 48, 35, 72, 61, 86, 68, 92].map((height, index) => `<i style="height:${height}%;--series:${index % 4}"></i>`).join("")}</div>
              <div class="iv-theme-preview-table"><span></span><span></span><span></span></div>
            </div>
          </div>
          <div id="iv-theme-contrast" class="iv-theme-contrast" aria-live="polite"></div>
        </div>
      </div>
      <div class="iv-theme-actions">
        <span id="iv-theme-save-status">Changes preview instantly</span>
        <div>
          <input id="iv-theme-import" type="file" accept="application/json,.json" hidden>
          <button type="button" class="btn-secondary" id="iv-theme-import-button"><i data-lucide="upload" class="w-4 h-4"></i>Import</button>
          <button type="button" class="btn-secondary" id="iv-theme-export"><i data-lucide="download" class="w-4 h-4"></i>Export</button>
          <button type="button" class="btn-secondary" id="iv-theme-reset"><i data-lucide="rotate-ccw" class="w-4 h-4"></i>Reset</button>
          <button type="button" class="iv-theme-save" id="iv-theme-save"><i data-lucide="save" class="w-4 h-4"></i>Save theme</button>
        </div>
      </div>`;
    bindThemeEditor(section);
    return section;
  }

  function bindThemeEditor(section) {
    section.querySelectorAll("[data-theme-preset]").forEach((button) => button.addEventListener("click", () => {
      const preset = button.dataset.themePreset;
      if (preset === "custom") applyThemeConfig({ ...activeThemeConfig, preset: "custom" }, { persist: false });
      else applyThemeConfig(presetTheme(preset), { persist: false });
      setThemeStatus(`${preset === "custom" ? "Custom" : THEME_PRESETS[preset].label} mode selected`);
    }));
    section.querySelectorAll("[data-theme-library-preset]").forEach((button) => button.addEventListener("click", () => {
      const preset = button.dataset.themeLibraryPreset;
      applyThemeConfig(presetTheme(preset), { persist: false });
      setThemeStatus(`${THEME_LIBRARY[preset].label} preset selected`);
    }));
    section.querySelectorAll("[data-theme-scope]").forEach((button) => button.addEventListener("click", async () => {
      activeThemeScope = button.dataset.themeScope;
      localStorage.setItem(THEME_SCOPE_KEY, activeThemeScope);
      if (activeThemeScope === "workspace") await loadWorkspaceTheme(true);
      else {
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || "null"); } catch (_) { saved = null; }
        if (saved) applyThemeConfig(saved, { persist: false });
      }
      syncThemeEditor();
    }));
    section.querySelectorAll("[data-theme-token]").forEach((input) => input.addEventListener("input", () => updateThemeToken(input.dataset.themeToken, input.value)));
    section.querySelectorAll("[data-theme-hex]").forEach((input) => {
      input.addEventListener("input", () => {
        if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(input.value.trim())) updateThemeToken(input.dataset.themeHex, input.value.trim());
      });
      input.addEventListener("change", () => {
        if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(input.value.trim())) syncThemeEditor();
      });
    });
    section.querySelector("#iv-theme-density").addEventListener("change", (event) => applyThemeConfig({ ...activeThemeConfig, preset: "custom", density: event.target.value }, { persist: false }));
    section.querySelector("#iv-theme-radius").addEventListener("input", (event) => applyThemeConfig({ ...activeThemeConfig, preset: "custom", radius: Number(event.target.value) }, { persist: false }));
    section.querySelector("#iv-theme-motion").addEventListener("change", (event) => applyThemeConfig({ ...activeThemeConfig, preset: "custom", reduceMotion: event.target.checked }, { persist: false }));
    section.querySelector("#iv-theme-save").addEventListener("click", saveActiveTheme);
    section.querySelector("#iv-theme-reset").addEventListener("click", () => applyThemeConfig(presetTheme(activeThemeConfig?.mode === "dark" ? "dark" : "light"), { persist: false }));
    section.querySelector("#iv-theme-export").addEventListener("click", exportTheme);
    const importInput = section.querySelector("#iv-theme-import");
    section.querySelector("#iv-theme-import-button").addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", importTheme);
    syncThemeEditor(section);
  }

  function updateThemeToken(key, color) {
    if (!activeThemeConfig || !/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(String(color))) return;
    pendingThemeTokenUpdates[key] = String(color).toLowerCase();
    if (themeTokenFrame) return;
    themeTokenFrame = requestAnimationFrame(() => {
      const updates = pendingThemeTokenUpdates;
      pendingThemeTokenUpdates = {};
      themeTokenFrame = 0;
      activeThemeConfig = {
        ...activeThemeConfig,
        preset: "custom",
        tokens: { ...activeThemeConfig.tokens, ...updates },
      };
      const root = document.documentElement;
      Object.entries(updates).forEach(([token, value]) => {
        const definition = THEME_TOKEN_DEFS.find((item) => item.key === token);
        definition?.css.forEach((property) => root.style.setProperty(property, value));
        if (token === "focus") root.style.setProperty("--focus-ring", `color-mix(in srgb, ${value} 28%, transparent)`);
        if (token === "accent") root.style.setProperty("--accent-glow", `color-mix(in srgb, ${value} 16%, transparent)`);
        if (token === "chartOne") root.style.setProperty("--chart-color", `color-mix(in srgb, ${value} 16%, transparent)`);
        if (token === "page") root.style.setProperty("--range-thumb-border", value);
      });
      const section = document.getElementById("settings-appearance-panel");
      if (section) {
        Object.entries(updates).forEach(([token, value]) => {
          section.querySelectorAll(`[data-theme-token="${token}"]`).forEach((input) => { input.value = value.slice(0, 7); });
          section.querySelectorAll(`[data-theme-hex="${token}"]`).forEach((input) => { input.value = value; });
        });
        section.querySelectorAll("[data-theme-preset]").forEach((button) => button.classList.toggle("active", button.dataset.themePreset === "custom"));
        section.querySelectorAll("[data-theme-library-preset]").forEach((button) => button.classList.remove("active"));
        if (Object.keys(updates).some((token) => ["text", "mutedText", "panel", "accentText", "accent"].includes(token))) renderThemeContrast(section);
      }
      setThemeStatus("Custom changes not saved");
      window.dispatchEvent(new CustomEvent("infraveil:themechange", { detail: activeThemeConfig }));
    });
  }

  function syncThemeEditor(section) {
    section = section || document.getElementById("settings-appearance-panel");
    if (!section || !activeThemeConfig) return;
    section.querySelectorAll("[data-theme-token]").forEach((input) => { input.value = activeThemeConfig.tokens[input.dataset.themeToken].slice(0, 7); });
    section.querySelectorAll("[data-theme-hex]").forEach((input) => { input.value = activeThemeConfig.tokens[input.dataset.themeHex]; });
    section.querySelectorAll("[data-theme-preset]").forEach((button) => {
      const active = button.dataset.themePreset === "custom"
        ? !THEME_PRESETS[activeThemeConfig.preset]
        : button.dataset.themePreset === activeThemeConfig.preset;
      button.classList.toggle("active", active);
    });
    section.querySelectorAll("[data-theme-library-preset]").forEach((button) => button.classList.toggle("active", button.dataset.themeLibraryPreset === activeThemeConfig.preset));
    section.querySelectorAll("[data-theme-scope]").forEach((button) => button.classList.toggle("active", button.dataset.themeScope === activeThemeScope));
    section.querySelector("#iv-theme-density").value = activeThemeConfig.density;
    section.querySelector("#iv-theme-radius").value = activeThemeConfig.radius;
    section.querySelector("#iv-theme-radius-value").textContent = `${activeThemeConfig.radius}px`;
    section.querySelector("#iv-theme-motion").checked = activeThemeConfig.reduceMotion;
    renderThemeContrast(section);
  }

  function hexRgb(value) {
    const match = String(value || "").match(/^#([0-9a-f]{6})/i);
    if (!match) return [0, 0, 0];
    return [0, 2, 4].map((offset) => parseInt(match[1].slice(offset, offset + 2), 16));
  }

  function contrastRatio(foreground, background) {
    const luminance = (color) => {
      const values = hexRgb(color).map((channel) => { const value = channel / 255; return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
      return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
    };
    const a = luminance(foreground), b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  function renderThemeContrast(section) {
    const host = (section || document).querySelector("#iv-theme-contrast");
    if (!host || !activeThemeConfig) return;
    const checks = [
      ["Primary text", activeThemeConfig.tokens.text, activeThemeConfig.tokens.panel, 4.5],
      ["Muted text", activeThemeConfig.tokens.mutedText, activeThemeConfig.tokens.panel, 4.5],
      ["Accent text", activeThemeConfig.tokens.accentText, activeThemeConfig.tokens.accent, 4.5],
    ].map(([label, foreground, background, minimum]) => ({ label, ratio: contrastRatio(foreground, background), minimum }));
    const failures = checks.filter((check) => check.ratio < check.minimum);
    host.dataset.state = failures.length ? "warning" : "valid";
    const markup = `<b class="iv-theme-contrast-mark" aria-hidden="true">${failures.length ? "!" : "OK"}</b><div><strong>${failures.length ? `${failures.length} contrast warning${failures.length === 1 ? "" : "s"}` : "Contrast checks passed"}</strong><span>${checks.map((check) => `${check.label} ${check.ratio.toFixed(1)}:1`).join(" / ")}</span></div>`;
    if (host.innerHTML !== markup) host.innerHTML = markup;
  }

  function setThemeStatus(message, state) {
    const node = document.getElementById("iv-theme-save-status");
    if (!node) return;
    node.textContent = message;
    node.dataset.state = state || "";
  }

  async function loadWorkspaceTheme(apply) {
    try {
      const response = await fetch("/client/api/dashboard-theme");
      if (!response.ok) throw new Error("Workspace theme unavailable");
      const data = await response.json();
      if (data.theme && apply) applyThemeConfig(data.theme, { persist: false });
      setThemeStatus(data.theme ? "Workspace theme loaded" : "No workspace theme saved");
      return data.theme;
    } catch (error) {
      setThemeStatus(error.message || "Workspace theme unavailable", "error");
      return null;
    }
  }

  function saveActiveTheme() {
    if (!activeThemeConfig) return;
    if (activeThemeScope === "personal") {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(activeThemeConfig));
      setThemeStatus("Personal theme saved", "success");
      return;
    }
    const save = async (totp) => {
      const headers = { "Content-Type": "application/json" };
      if (totp) headers["X-TOTP-Auth"] = totp;
      const response = await fetch("/client/api/dashboard-theme", { method: "POST", headers, body: JSON.stringify({ theme: activeThemeConfig }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Workspace theme could not be saved");
      setThemeStatus("Workspace theme saved", "success");
      return data;
    };
    if (typeof window.showTotpPrompt === "function") {
      window.showTotpPrompt("Save workspace dashboard theme", async (totp) => {
        try { await save(totp); if (typeof window.closeModal === "function") window.closeModal(); }
        catch (error) { setThemeStatus(error.message, "error"); if (typeof window.showToast === "function") window.showToast(error.message, "error"); }
      });
    } else save("").catch((error) => setThemeStatus(error.message, "error"));
  }

  function exportTheme() {
    const blob = new Blob([JSON.stringify(activeThemeConfig, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "infraveil-theme.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function importTheme(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed.tokens || typeof parsed.tokens !== "object") throw new Error("Theme file has no token map");
      applyThemeConfig(normalizeThemeConfig(parsed, parsed.mode === "dark" ? "dark" : "light"), { persist: false });
      setThemeStatus(`${file.name} imported`);
    } catch (error) {
      setThemeStatus(error.message || "Invalid theme file", "error");
    }
  }

  function buildSettingsNavigation() {
    const host = document.getElementById("auth-settings-content");
    if (!host || host.dataset.modernized) return;
    const profile = document.getElementById("settings-profile-panel");
    const auth = document.getElementById("settings-auth-panel");
    const trust = document.getElementById("settings-trust-panel");
    if (!profile || !auth || !trust || !host.contains(profile)) return;
    host.dataset.modernized = "true";

    const expiry = document.getElementById("expiry-warning-banner");
    const danger = document.getElementById("delete-account-section");
    const layout = document.createElement("div");
    layout.className = "iv-settings-layout";
    const nav = document.createElement("nav");
    nav.className = "iv-settings-nav";
    nav.setAttribute("aria-label", "Settings categories");
    const panel = document.createElement("div");
    panel.className = "iv-settings-panel";

    const appearance = buildAppearanceSettingsSection();
    const sections = [
      { key: "account", label: "Account", icon: "building-2", nodes: [expiry, profile, danger] },
      { key: "authentication", label: "Authentication", icon: "key-round", nodes: [auth] },
      { key: "trust", label: "Runtime reports", icon: "badge-check", nodes: [trust] },
      { key: "appearance", label: "Appearance", icon: "palette", nodes: [appearance] },
    ];
    sections.forEach((section, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.settingsKey = section.key;
      button.className = index === 0 ? "active" : "";
      button.append(icon(section.icon, "w-4 h-4"), document.createTextNode(section.label));
      button.addEventListener("click", () => selectSettingsSection(section.key));
      nav.appendChild(button);
      section.nodes.filter(Boolean).forEach((node) => {
        node.dataset.ivSettingsSection = section.key;
        if (index === 0) node.classList.add("active");
        panel.appendChild(node);
      });
    });

    const divider = document.createElement("div");
    divider.style.cssText = "height:1px;background:var(--table-border);margin:8px 4px";
    nav.appendChild(divider);
    [
      ["usage", "Usage", "activity"],
      ["integrations", "Integrations", "plug-zap"],
      ["billing", "Billing", "credit-card"],
      ["export-data", "Export data", "archive"],
      ["support", "Support", "life-buoy"],
    ].forEach(([view, label, iconName]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.append(icon(iconName, "w-4 h-4"), document.createTextNode(label));
      button.addEventListener("click", () => window.switchView(view));
      nav.appendChild(button);
    });
    layout.append(nav, panel);
    host.appendChild(layout);
    refreshIcons();
  }

  function selectSettingsSection(key) {
    document.querySelectorAll("[data-iv-settings-section]").forEach((node) => {
      node.classList.toggle("active", node.dataset.ivSettingsSection === key);
    });
    document.querySelectorAll("[data-settings-key]").forEach((button) => {
      button.classList.toggle("active", button.dataset.settingsKey === key);
    });
  }

  const localSections = window.InfraveilUI.localSections.createController({ document, icon });
  const selectLocalSection = localSections.selectSection;
  const createLocalLayout = localSections.createLayout;

  function buildDocumentationNavigation() {
    const view = document.getElementById("view-docs");
    if (!view || view.dataset.ivStructured) return;
    const source = view.querySelector(":scope > .acrylic-panel");
    const docs = source ? [...source.querySelectorAll(":scope > .doc-section")] : [];
    if (!source || docs.length < 2) return;
    view.dataset.ivStructured = "true";

    const icons = ["timer-reset", "file-json", "scroll-text", "workflow", "blocks", "brain-circuit"];
    const sections = docs.map((content, index) => {
      const heading = content.querySelector("h3");
      const label = (heading?.textContent || `Section ${index + 1}`).replace(/^\s*\d+\.\s*/, "");
      return { key: `docs-${index + 1}`, label, icon: icons[index] || "file-text", content };
    });
    const layout = createLocalLayout("Documentation sections", sections, "iv-doc-layout");
    source.querySelectorAll(":scope > hr").forEach((rule) => rule.remove());
    source.replaceWith(layout);
  }

  function buildSecurityNavigation() {
    const view = document.getElementById("view-security");
    if (!view || view.dataset.ivStructured) return;
    const tabShell = view.querySelector(":scope > .acrylic-panel");
    const buttons = tabShell ? [...tabShell.querySelectorAll(".sec-tab")] : [];
    const panels = [...view.querySelectorAll(":scope > .sec-panel")];
    if (!tabShell || buttons.length !== panels.length) return;
    view.dataset.ivStructured = "true";

    const sections = buttons.map((button, index) => ({
      key: button.id.replace("sec-tab-", ""),
      button,
      content: panels[index],
    }));
    const layout = createLocalLayout("Security policy sections", sections, "iv-security-layout");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
      });
    });
    tabShell.replaceWith(layout);
  }

  function buildPipelineNavigation() {
    const view = document.getElementById("view-pipelines");
    if (!view || view.dataset.ivStructured) return;
    const tabShell = view.querySelector(":scope > .acrylic-panel");
    const buttons = tabShell ? [...tabShell.querySelectorAll(".pipeline-tab")] : [];
    const panels = [...view.querySelectorAll(":scope > .pipeline-panel")];
    if (!tabShell || buttons.length !== panels.length) return;
    view.dataset.ivStructured = "true";

    const panelByKey = new Map(panels.map((panel) => [panel.id.replace("pipeline-panel-", ""), panel]));
    const sections = buttons.map((button) => {
      const key = button.id.replace("pipeline-tab-", "");
      return { key, button, content: panelByKey.get(key) };
    }).filter((section) => section.content);
    if (sections.length !== panels.length) return;
    const layout = createLocalLayout("Monitoring pipeline sections", sections, "iv-pipeline-layout");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
      });
    });
    tabShell.replaceWith(layout);
    const guide = document.createElement("section"); guide.className = "iv-workflow-primer";
    guide.innerHTML = `<div><span class="iv-eyebrow">Build a draft in three decisions</span><h3>What should the gateway observe and do?</h3><p>Presets and edits change this draft. They do not apply live policy until you deliberately save and approve.</p></div><ol><li><strong>Choose the target</strong><span>Select a stack and the servers or apps it applies to. Start with one test workload.</span></li><li><strong>Capture before responding</strong><span>Capture stages collect route, payload and fingerprint facts. Action stages use those facts to log, score, limit or block. Keep each dependency earlier than its consumer.</span></li><li><strong>Review, save, then verify</strong><span>Resolve validation warnings; start with observability or logging. Save through the protected flow, then check Pipeline Analytics and runtime receipts for real decisions.</span></li></ol><button type="button" class="btn-secondary" onclick="ivOpenFeatureGuide('pipelines')">Walk me through stacks, stages and safe rollout</button>`;
    layout.before(guide);
  }

  function buildTrustNavigation() {
    const view = document.getElementById("view-trust-receipts");
    if (!view || view.dataset.ivTrustStructured) return;
    const approval = document.getElementById("release-approval-panel");
    const summary = document.getElementById("trust-receipts-summary");
    const evidenceGrid = document.getElementById("trust-receipts-grid");
    const exportActions = document.getElementById("trust-export-actions");
    if (!approval || !summary || !evidenceGrid) return;
    view.dataset.ivTrustStructured = "true";

    const configure = document.createElement("section");
    configure.className = "iv-trust-configure space-y-5";
    configure.appendChild(approval);

    const evidence = document.createElement("section");
    evidence.className = "iv-trust-evidence space-y-6";
    const evidenceToolbar = document.createElement("div");
    evidenceToolbar.className = "iv-trust-evidence-toolbar";
    evidenceToolbar.innerHTML = `
      <div>
        <div class="iv-eyebrow">Workspace evidence</div>
        <h3>Review identities, continuity, and recorded actions</h3>
        <p>Start with readable assurance states, then open exact hashes and fingerprints only when you need them.</p>
      </div>`;
    if (exportActions) evidenceToolbar.appendChild(exportActions);
    evidence.append(evidenceToolbar, summary, evidenceGrid);

    const layout = createLocalLayout("Trust and receipt sections", [
      { key: "configure", label: "Connect & review", icon: "server", content: configure },
      { key: "evidence", label: "Reports & history", icon: "receipt-text", content: evidence },
    ], "iv-trust-layout");
    view.appendChild(layout);
  }

  function buildBillingNavigation() {
    const view = document.getElementById("view-billing");
    if (!view || view.dataset.ivStructured) return;
    const hero = view.firstElementChild;
    const usage = document.getElementById("billing-usage-panel");
    const diagnostics = document.getElementById("billing-diagnostics-panel");
    const capacity = document.getElementById("billing-scale-panel");
    if (!hero || !usage || !diagnostics || !capacity) return;
    view.dataset.ivStructured = "true";

    const overview = document.createElement("section");
    overview.className = "iv-billing-overview space-y-6";
    [...view.children].filter((child) => child !== hero).forEach((child) => overview.appendChild(child));

    const usageSection = document.createElement("section");
    usageSection.className = "iv-billing-usage space-y-6";
    usageSection.append(usage, diagnostics);

    const capacitySection = document.createElement("section");
    capacitySection.className = "iv-billing-capacity space-y-6";
    capacitySection.appendChild(capacity);

    const layout = createLocalLayout("Billing sections", [
      { key: "overview", label: "Plan & billing", icon: "credit-card", content: overview },
      { key: "usage", label: "Usage", icon: "activity", content: usageSection },
      { key: "capacity", label: "Capacity", icon: "gauge", content: capacitySection },
    ], "iv-billing-layout");
    view.appendChild(layout);

    ["view-usage", "view-scale"].forEach((id) => {
      const redundant = document.getElementById(id);
      if (redundant) redundant.setAttribute("aria-hidden", "true");
    });
  }

  function installConsolidatedViewRouting() {
    if (window.__ivConsolidatedRouting || typeof window.switchView !== "function") return;
    window.__ivConsolidatedRouting = true;
    const originalSwitchView = window.switchView;
    window.switchView = function switchConsolidatedView(view, ...args) {
      const billingSection = view === "usage" ? "usage" : view === "scale" ? "capacity" : null;
      const result = originalSwitchView.call(this, billingSection ? "billing" : view, ...args);
      if (billingSection) {
        selectLocalSection(document.querySelector("#view-billing .iv-local-layout"), billingSection);
      }
      return result;
    };
  }

  function normalizePageHierarchy() {
    document.querySelectorAll(".dashboard-main .view-section").forEach((view) => {
      view.classList.add("iv-structured-view");
      const header = [...view.children].find((child) => child.matches(".operator-page-header") || child.querySelector(":scope h2"));
      if (header) header.classList.add("iv-page-header");
    });
  }

  function buildPageArchitecture() {
    buildDocumentationNavigation();
    buildSecurityNavigation();
    buildPipelineNavigation();
    buildTrustNavigation();
    buildBillingNavigation();
    installConsolidatedViewRouting();
    normalizePageHierarchy();
    refreshIcons();
  }

  const manifestEditor = window.InfraveilUI.manifestEditor.createController({
    document, refreshIcons,
    publishValidation(validate) {
      const previous = Object.getOwnPropertyDescriptor(window, "validateInfraveilContract");
      window.validateInfraveilContract = validate;
      return () => {
        if (window.validateInfraveilContract !== validate) return;
        if (previous) Object.defineProperty(window, "validateInfraveilContract", previous);
        else delete window.validateInfraveilContract;
      };
    },
  });
  const buildManifestEditorExperience = manifestEditor.mount;

  function bindGlobalKeys() {
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const editing = target && /INPUT|TEXTAREA|SELECT/.test(target.tagName);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette();
      } else if (!editing && event.key === "/") {
        event.preventDefault();
        openCommandPalette();
      }
    });
  }

  function analyticsEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function chartEmpty(message) {
    return `<div class="iv-chart-empty">${analyticsEscape(message)}</div>`;
  }

  function recordTime(record) {
    const value = record?.time || record?.timestamp || record?.created_at || record?.ts;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  function makeBuckets(records, count = 18) {
    const timed = records
      .map((record, index) => ({ record, index, time: recordTime(record) }))
      .filter((item) => item.time !== null)
      .sort((a, b) => a.time - b.time);
    if (!timed.length) {
      const size = Math.max(1, Math.ceil(records.length / count));
      return Array.from({ length: Math.min(count, Math.max(1, Math.ceil(records.length / size))) }, (_, index) => ({
        label: `${index * size + 1}`,
        records: records.slice(index * size, (index + 1) * size),
      }));
    }
    const min = timed[0].time;
    const max = timed[timed.length - 1].time;
    const span = Math.max(1, max - min);
    const bucketCount = Math.min(count, Math.max(4, Math.ceil(Math.sqrt(timed.length) * 2)));
    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
      label: new Date(min + (span * index) / Math.max(1, bucketCount - 1)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }),
      records: [],
    }));
    timed.forEach((item) => {
      const index = Math.min(bucketCount - 1, Math.floor(((item.time - min) / span) * bucketCount));
      buckets[index].records.push(item.record);
    });
    return buckets;
  }

  function pathFromValues(values, width, height, left = 30, top = 12, right = 10, bottom = 24) {
    const maximum = Math.max(1, ...values);
    const usableWidth = width - left - right;
    const usableHeight = height - top - bottom;
    return values.map((value, index) => {
      const x = left + (usableWidth * index) / Math.max(1, values.length - 1);
      const y = top + usableHeight - (Number(value || 0) / maximum) * usableHeight;
      return { x, y };
    });
  }

  function linePath(points) {
    return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  }

  function areaPath(points, baseline) {
    if (!points.length) return "";
    return `${linePath(points)} L${points[points.length - 1].x.toFixed(1)},${baseline} L${points[0].x.toFixed(1)},${baseline} Z`;
  }

  function timelineMarkup(buckets, options = {}) {
    if (!buckets.some((bucket) => bucket.records.length)) return chartEmpty(options.empty || "No events in the current slice.");
    const width = 760;
    const height = 184;
    const volume = buckets.map((bucket) => bucket.records.length);
    const risk = buckets.map((bucket) => {
      const scores = bucket.records.map((record) => Number(record.risk_score ?? record.stack_risk_score ?? 0));
      return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
    });
    const interventions = buckets.map((bucket) => bucket.records.filter((record) => {
      const decision = String(record.final_decision || record.decision || record.stack_decision || "unknown").toLowerCase();
      return ["block", "deceive", "ratelimit"].includes(decision) || record.isError || record.isWarn || record.isSecurity;
    }).length);
    const volumePoints = pathFromValues(volume, width, height);
    const riskPoints = pathFromValues(risk, width, height);
    const baseline = height - 24;
    const maxInterventions = Math.max(1, ...interventions);
    const barWidth = Math.max(3, Math.min(12, 620 / Math.max(1, buckets.length) - 3));
    const grid = [0, 1, 2, 3].map((index) => {
      const y = 12 + ((height - 36) * index) / 3;
      return `<line class="iv-chart-grid" x1="30" y1="${y}" x2="750" y2="${y}"/>`;
    }).join("");
    const bars = volumePoints.map((point, index) => {
      const barHeight = (interventions[index] / maxInterventions) * 42;
      return `<rect class="iv-chart-intervention" x="${(point.x - barWidth / 2).toFixed(1)}" y="${(baseline - barHeight).toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="1"/>`;
    }).join("");
    const labels = [0, Math.floor((buckets.length - 1) / 2), buckets.length - 1]
      .filter((value, index, array) => array.indexOf(value) === index)
      .map((index) => `<text class="iv-chart-axis" x="${volumePoints[index].x.toFixed(1)}" y="181" text-anchor="${index === 0 ? "start" : index === buckets.length - 1 ? "end" : "middle"}">${analyticsEscape(buckets[index].label)}</text>`)
      .join("");
    return `<svg class="iv-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${analyticsEscape(options.label || "Activity timeline")}">${grid}<path class="iv-chart-area" d="${areaPath(volumePoints, baseline)}"/>${bars}<path class="iv-chart-line" d="${linePath(volumePoints)}"/>${options.showRisk === false ? "" : `<path class="iv-chart-risk-line" d="${linePath(riskPoints)}"/>`}${labels}</svg><div class="iv-chart-legend"><span><i style="background:var(--chart-one)"></i>${analyticsEscape(options.volumeLabel || "Requests")}</span><span><i style="background:var(--signal-critical)"></i>${analyticsEscape(options.actionLabel || "Interventions")}</span>${options.showRisk === false ? "" : '<span><i style="background:var(--signal-warning)"></i>Average risk</span>'}</div>`;
  }

  function rankedBars(entries, emptyMessage) {
    if (!entries.length) return chartEmpty(emptyMessage);
    const maximum = Math.max(1, ...entries.map((entry) => entry.value));
    return `<div class="iv-ranked-bars">${entries.slice(0, 7).map((entry) => `<div class="iv-ranked-row"><div class="iv-ranked-meta"><strong title="${analyticsEscape(entry.label)}">${analyticsEscape(entry.label)}</strong><span>${analyticsEscape(entry.detail ?? entry.value)}</span></div><div class="iv-ranked-track"><div class="iv-ranked-fill ${entry.tone || ""}" style="width:${Math.max(3, (entry.value / maximum) * 100).toFixed(1)}%"></div></div></div>`).join("")}</div>`;
  }

  function donutMarkup(entries, total, emptyMessage) {
    if (!total) return chartEmpty(emptyMessage);
    let cursor = 0;
    const gradient = entries.map((entry) => {
      const start = cursor;
      cursor += (entry.value / total) * 100;
      return `${entry.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    }).join(",");
    return `<div class="iv-donut-layout"><div class="iv-donut" style="background:conic-gradient(${gradient})"><div class="iv-donut-center"><strong>${total}</strong><span>events</span></div></div><div class="iv-ranked-bars">${entries.filter((entry) => entry.value).map((entry) => `<div class="iv-ranked-meta"><strong><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${entry.color};margin-right:7px"></i>${analyticsEscape(entry.label)}</strong><span>${entry.value} · ${((entry.value / total) * 100).toFixed(0)}%</span></div>`).join("")}</div></div>`;
  }

  function histogramMarkup(records) {
    if (!records.length) return chartEmpty("No risk scores in the current slice.");
    const bands = [
      { label: "0-19", min: 0, max: 19 },
      { label: "20-39", min: 20, max: 39 },
      { label: "40-59", min: 40, max: 59 },
      { label: "60-79", min: 60, max: 79 },
      { label: "80+", min: 80, max: Infinity },
    ];
    const counts = bands.map((band) => records.filter((record) => {
      const score = Number(record.risk_score ?? record.stack_risk_score ?? 0);
      return score >= band.min && score <= band.max;
    }).length);
    const maximum = Math.max(1, ...counts);
    return `<div class="iv-histogram">${bands.map((band, index) => `<div class="iv-histogram-bin"><div class="iv-histogram-bar-wrap"><div class="iv-histogram-bar" style="height:${Math.max(3, (counts[index] / maximum) * 100).toFixed(1)}%"></div></div><strong>${counts[index]}</strong><span>${band.label}</span></div>`).join("")}</div>`;
  }

  function matrixMarkup(records) {
    if (!records.length) return chartEmpty("No stack or node activity in the current slice.");
    const stacks = [...new Set(records.map((record) => record.stack_name || "Default stack"))].slice(0, 6);
    const nodes = [...new Set(records.map((record) => record.agent_id || "Unknown node"))].slice(0, 7);
    const values = stacks.flatMap((stack) => nodes.map((node) => records.filter((record) => (record.stack_name || "Default stack") === stack && (record.agent_id || "Unknown node") === node).length));
    const maximum = Math.max(1, ...values);
    const columns = `96px repeat(${nodes.length}, minmax(34px, 1fr))`;
    const header = `<div></div>${nodes.map((node) => `<div class="iv-matrix-label" title="${analyticsEscape(node)}">${analyticsEscape((window.agentNames && window.agentNames[node]) || node).slice(0, 9)}</div>`).join("")}`;
    const rows = stacks.map((stack) => `<div class="iv-matrix-label" title="${analyticsEscape(stack)}">${analyticsEscape(stack)}</div>${nodes.map((node) => {
      const value = records.filter((record) => (record.stack_name || "Default stack") === stack && (record.agent_id || "Unknown node") === node).length;
      const alpha = value ? 0.14 + (value / maximum) * 0.72 : 0;
      return `<div class="iv-matrix-cell" style="background:rgba(37,99,235,${alpha.toFixed(2)})">${value || ""}</div>`;
    }).join("")}`).join("");
    return `<div class="iv-matrix-wrap"><div class="iv-matrix" style="grid-template-columns:${columns}">${header}${rows}</div></div>`;
  }

  function finalPipelineDecision(record) {
    return String(record.final_decision || record.decision || record.stack_decision || "unknown").toLowerCase().replace(/[_ -]/g, "");
  }
  window.ivFinalPipelineDecision = finalPipelineDecision;
  window.ivSetTelemetryScopeNotice = (view, shown, total) => {
    const root = document.getElementById(`view-${view}`);
    if (!root) return;
    let notice = document.getElementById(`iv-scope-note-${view}`);
    if (!notice && total > shown) { notice = document.createElement("p"); notice.id = `iv-scope-note-${view}`; notice.className = "iv-telemetry-scope-note"; root.prepend(notice); }
    if (notice) { notice.hidden = total <= shown; notice.textContent = `Raw telemetry is paged: up to ${shown} of ${total} selected workloads are included per request. Fleet inventory and aggregate views retain the full selection.`; }
  };
  window.ivRenderSecurityOverview = function renderSecurityOverview(summary) {
    const level = document.getElementById("sec-threat-level"), bar = document.getElementById("sec-threat-bar");
    if (!level) return;
    const ready = summary?.available === true;
    level.textContent = ready ? summary.pressure : "Data unavailable";
    level.style.color = ready && summary.pressure === "Broad source activity" ? "var(--signal-warning)" : "var(--text-main)";
    if (bar) { bar.style.width = ready ? summary.events ? summary.sources >= 10 ? "65%" : "20%" : "0%" : "0%"; bar.style.background = "var(--accent)"; }
    const denied = document.getElementById("sec-ov-blocked");
    if (denied) denied.textContent = ready && summary.outcome_coverage > 0 ? Number(summary.denied).toLocaleString() : "—";
    let detail = document.getElementById("sec-overview-detail");
    if (!detail) { detail = document.createElement("div"); detail.id = "sec-overview-detail"; level.parentElement?.appendChild(detail); }
    detail.className = "iv-security-activity";
    const number = (value) => Number(value || 0).toLocaleString();
    const markup = ready ? `<dl class="iv-security-metrics"><div><dt>Events · 15 min</dt><dd>${number(summary.events)}</dd></div><div><dt>Sources</dt><dd>${number(summary.sources)}</dd></div><div><dt>Workloads affected</dt><dd>${number(summary.affected_workloads)}</dd></div><div><dt>Request rate</dt><dd>${number(summary.current_rpm)} / min</dd></div></dl><details><summary>Baseline &amp; coverage</summary><p>${summary.baseline_ready ? `Normal rate: ${number(summary.baseline_rpm)} / min · ${analyticsEscape(summary.traffic_change || "No change reported")}.` : "Learning the normal rate: insufficient baseline history."}</p><p>Final outcomes: ${number(summary.outcome_coverage)} of ${number(summary.requests)} observed requests.</p><p>Traffic growth and event counts alone do not establish an attack or service impact.</p></details>` : "No current report. Activity is unknown, not zero.";
    if (detail.dataset.rendered !== markup) { const open = detail.querySelector("details")?.open; detail.innerHTML = markup; detail.dataset.rendered = markup; if (open && detail.querySelector("details")) detail.querySelector("details").open = true; }
  };
  function pipelineRequestRows(records) {
    const seen = new Set();
    return (Array.isArray(records) ? records : []).filter((record) => {
      const key = record.request_id ? `${record.agent_id}:${record.request_id}` : JSON.stringify([record.agent_id, record.time, record.method, record.path, record.ip]);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  let ivIssuePollInFlight = false;
  let ivIssuePollingStopped = false;
  window.ivRenderIssueIndicator = function renderIssueIndicator(payload) {
    const button = document.getElementById("iv-issue-indicator");
    if (!button) return;
    const count = Number(payload.total ?? payload.summary?.open_incidents ?? 0);
    const available = payload.available !== false && ("issues" in payload || !!payload.summary);
    const label = !available ? "Fleet health unavailable" : count ? `Fleet: ${count} ${count === 1 ? "issue" : "issues"}` : "No active fleet issues";
    const text = button.querySelector(".iv-issue-label"), badge = button.querySelector(".iv-issue-count");
    if (text && text.textContent !== label) text.textContent = label;
    if (badge) badge.textContent = !available ? "?" : count > 999 ? "999+" : String(count);
    button.dataset.state = !available ? "unknown" : count ? "attention" : "healthy";
    button.setAttribute("aria-label", `${label}. Open incidents.`);
    button.title = payload.issues?.[0] ? `${payload.issues[0].name}: ${payload.issues[0].cause}` : label;
  };
  async function ivPollIssues() {
    if (ivIssuePollInFlight || ivIssuePollingStopped || document.hidden || window.ivDashboardAccess?.paused) return;
    ivIssuePollInFlight = true;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch("/client/api/issues", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
      if (!response.ok) { if ([401, 403, 402, 423].includes(response.status)) ivIssuePollingStopped = true; window.ivRenderIssueIndicator({ available: false }); return; }
      window.ivRenderIssueIndicator(await response.json());
    } catch (_) { window.ivRenderIssueIndicator({ available: false }); }
    finally { clearTimeout(timer); ivIssuePollInFlight = false; }
  }
  const liveDom = window.InfraveilUI.liveDom;
  window.ivLiveContent = liveDom.liveContent;
  window.ivStableLogRows = liveDom.stableLogRows;
  window.ivEnhanceControlTrace = function enhanceControlTrace(row, trace) {
    const detail = row.querySelector('[id^="inet-detail-"]');
    if (!detail) return;
    const section = (label, value) => `<section><h4>${analyticsEscape(label)}</h4><pre class="operator-code-block">${analyticsEscape(value == null ? "Not captured for this historical entry." : JSON.stringify(value, null, 2))}</pre></section>`;
    detail.innerHTML = `<div class="iv-control-trace-meta">${analyticsEscape(trace.trace_id || "Historical trace")} · HTTP ${analyticsEscape(trace.response_status ?? "unknown")} · ${analyticsEscape(trace.duration_ms ?? "unknown")} ms · ${trace.auth_verified ? "Machine authentication verified" : "Authentication result not recorded"}</div><div class="iv-control-trace-grid">${section("Request input · redacted", trace.payload)}${section("Response output · redacted", trace.response)}${section("Request headers", trace.headers || {})}${section("Response headers", trace.response_headers)}${section("Observed stages", trace.stages)}${section("Capture & limits", trace.capture)}${section("Request context", { path: trace.path, query: trace.query, ip: trace.ip })}</div>`;
  };
  window.renderPipelineVisualizations = function renderPipelineVisualizations(records) {
    const executions = Array.isArray(records) ? records : [];
    const data = pipelineRequestRows(records);
    const set = (id, html) => { const node = document.getElementById(id); if (node) node.innerHTML = html; };
    set("pipeline-traffic-risk-chart", timelineMarkup(makeBuckets(data), { label: "Pipeline traffic and risk timeline" }));
    const decisions = [
      { label: "Allow", key: "allow", color: "var(--signal-healthy)" },
      { label: "Block", key: "block", color: "var(--signal-critical)" },
      { label: "Rate limit", key: "ratelimit", color: "var(--signal-warning)" },
      { label: "Deceive", key: "deceive", color: "var(--chart-four)" },
      { label: "Unknown", key: "unknown", color: "var(--text-subtle)" },
    ].map((entry) => ({ ...entry, value: data.filter((record) => finalPipelineDecision(record) === entry.key).length }));
    set("pipeline-decision-chart", donutMarkup(decisions, data.length, "No pipeline decisions in the current slice."));
    set("pipeline-risk-chart", histogramMarkup(data));
    const routeMap = new Map();
    data.forEach((record) => {
      const route = record.path || record.endpoint || "/";
      const current = routeMap.get(route) || { count: 0, interventions: 0 };
      current.count += 1;
      if (["block", "ratelimit", "deceive"].includes(finalPipelineDecision(record))) current.interventions += 1;
      routeMap.set(route, current);
    });
    set("pipeline-route-chart", rankedBars([...routeMap.entries()].map(([label, value]) => ({ label, value: value.count, detail: `${value.count} req · ${value.interventions} acted`, tone: value.interventions ? "is-warn" : "" })).sort((a, b) => b.value - a.value), "No route activity in the current slice."));
    set("pipeline-matrix-chart", matrixMarkup(executions));
    const acted = data.filter((record) => ["block", "ratelimit", "deceive"].includes(finalPipelineDecision(record))).length;
    const scored = data.filter((record) => Number(record.risk_score ?? record.stack_risk_score ?? 0) > 0).length;
    const stacks = new Set(executions.map((record) => record.stack_name).filter(Boolean)).size;
    set("pipeline-flow-chart", data.length ? `<div class="iv-flow"><div class="iv-flow-node"><span>Ingress</span><strong>${data.length}</strong><small>requests observed</small></div><div class="iv-flow-node"><span>Scored</span><strong>${scored}</strong><small>requests with positive risk</small></div><div class="iv-flow-node"><span>Stacks</span><strong>${stacks}</strong><small>observed decision paths</small></div><div class="iv-flow-node"><span>Intervened</span><strong>${acted}</strong><small>blocked, limited, or deceived</small></div></div>` : chartEmpty("No request flow has been observed yet."));
    refreshIcons();
  };

  window.renderRuntimeVisualizations = function renderRuntimeVisualizations(records) {
    const data = Array.isArray(records) ? records : [];
    const set = (id, html) => { const node = document.getElementById(id); if (node) node.innerHTML = html; };
    set("runtime-activity-chart", timelineMarkup(makeBuckets(data), { label: "Runtime log activity timeline", volumeLabel: "Log lines", actionLabel: "Attention signals", showRisk: false, empty: "No runtime output in the current slice." }));
    const severity = [
      { label: "Info", color: "var(--signal-info)", value: data.filter((record) => !record.isError && !record.isWarn && !record.isSecurity && !record.isDebug).length },
      { label: "Warning", color: "var(--signal-warning)", value: data.filter((record) => record.isWarn).length },
      { label: "Error", color: "var(--signal-critical)", value: data.filter((record) => record.isError).length },
      { label: "Security", color: "var(--signal-healthy)", value: data.filter((record) => record.isSecurity).length },
      { label: "Debug", color: "var(--chart-four)", value: data.filter((record) => record.isDebug).length },
    ];
    set("runtime-severity-chart", donutMarkup(severity, data.length, "No severity data in the current slice."));
    const nodes = new Map();
    data.forEach((record) => {
      const id = record.agent_id || record.displayName || "Unknown node";
      nodes.set(id, (nodes.get(id) || 0) + 1);
    });
    set("runtime-node-chart", rankedBars([...nodes.entries()].map(([id, value]) => ({ label: recordNodeLabel(id), value, detail: `${value} lines` })).sort((a, b) => b.value - a.value), "No node activity in the current slice."));
    refreshIcons();
  };

  let fleetScope = null;
  let fleetTopologyView = { x: 0, y: 0, width: 900, height: 370 };
  let fleetTopologyPayload = null;

  window.getFleetAgentScope = () => fleetScope?.ids || null;
  window.getFleetScopeLabel = () => fleetScope?.label || "";

  function fleetStat(label, value) {
    return `<div class="iv-fleet-stat"><strong>${analyticsEscape(value)}</strong><span>${analyticsEscape(label)}</span></div>`;
  }

  function fleetTimelineMarkup(points) {
    const rows = Array.isArray(points) ? points : [];
    if (!rows.length || !rows.some((row) => row.runtime || row.security || row.traffic)) {
      return chartEmpty("The rollup window is ready. New fleet signals will appear here without scanning raw logs.");
    }
    const width = 760, height = 184, baseline = 156;
    const series = [
      { key: "traffic", className: "iv-chart-line" },
      { key: "runtime", className: "iv-chart-risk-line" },
      { key: "security", className: "iv-fleet-security-line" },
    ];
    const maximum = Math.max(1, ...rows.flatMap((row) => series.map((item) => Number(row[item.key] || 0))));
    const paths = series.map((item) => {
      const values = rows.map((row) => Number(row[item.key] || 0));
      const points = values.map((value, index) => ({
        x: 30 + (720 * index) / Math.max(1, values.length - 1),
        y: 12 + (value / maximum ? (1 - value / maximum) * 132 : 132),
      }));
      return `<path class="${item.className}" d="${linePath(points)}"/>`;
    }).join("");
    const grid = [0, 1, 2, 3].map((index) => `<line class="iv-chart-grid" x1="30" y1="${12 + index * 44}" x2="750" y2="${12 + index * 44}"/>`).join("");
    const first = new Date(rows[0].start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const last = new Date(rows[rows.length - 1].start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `<svg class="iv-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Fleet activity timeline">${grid}${paths}<text class="iv-chart-axis" x="30" y="181">${analyticsEscape(first)}</text><text class="iv-chart-axis" x="750" y="181" text-anchor="end">${analyticsEscape(last)}</text></svg><div class="iv-chart-legend"><span><i style="background:var(--chart-one)"></i>Requests</span><span><i style="background:var(--signal-warning)"></i>Runtime</span><span><i style="background:var(--signal-critical)"></i>Security</span></div>`;
  }

  function clusterMarkup(items, kind) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) {
      const message = kind === "workload" ? "No workload pressure in this window." : "No repeated runtime causes in this window.";
      return `<div class="iv-fleet-empty"><i data-lucide="circle-check"></i><span>${analyticsEscape(message)}</span></div>`;
    }
    return rows.map((item, index) => {
      const label = item.sample || item.key || "Unknown cluster";
      return `<button type="button" class="iv-cluster-row is-${analyticsEscape(item.severity || "info")}" data-fleet-cluster="${kind}" data-fleet-index="${index}" title="${analyticsEscape(label)}"><span>${analyticsEscape(label)}</span><strong>${Number(item.count || 0).toLocaleString()}</strong></button>`;
    }).join("");
  }

  function topologyGroups(topology) {
    if (Array.isArray(topology?.groups?.hosts) && Array.isArray(topology?.groups?.services)) {
      return { hosts: topology.groups.hosts.slice(0, 12), services: topology.groups.services.slice(0, 24) };
    }
    const nodes = Array.isArray(topology?.nodes) ? topology.nodes : [];
    const hosts = nodes.filter((node) => node.kind === "host");
    const services = nodes.filter((node) => node.kind === "service");
    const regionByHost = new Map(hosts.map((host) => [host.entity_id, host.region || "global"]));
    const labelByHost = new Map(hosts.map((host) => [host.entity_id, host.label || host.entity_id]));
    const largeFleet = hosts.length > 10;
    const hostGroups = new Map();
    hosts.forEach((host) => {
      const key = largeFleet ? `${host.region || "global"}|${host.status || "unknown"}` : host.entity_id;
      const group = hostGroups.get(key) || { key, label: largeFleet ? (host.region || "global") : host.label, status: host.status, hosts: [], services: [] };
      group.hosts.push(host.entity_id);
      hostGroups.set(key, group);
    });
    const serviceGroups = new Map();
    services.forEach((service) => {
      const region = regionByHost.get(service.host_id) || "unplaced";
      const anchor = largeFleet ? region : (service.host_id || "unplaced");
      const key = `${anchor}|${service.runtime || "runtime"}|${service.status || "unknown"}`;
      const hostLabel = largeFleet ? region : (labelByHost.get(service.host_id) || "unplaced");
      const group = serviceGroups.get(key) || { key, label: `${hostLabel} / ${service.runtime || "runtime"}`, region, anchor, runtime: service.runtime || "runtime", status: service.status, services: [] };
      group.services.push(service.entity_id);
      serviceGroups.set(key, group);
    });
    return { hosts: [...hostGroups.values()].slice(0, 12), services: [...serviceGroups.values()].sort((a, b) => b.services.length - a.services.length).slice(0, 24) };
  }

  function topologyMarkup(topology) {
    const groups = topologyGroups(topology);
    if (!groups.hosts.length && !groups.services.length) return chartEmpty("Connect a launcher and workloads to build the runtime topology.");
    const facets = topology?.facets || {};
    const regions = Array.isArray(facets.regions) && facets.regions.length
      ? facets.regions
      : [{ key: "global", hosts: groups.hosts.reduce((sum, item) => sum + item.hosts.length, 0), services: groups.services.reduce((sum, item) => sum + item.services.length, 0), capacity: 0, online_hosts: 0, unhealthy_hosts: 0, runtimes: [] }];
    const runtimes = Array.isArray(facets.runtimes) ? facets.runtimes : [];
    const totalHosts = regions.reduce((sum, item) => sum + Number(item.hosts || 0), 0);
    const totalServices = regions.reduce((sum, item) => sum + Number(item.services || 0), 0);
    const totalCapacity = Number(facets.capacity || 0);
    const onlineHosts = Number((facets.host_statuses || {}).online || 0);
    const unplaced = Number(facets.unplaced_services || 0);
    const health = totalHosts ? Math.round((onlineHosts / totalHosts) * 100) : 0;
    const regionCards = regions.map((region) => {
      const hosts = Number(region.hosts || 0), services = Number(region.services || 0), capacity = Number(region.capacity || 0), unhealthy = Number(region.unhealthy_hosts || 0);
      const utilization = capacity ? Math.min(100, Math.round((services / capacity) * 100)) : 0;
      const runtimeBadges = (region.runtimes || []).slice(0, 3).map((item) => `<span>${analyticsEscape(item.key)} <strong>${Number(item.count || 0).toLocaleString()}</strong></span>`).join("");
      return `<button type="button" class="iv-region-card${unhealthy ? " has-risk" : ""}" data-fleet-region="${analyticsEscape(region.key)}"><span class="iv-region-title"><strong>${analyticsEscape(region.key)}</strong><i>${hosts.toLocaleString()} host${hosts === 1 ? "" : "s"}</i></span><span class="iv-region-load"><b style="width:${utilization}%"></b></span><span class="iv-region-metrics"><span><b>${services.toLocaleString()}</b> workloads</span><span><b>${capacity.toLocaleString()}</b> capacity</span><span class="${unhealthy ? "is-risk" : ""}"><b>${unhealthy.toLocaleString()}</b> unhealthy</span></span><span class="iv-region-runtimes">${runtimeBadges || "<span>No runtime mix yet</span>"}</span></button>`;
    }).join("");
    const runtimeMax = Math.max(1, ...runtimes.map((item) => Number(item.count || 0)));
    const runtimeRows = runtimes.length ? runtimes.map((item) => {
      const count = Number(item.count || 0);
      return `<button type="button" class="iv-runtime-density-row" data-fleet-runtime="${analyticsEscape(item.key)}"><span>${analyticsEscape(item.key)}</span><i><b style="width:${Math.max(3, (count / runtimeMax) * 100)}%"></b></i><strong>${count.toLocaleString()}</strong></button>`;
    }).join("") : `<div class="iv-density-empty">Runtime density appears as workloads connect.</div>`;
    return `<div class="iv-fleet-command-strip"><div><span>Fleet health</span><strong>${health}%</strong><small>${onlineHosts.toLocaleString()} of ${totalHosts.toLocaleString()} hosts online</small></div><div><span>Placement</span><strong>${totalServices.toLocaleString()}</strong><small>${unplaced.toLocaleString()} unplaced workload${unplaced === 1 ? "" : "s"}</small></div><div><span>Capacity</span><strong>${totalCapacity ? Math.round((totalServices / totalCapacity) * 100) : 0}%</strong><small>${totalServices.toLocaleString()} of ${totalCapacity.toLocaleString()} slots used</small></div><div><span>Regions</span><strong>${regions.length.toLocaleString()}</strong><small>click a region to isolate evidence</small></div></div><div class="iv-fleet-distribution-layout"><div class="iv-region-grid">${regionCards}</div><aside class="iv-runtime-density"><div class="iv-density-heading"><span>Runtime density</span><small>Workloads grouped across the fleet</small></div>${runtimeRows}</aside></div>`;
  }

  function bindFleetInteractions(intelligence) {
    const root = document.getElementById("runtime-fleet-intelligence");
    if (!root) return;
    root.querySelectorAll("[data-fleet-cluster]").forEach((button) => button.addEventListener("click", () => {
      const kind = button.dataset.fleetCluster;
      const index = Number(button.dataset.fleetIndex || 0);
      const collection = kind === "workload" ? intelligence.clusters?.workloads : intelligence.clusters?.fingerprints;
      const item = collection?.[index];
      if (!item) return;
      if (kind === "workload") focusFleetScope([item.key], item.sample || item.key);
      else {
        fleetScope = null;
        const search = document.getElementById("console-search");
        if (search) search.value = String(item.sample || "").replace(/<[^>]+>/g, "").slice(0, 80);
        if (typeof window.renderConsole === "function") window.renderConsole();
      }
    }));
    const groups = topologyGroups(intelligence.topology);
    root.querySelectorAll("[data-topology-kind]").forEach((node) => node.addEventListener("click", () => {
      const collection = node.dataset.topologyKind === "host" ? groups.hosts : groups.services;
      const item = collection.find((group) => group.key === node.dataset.topologyKey);
      if (!item) return;
      const ids = item.services || intelligence.topology.nodes.filter((service) => service.kind === "service" && item.hosts.includes(service.host_id)).map((service) => service.entity_id);
      focusFleetScope(ids, item.label);
    }));
    root.querySelectorAll("[data-fleet-region]").forEach((button) => button.addEventListener("click", () => {
      const region = button.dataset.fleetRegion;
      const nodes = Array.isArray(intelligence.topology?.nodes) ? intelligence.topology.nodes : [];
      const hostIds = new Set(nodes.filter((item) => item.kind === "host" && String(item.region || "global") === region).map((item) => item.entity_id));
      let ids = nodes.filter((item) => item.kind === "service" && hostIds.has(item.host_id)).map((item) => item.entity_id);
      if (!ids.length) ids = (intelligence.topology?.groups?.services || []).filter((item) => String(item.region || "unplaced") === region).flatMap((item) => item.services || []);
      focusFleetScope(ids, `${region} region`);
    }));
    root.querySelectorAll("[data-fleet-runtime]").forEach((button) => button.addEventListener("click", () => {
      const runtime = button.dataset.fleetRuntime;
      const nodes = Array.isArray(intelligence.topology?.nodes) ? intelligence.topology.nodes : [];
      let ids = nodes.filter((item) => item.kind === "service" && String(item.runtime || "runtime") === runtime).map((item) => item.entity_id);
      if (!ids.length) ids = (intelligence.topology?.groups?.services || []).filter((item) => String(item.runtime || "runtime") === runtime).flatMap((item) => item.services || []);
      focusFleetScope(ids, `${runtime} runtime`);
    }));
  }

  async function focusFleetScope(ids, label) {
    fleetScope = { ids: new Set((ids || []).filter(Boolean)), label: label || "Selected cluster" };
    const selection = document.getElementById("runtime-fleet-selection");
    if (selection) selection.innerHTML = `<span>${analyticsEscape(fleetScope.label)} · ${fleetScope.ids.size.toLocaleString()} workload${fleetScope.ids.size === 1 ? "" : "s"}</span><button type="button" onclick="resetFleetTopology()">Clear scope</button>`;
    if (fleetScope.ids.size) {
      try {
        const response = await fetch(`/client/api/console?agent_ids=${encodeURIComponent([...fleetScope.ids].slice(0, 50).join(","))}`, { credentials: "same-origin" });
        if (response.ok && typeof window.renderConsole === "function") window.renderConsole(await response.json());
      } catch (_) {
        if (typeof window.renderConsole === "function") window.renderConsole();
      }
    } else if (typeof window.renderConsole === "function") window.renderConsole();
  }

  window.resetFleetTopology = function resetFleetTopology() {
    fleetScope = null;
    fleetTopologyView = { x: 0, y: 0, width: 900, height: 370 };
    const selection = document.getElementById("runtime-fleet-selection");
    if (selection) selection.textContent = "Entire fleet selected";
    if (fleetTopologyPayload) window.renderFleetIntelligence(fleetTopologyPayload);
    if (typeof window.renderConsole === "function") window.renderConsole();
  };

  function bindTopologyPanZoom() {
    const host = document.getElementById("runtime-fleet-topology");
    const svg = host?.querySelector("svg");
    if (!host || !svg) return;
    let drag = null;
    host.onpointerdown = (event) => { if (event.target.closest?.(".iv-topology-node")) return; drag = { x: event.clientX, y: event.clientY, view: { ...fleetTopologyView } }; host.setPointerCapture(event.pointerId); };
    host.onpointermove = (event) => { if (!drag) return; const scale = fleetTopologyView.width / Math.max(1, host.clientWidth); fleetTopologyView.x = drag.view.x - (event.clientX - drag.x) * scale; fleetTopologyView.y = drag.view.y - (event.clientY - drag.y) * scale; svg.setAttribute("viewBox", `${fleetTopologyView.x} ${fleetTopologyView.y} ${fleetTopologyView.width} ${fleetTopologyView.height}`); };
    host.onpointerup = () => { drag = null; };
    host.onwheel = (event) => { event.preventDefault(); const factor = event.deltaY > 0 ? 1.12 : .88; fleetTopologyView.width = Math.min(1400, Math.max(420, fleetTopologyView.width * factor)); fleetTopologyView.height = fleetTopologyView.width * (370 / 900); svg.setAttribute("viewBox", `${fleetTopologyView.x} ${fleetTopologyView.y} ${fleetTopologyView.width} ${fleetTopologyView.height}`); };
  }

  window.renderFleetIntelligence = function renderFleetIntelligence(intelligence) {
    if (!intelligence) return;
    fleetTopologyPayload = intelligence;
    const summary = intelligence.summary || {};
    const facets = intelligence.topology?.facets || {};
    const regionCount = Array.isArray(facets.regions) ? facets.regions.length : 0;
    const totalEntities = Number(summary.hosts || 0) + Number(summary.services || 0);
    const healthyPercent = totalEntities ? Math.max(0, Math.round(((totalEntities - Number(summary.unhealthy_entities || 0)) / totalEntities) * 100)) : 0;
    const totalSignals = Number(summary.runtime_events || 0) + Number(summary.security_events || 0) + Number(summary.requests || 0);
    const set = (id, html) => { const node = document.getElementById(id); if (node) node.innerHTML = html; };
    set("runtime-fleet-summary", [
      fleetStat("Hosts", Number(summary.hosts || 0).toLocaleString()),
      fleetStat("Workloads", Number(summary.services || 0).toLocaleString()),
      fleetStat("Regions", Number(regionCount || 0).toLocaleString()),
      fleetStat("Healthy", `${healthyPercent}%`),
      fleetStat("Fleet signals", totalSignals.toLocaleString()),
      fleetStat("Rows compressed", `${Number(summary.compression_ratio || 1).toLocaleString()}×`),
    ].join(""));
    set("runtime-fleet-topology", topologyMarkup(intelligence.topology));
    set("runtime-fingerprint-clusters", clusterMarkup(intelligence.clusters?.fingerprints, "fingerprint"));
    set("runtime-workload-clusters", clusterMarkup(intelligence.clusters?.workloads, "workload"));
    set("runtime-fleet-timeline", fleetTimelineMarkup(intelligence.timeline));
    const windowLabel = document.getElementById("runtime-fleet-window");
    if (windowLabel) windowLabel.textContent = `Last ${Number(intelligence.window_minutes || 60)} minutes`;
    bindFleetInteractions(intelligence);
    refreshIcons();
  };

  /* Operations Home owns fleet scope. Every other operational surface consumes it. */
  const fleetCanvas = window.InfraveilUI.fleetCanvas.createRenderer({
    dom: { document: () => document },
    platform: { devicePixelRatio: () => window.devicePixelRatio, computedStyle: (...args) => getComputedStyle(...args) },
  });
  const fleetNavigator = window.InfraveilUI.fleetNavigator.createController({
    dom: { document: () => document },
    viewport: { width: () => window.innerWidth, height: () => window.innerHeight },
    storage: { getItem: (key) => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
    timing: {
      frame: (callback) => requestAnimationFrame(callback),
      after: (callback, delay) => setTimeout(callback, delay),
      cancel: (id) => clearTimeout(id),
      observeResize: (callback, target) => new ResizeObserver(callback).observe(target),
    },
    events: { addEventListener: (name, callback) => window.addEventListener(name, callback) },
    status: {
      operations: () => typeof _opsState !== "undefined" ? _opsState : null,
      latest: () => window.__latestStatusPayload,
      publishTopology: (payload) => { fleetTopologyPayload = payload; },
    },
    selection: { sync: (readKind, ids) => {
    try {
      if (typeof fleetSelectionState.selectedWorkloadIds !== "undefined") {
        fleetSelectionState.selectedWorkloadIds = new Set(readKind() === "agent" ? ids : []);
        typeof updateWorkloadBulkActions === "function" && updateWorkloadBulkActions();
      }
      if (typeof fleetSelectionState.selectedLauncherHostIds !== "undefined") {
        fleetSelectionState.selectedLauncherHostIds = new Set(readKind() === "launcher" ? ids : []);
        typeof saveStoredLauncherSelection === "function" && saveStoredLauncherSelection();
        typeof updateLauncherBulkActions === "function" && updateLauncherBulkActions();
        typeof applyLauncherSelectionDomState === "function" && applyLauncherSelectionDomState();
      }
    } catch (_) {}
    } },
    scope: {
      project: (value) => { fleetScope = value; },
      projection: () => fleetScope,
      publishChange: (scope) => {
        window.__ivFleetScopeGeneration = (window.__ivFleetScopeGeneration || 0) + 1;
        window.dispatchEvent(new CustomEvent("iv:fleet-scope-change", { detail: { ...scope } }));
      },
      apply: (scope) => window.applyGlobalFleetScope?.(scope),
    },
    evidence: {
      available: () => window.ivWorkloadRuntimeEvidence,
      read: (...args) => window.ivWorkloadRuntimeEvidence(...args),
      optional: (...args) => window.ivWorkloadRuntimeEvidence?.(...args),
    },
    liveContent: (...args) => window.ivLiveContent(...args),
    transport: { request: (...args) => fetch(...args) },
    auth: {
      isDemo: () => typeof APP_STATE !== "undefined" && APP_STATE.demo_mode,
      hasPrompt: () => typeof showTotpPrompt === "function",
      prompt: (...args) => showTotpPrompt(...args),
    },
    notifications: { available: () => typeof showToast === "function", show: (...args) => showToast(...args) },
    refresh: { available: () => typeof updateDashboardData === "function", request: (...args) => updateDashboardData(...args) },
    actions: {
      canCommandLaunchers: () => typeof sendSelectedLauncherCommand === "function",
      commandLaunchers: (...args) => sendSelectedLauncherCommand(...args),
      canCommandWorkloads: () => typeof sendSelectedNodeCommand === "function",
      commandWorkloads: (...args) => sendSelectedNodeCommand(...args),
      canOpenContract: () => typeof requestEditorAccess === "function",
      openContract: (...args) => requestEditorAccess(...args),
      canOpenLogs: () => typeof openAgentLogs === "function",
      openLogs: (...args) => openAgentLogs(...args),
      canSwitchView: () => typeof switchView === "function",
      switchView: (...args) => switchView(...args),
      canSelectHost: () => typeof selectLauncherHost === "function",
      selectHost: (...args) => selectLauncherHost(...args),
    },
    dispatch: {
      ivFleetOpenBackupSelector: (...args) => window.ivFleetOpenBackupSelector(...args),
      ivFleetOpenSelectedInstall: (...args) => window.ivFleetOpenSelectedInstall(...args),
      ivFleetOpenSelectedContract: (...args) => window.ivFleetOpenSelectedContract(...args),
      ivFleetOpenSelectedLogs: (...args) => window.ivFleetOpenSelectedLogs(...args),
      ivFleetRunSelection: (...args) => window.ivFleetRunSelection(...args),
      openLauncherInstallDialog: (...args) => window.openLauncherInstallDialog(...args),
      closeLauncherInstallDialog: (...args) => window.closeLauncherInstallDialog(...args),
      renderFleetIntelligence: (...args) => window.renderFleetIntelligence(...args),
    },
    guides: {
      closeFeature: (...args) => closeFeatureGuide(...args),
      closeDemo: (...args) => closeDemoGuide(...args),
      hasGlobalClose: () => typeof window.ivCloseGuides === "function",
      closeGlobal: (...args) => window.ivCloseGuides(...args),
    },
    icons: { refresh: () => refreshIcons() },
    text: { escape: (...args) => analyticsEscape(...args) },
    renderer: fleetCanvas,
  });
  fleetNavigator.restoreScope();

  function ivCloseFleetMenu() { return fleetNavigator.closeMenu(); }
  window.getFleetScope = () => fleetNavigator.getFleetScope();
  window.getFleetScopeLabel = () => fleetNavigator.getFleetScopeLabel();
  window.getFleetAgentScope = () => fleetNavigator.getFleetAgentScope();
  window.setGlobalFleetScope = fleetNavigator.setGlobalFleetScope;
  window.resetFleetTopology = fleetNavigator.resetFleetTopology;
  window.ivFleetSetBackupServer = (backupId) => fleetNavigator.ivFleetSetBackupServer(backupId);
  window.ivFleetOpenBackupSelector = () => fleetNavigator.ivFleetOpenBackupSelector();
  window.ivFleetInvokeAction = (action) => fleetNavigator.ivFleetInvokeAction(action);
  window.ivFleetRunSelection = (command) => fleetNavigator.ivFleetRunSelection(command);
  window.ivClearFleetScope = () => fleetNavigator.ivClearFleetScope();
  window.ivFleetOpenSelectedInstall = () => fleetNavigator.ivFleetOpenSelectedInstall();
  window.ivFleetOpenSelectedContract = () => fleetNavigator.ivFleetOpenSelectedContract();
  window.ivFleetOpenSelectedLogs = () => fleetNavigator.ivFleetOpenSelectedLogs();
  window.openLauncherInstallDialog = (hostId) => fleetNavigator.openLauncherInstallDialog(hostId);
  window.closeLauncherInstallDialog = () => fleetNavigator.closeLauncherInstallDialog();
  window.ivOpenLauncherRowMenu = (event, hostId) => fleetNavigator.ivOpenLauncherRowMenu(event, hostId);
  window.renderFleetIntelligence = function renderFleetNavigator(intelligence) { return fleetNavigator.renderFleetIntelligence(intelligence); };

  let ivMcpRefreshPromise = null, ivMcpBusy = false, ivMcpCopyBusy = false, ivMcpCommandExpires = 0, ivMcpExpiryTimer = null;
  let ivMcpLiveDemo = false;
  window.ivMcpActionPolicyChanged = () => {
    const control = document.getElementById("mcp-scope")?.value === "control";
    const mode = document.getElementById("mcp-action-mode"), consent = document.getElementById("mcp-auto-consent"), row = document.getElementById("mcp-auto-consent-row");
    if (mode) { mode.disabled = !control || ivMcpBusy; if (!control) mode.value = "confirm"; }
    if (row) row.hidden = !control || mode?.value !== "automatic";
    if (consent) consent.checked = false;
    window.ivMcpOptionsChanged?.();
    ivMcpSetBusy(ivMcpBusy);
  };
  let ivMcpContextEpoch = 0, ivMcpCommandEpoch = 0, ivMcpMetadataRevision = 0;
  let ivMcpCommandWorkspace = "";
  let ivMcpCommandConnectionId = "";
  let ivMcpSetupCommands = null;
  let ivMcpSetupSnapshot = null;
  let ivMcpOnboardingStage = "start", ivMcpOnboardingConnection = null;
  const ivMcpRequests = new Set();

  function ivMcpSetStage(stage, focus = false) {
    ivMcpOnboardingStage = stage;
    const panels = { start: "mcp-intro", client: "mcp-client-stage", permissions: "mcp-permissions-stage" };
    Object.entries(panels).forEach(([key, id]) => { const panel = document.getElementById(id); if (panel) panel.hidden = key !== stage; });
    const steps = ["client", "permissions", "connect", "verify"], index = steps.indexOf(stage);
    steps.forEach((key, position) => {
      const item = document.getElementById(`mcp-progress-${key}`); if (!item) return;
      if (position === index) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
      item.dataset.complete = String(index >= 0 && position < index);
    });
    const verification = document.getElementById("mcp-verification"); if (verification) verification.hidden = !ivMcpOnboardingConnection;
    if (focus) document.getElementById(`mcp-${stage}-heading`)?.focus();
  }

  function ivMcpAccessSummary() {
    const summary = document.getElementById("mcp-access-summary"); if (!summary) return;
    const client = ivMcpClientLabel(document.getElementById("mcp-client")?.value) || "Selected client";
    const platform = document.getElementById("mcp-platform")?.value === "windows" ? "Windows" : "Linux / macOS";
    const access = document.getElementById("mcp-scope")?.value === "control" ? "read + control" : "read only";
    const days = document.getElementById("mcp-days")?.value || "30";
    summary.textContent = `${client} on ${platform} · ${access} · ${days} days. Your existing account approval is required before access is issued.`;
  }

  window.ivMcpStartOnboarding = () => {
    if (ivMcpBusy || ivMcpCopyBusy) return;
    const previous = !!ivMcpOnboardingConnection;
    ivMcpClearCommand(); ivMcpOnboardingConnection = null;
    const consent = document.getElementById("mcp-auto-consent"); if (consent) consent.checked = false;
    ivMcpSetStage("client", true); ivMcpSetBusy(false);
    ivMcpMessage(previous ? "The previous connection remains in Your connections. Review or revoke it separately before creating additional access." : "Choose the AI client and the computer where it runs.");
  };
  window.ivMcpNextStep = () => {
    if (ivMcpBusy || ivMcpCopyBusy) return;
    if (!["codex", "claude", "cursor", "manual"].includes(document.getElementById("mcp-client")?.value) || !["windows", "posix"].includes(document.getElementById("mcp-platform")?.value)) { ivMcpMessage("Choose a supported client and computer before continuing."); return; }
    ivMcpAccessSummary(); ivMcpSetStage("permissions", true);
    ivMcpMessage(ivMcpIsDesktopPreview() ? "This file has no authenticated workspace. Review the choices here; real access must be issued by the running application." : "Review permissions, then approve the new connection using your existing account factor.");
  };
  window.ivMcpBackStep = () => { if (!ivMcpBusy && !ivMcpCopyBusy) ivMcpSetStage("client", true); };
  window.ivMcpCheckConnection = async () => {
    if (!ivMcpOnboardingConnection || ivMcpBusy || ivMcpCopyBusy) return false;
    ivMcpSetStage("verify");
    return window.ivMcpRefresh(true);
  };

  function ivMcpVerifiedRead(connection, serverNow) {
    const stamp = connection?.last_successful_read_at;
    return connection?.active === true && connection.revoked === false && Number.isFinite(stamp) && stamp > 0 && Number.isFinite(serverNow) && stamp <= serverNow && Number.isFinite(connection.created_at) && stamp >= connection.created_at && Number.isFinite(connection.expires_at) && connection.expires_at > serverNow;
  }

  function ivMcpUpdateVerification(data) {
    const target = ivMcpOnboardingConnection;
    if (!target || target.workspace !== String(window.APP_CONFIG?.client_id || "")) return;
    const row = (Array.isArray(data.connections) ? data.connections : []).find(connection => connection.connection_id === target.connectionId);
    const title = document.getElementById("mcp-verification-title"), detail = document.getElementById("mcp-verification-detail");
    let heading = "Connection status unavailable", description = "The server did not return this connection. No successful setup check can be confirmed.";
    const now = data.server_now;
    if (row?.revoked || (Number.isFinite(now) && Number.isFinite(row?.expires_at) && row.expires_at <= now)) {
      ivMcpClearCommand(); ivMcpSetStage("verify");
      heading = row.revoked ? "Connection revoked" : "Connection expired";
      description = "This connection no longer grants access. Start a new setup only if you want to reconnect the agent.";
    } else if (ivMcpVerifiedRead(row, now)) {
      ivMcpClearCommand(); ivMcpSetStage("verify");
      heading = "Read check verified";
      description = `This connection completed an authenticated workspace_status read at ${new Date(row.last_successful_read_at * 1000).toLocaleString()}. This confirms that read at that time; it is not a live heartbeat or a runtime health guarantee.`;
      const finalStep = document.getElementById("mcp-progress-verify"); if (finalStep) finalStep.dataset.complete = "true";
    } else if (row?.active === true) {
      ivMcpClearCommand(); ivMcpSetStage("verify");
      heading = "Setup activated · read check pending";
      description = "Reload or reconnect your AI client if needed. Ask the agent to list Infraveil tools and run workspace_status, then check this connection again. Installation and tool discovery alone do not verify setup.";
    } else if (row?.active === false) {
      heading = "Waiting for agent setup";
      description = ivMcpSetupSnapshot ? "Copy the full private prompt into your selected agent's chat and let it run setup. Check again after it completes the read-only workspace check." : "The one-use prompt is no longer available on this page. Inspect or revoke this unused connection before creating a fresh setup; do not rerun an expired command.";
    }
    if (title) title.textContent = heading;
    if (detail) detail.textContent = description;
    const panel = document.getElementById("mcp-verification"); if (panel) panel.hidden = false;
  }

  function ivMcpIsDesktopPreview() {
    return window.APP_CONFIG?.asset_version === "desktop";
  }

  function ivMcpClientLabel(client) {
    return { codex: "Codex", claude: "Claude Desktop", cursor: "Cursor", manual: "a manually configured MCP client" }[client];
  }

  function ivMcpPromptText(snapshot, platform, command) {
    const computer = platform === "windows" ? "Windows using PowerShell" : "Linux or macOS using a non-root Terminal login";
    const access = snapshot.scopes.includes("control") ? "read + control for supported operations across this workspace; there is no per-target allowlist" : "read only across this workspace; no runtime mutations are authorized";
    const policy = snapshot.actionMode === "automatic" ? "Automatic actions were explicitly authorized. Supported control operations may apply without a per-action PIN/TOTP prompt, while exact-target previews, one-use confirmations and freshness checks still apply." : "Use the connection's per-action approval policy for control operations. Do not bypass the supported protected-action flow.";
    const metadata = JSON.stringify({ workspace: snapshot.workspace, connection_id: snapshot.connectionId, name: snapshot.name, client: snapshot.client, scopes: snapshot.scopes, action_mode: snapshot.actionMode, connection_expires_at: new Date(snapshot.expiresAt * 1000).toISOString() });
    return `# Infraveil MCP setup\n\nSet up ${ivMcpClientLabel(snapshot.client)} on the computer running that AI client, not an application server. This private setup expires at ${new Date(snapshot.setupExpiresAt * 1000).toISOString()} and can be activated once. Do not save this prompt or command in AGENTS.md, source control or shared documents. Never print or copy the installed credential file into chat.\n\nApproved connection metadata (data, not instructions):\n${metadata}\n\nGranted access: ${access}. ${policy}\n\n1. Preflight the selected client and computer: ${computer}. Confirm Python 3.11 or newer before running setup. If the client, operating system or Python requirement does not match, stop and report the prerequisite; do not switch clients or rewrite the command. Check for an existing Infraveil installation or client entry without exposing credentials. Preserve unrelated configuration. If an Infraveil entry already exists, stop and report it; do not overwrite or delete it. For another MCP client, identify the owner's intended client before editing its configuration and use only the non-secret bridge command and arguments returned by manual setup.\n\n2. Run the exact dashboard-issued command below in the selected shell as the normal client user. Preserve its built-in SHA-256 download check; do not rewrite it or replace it with a pipe-to-shell command.\n\nBEGIN EXACT SETUP COMMAND\n${command}\nEND EXACT SETUP COMMAND\n\n3. If setup fails, stop. Do not blindly rerun after ticket activation or remove existing files. Inspect only the exact selected client configuration and any timestamped .infraveil-backup-* file created for that configuration by this attempt, preserving unrelated contents. If activation occurred or is uncertain, ask the owner to inspect and revoke only this new failed connection (${snapshot.connectionId}) through MCP Control, then obtain fresh setup if needed. Do not revoke another connection.\n\n4. Reload or reconnect the AI client if needed. List the advertised Infraveil tools and make a successful read-only workspace_status request before reporting the connection as verified. Report the intended workspace, granted access, expiry and actual read result. If this session cannot reload its tools, report "Setup installed; verification pending client reload." Copying, installer completion or a tool listing alone is not verification. Do not restart, deploy, update or make any runtime mutation just to test connectivity.\n\n5. Keep all later operations within this workspace grant and the server's configured action policy. Use exact-target previews, one-use confirmations and current revisions for supported changes. Billing, authentication, release-signing keys and separate customer/hardware release approvals remain outside this grant. Never ask for a PIN, TOTP, cookie, private signing key or browser WebAuthn marker in chat, and never replay a browser marker as MCP approval. Use the existing supported protected-action flow or stop if it is unavailable.`;
  }

  function ivMcpRequireWorkspace() {
    if (!ivMcpIsDesktopPreview()) return;
    ivMcpClearCommand();
    const note = document.getElementById("mcp-preview-note"); if (note) note.hidden = false;
    const connections = document.getElementById("mcp-connections"); if (connections) connections.textContent = "Connect to your signed-in workspace to load real connections.";
    const tools = document.getElementById("mcp-tools"); if (tools) tools.textContent = "Connect to your workspace to load its tool catalogue.";
    ivMcpSetBusy(false);
    ivMcpMessage("No workspace is connected. Setup and copying require an authenticated workspace.");
  }

  window.ivMcpOptionsChanged = () => {
    ivMcpAccessSummary();
    if (ivMcpIsDesktopPreview()) return;
    if (ivMcpSetupSnapshot || ivMcpSetupCommands) {
      ivMcpClearCommand();
      ivMcpMessage("Connection options changed. The previous prompt was cleared; inspect or revoke its unused connection before creating another.");
    }
  };

  function ivMcpMessage(message) {
    const node = document.getElementById("mcp-status"); if (node) node.textContent = message;
  }

  function ivMcpSetBusy(busy) {
    ivMcpBusy = busy;
    const preview = ivMcpIsDesktopPreview();
    const editingBlocked = busy || ivMcpCopyBusy || (!preview && !demoGuideCanNavigate());
    const blocked = preview || editingBlocked;
    const create = document.getElementById("mcp-create");
    if (create) {
      create.disabled = blocked;
      create.textContent = preview ? "Authenticated workspace required" : "Approve and get setup prompt";
      create.classList.toggle("btn-primary", !preview && !ivMcpSetupSnapshot);
      create.classList.toggle("btn-secondary", preview || !!ivMcpSetupSnapshot);
    }
    ["mcp-name", "mcp-scope", "mcp-days", "mcp-platform", "mcp-client", "mcp-action-mode", "mcp-auto-consent", "mcp-next", "mcp-back"].forEach((id) => { const field = document.getElementById(id); if (field) field.disabled = editingBlocked; });
    ["mcp-start", "mcp-another"].forEach((id) => { const button = document.getElementById(id); if (button) button.disabled = busy || ivMcpCopyBusy; });
    ["mcp-check", "mcp-refresh"].forEach((id) => { const button = document.getElementById(id); if (button) button.disabled = blocked; });
    const copy = document.getElementById("mcp-copy");
    if (copy) { copy.textContent = "Copy setup prompt"; copy.disabled = blocked || !ivMcpSetupSnapshot || !ivMcpSetupCommands || !ivMcpCommandExpires || performance.now() >= ivMcpCommandExpires; }
    const control = document.getElementById("mcp-scope")?.value === "control";
    const approvalRow = document.getElementById("mcp-action-row"), authHint = document.getElementById("mcp-auth-hint");
    if (approvalRow) approvalRow.hidden = !control;
    if (authHint) authHint.hidden = !control;
    const actionMode = document.getElementById("mcp-action-mode");
    if (actionMode) actionMode.disabled = editingBlocked || !control;
    const consent = document.getElementById("mcp-auto-consent");
    if (consent) consent.disabled = editingBlocked || actionMode?.value !== "automatic" || document.getElementById("mcp-scope")?.value !== "control";
    document.querySelectorAll("[data-mcp-revoke]").forEach((button) => { button.disabled = blocked || button.dataset.revoked === "true"; });
  }

  function ivMcpClearCommand() {
    clearTimeout(ivMcpExpiryTimer); ivMcpExpiryTimer = null; ivMcpCommandExpires = 0;
    ivMcpCommandEpoch += 1; ivMcpSetupCommands = null; ivMcpSetupSnapshot = null; ivMcpCommandWorkspace = ""; ivMcpCommandConnectionId = "";
    const command = document.getElementById("mcp-setup-command"); if (command) command.value = "";
    const prompt = document.getElementById("mcp-setup-prompt"); if (prompt) prompt.value = "";
    const setup = document.getElementById("mcp-setup"); if (setup) setup.hidden = true;
    ivMcpSetBusy(ivMcpBusy);
  }

  function ivMcpInvalidateContext() {
    ivMcpContextEpoch += 1;
    ivMcpRequests.forEach((controller) => controller.abort()); ivMcpRequests.clear();
    ivMcpRefreshPromise = null;
    ivMcpOnboardingConnection = null; ivMcpSetStage("start");
    ivMcpClearCommand(); ivMcpCopyBusy = false; ivMcpSetBusy(false);
  }

  window.ivMcpChoosePlatform = () => {
    if (ivMcpIsDesktopPreview()) return;
    const platform = document.getElementById("mcp-platform")?.value;
    if (!ivMcpSetupCommands || !ivMcpSetupSnapshot) return;
    if (!demoGuideCanNavigate() || ivMcpCommandWorkspace !== String(window.APP_CONFIG?.client_id || "") || performance.now() >= ivMcpCommandExpires) { ivMcpClearCommand(); ivMcpMessage("Setup command expired or workspace access changed."); return; }
    const command = ivMcpSetupCommands[platform];
    if (!command) { ivMcpClearCommand(); ivMcpMessage("A setup command for that platform is unavailable. Generate a fresh command."); return; }
    ivMcpCommandEpoch += 1;
    document.getElementById("mcp-setup-command").value = command;
    document.getElementById("mcp-setup-prompt").value = ivMcpPromptText(ivMcpSetupSnapshot, platform, command);
    const expiry = document.getElementById("mcp-command-expiry");
    if (expiry) expiry.textContent = `Private, one-use setup expires in up to ${Math.ceil((ivMcpCommandExpires - performance.now()) / 1000)} seconds. Use ${platform === "windows" ? "PowerShell" : "a non-root Terminal login"} on the AI client's computer. Connection expires ${new Date(ivMcpSetupSnapshot.expiresAt * 1000).toLocaleString()}.`;
  };

  async function ivMcpRequest(path, body = undefined) {
    if (ivMcpIsDesktopPreview()) throw new Error("Live MCP actions are unavailable in this Desktop preview.");
    if (!demoGuideCanNavigate()) throw new Error("Resolve workspace access before managing MCP connections.");
    const epoch = ivMcpContextEpoch, workspace = String(window.APP_CONFIG?.client_id || ""), started = performance.now();
    if (!workspace) throw new Error("Workspace identity is unavailable. Reload before managing MCP connections.");
    const controller = new AbortController(); ivMcpRequests.add(controller);
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 12000);
    try {
    const response = await window.fetch(path, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store", signal: controller.signal,
      headers: { Accept: "application/json", "X-Infraveil-Workspace-ID": workspace, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json().catch(() => ({}));
    if (controller.signal.aborted || epoch !== ivMcpContextEpoch || workspace !== String(window.APP_CONFIG?.client_id || "") || !demoGuideCanNavigate()) throw new Error("MCP request is no longer current. No old result will be displayed.");
    if (!response.ok) {
      const message = data?.error || (response.status === 409 ? "The active workspace or MCP connection changed. Reload before managing AI access." : `MCP request failed (HTTP ${response.status}).`);
      if (response.status === 409) { ivMcpClearCommand(); ivMcpMessage(message); }
      throw new Error(message);
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("The MCP server returned an invalid response.");
    if (String(data.client_id || "") !== workspace) { ivMcpClearCommand(); throw new Error("MCP workspace identity did not match this page. Reload the correct workspace before trying again."); }
    const elapsed = performance.now() - started;
    if (!Number.isFinite(elapsed) || elapsed < 0) throw new Error("Request timing could not be verified. Generate a fresh command.");
    Object.defineProperty(data, "ivRequestElapsedMs", { value: elapsed });
    return data;
    } catch (error) {
      if (timedOut && epoch === ivMcpContextEpoch) throw new Error("MCP request timed out. Inspect connections before retrying; no late command will be displayed.");
      throw error;
    } finally { clearTimeout(timeout); ivMcpRequests.delete(controller); }
  }

  function ivMcpRender(data) {
    if (ivMcpIsDesktopPreview()) { ivMcpRequireWorkspace(); return; }
    const container = document.getElementById("mcp-connections"), tools = document.getElementById("mcp-tools");
    if (!container || !tools) return;
    ivMcpLiveDemo = data.capabilities?.live_demo === true;
    const authHint = document.getElementById("mcp-auth-hint");
    if (authHint) authHint.textContent = ivMcpLiveDemo ? "Live demo workspace: no account PIN is needed. Operations remain scoped to this demo, and exact-change previews still apply." : "Existing connections keep their approval policy. Creating automatic access requires your existing account factor once.";
    const confirmLabel = document.getElementById("mcp-action-mode")?.querySelector?.('option[value="confirm"]');
    if (confirmLabel) confirmLabel.textContent = ivMcpLiveDemo ? "Ask me to approve each demo action — no PIN needed" : "Ask for my PIN or authenticator on actions";
    const connections = Array.isArray(data.connections) ? data.connections : [];
    container.replaceChildren();
    if (!connections.length) { const empty = document.createElement("p"); empty.textContent = "No MCP connections yet. Create one when you are ready."; container.appendChild(empty); }
    connections.forEach((connection) => {
      const row = document.createElement("article"); row.className = "iv-mcp-connection";
      const title = document.createElement("strong"); title.textContent = String(connection.name || "AI client");
      const details = document.createElement("p");
      const stamp = (value) => { const date = typeof value === "number" ? new Date(value * 1000) : new Date(value); return value && Number.isFinite(date.getTime()) ? date.toLocaleString() : "Not reported"; };
      const expiresAt = typeof connection.expires_at === "number" ? connection.expires_at * 1000 : Date.parse(connection.expires_at);
      const state = connection.revoked ? "Revoked" : Number.isFinite(data.server_now) ? (Number.isFinite(expiresAt) && expiresAt <= data.server_now * 1000 ? "Expired" : ivMcpVerifiedRead(connection, data.server_now) ? "Read verified" : connection.active === true ? "Activated" : connection.active === false ? "Setup pending" : "Status unavailable") : Number.isFinite(expiresAt) && expiresAt <= Date.now() ? "Expired" : connection.active === true ? "Activated" : connection.active === false ? "Setup pending" : "Status unavailable";
      details.textContent = `${state} · ${(Array.isArray(connection.scopes) ? connection.scopes : []).join(" + ")} · ${connection.action_mode === "automatic" ? "Automatic actions enabled" : "Per-action approval"} · Expires ${stamp(connection.expires_at)} · Last use ${stamp(connection.last_used || connection.last_used_at)}`;
      if (state === "Read verified") details.textContent += ` · Successful workspace read ${stamp(connection.last_successful_read_at)}`;
      const revoke = document.createElement("button"); revoke.type = "button"; revoke.className = "btn-secondary"; revoke.textContent = "Revoke";
      revoke.dataset.mcpRevoke = "true"; revoke.dataset.revoked = String(!!connection.revoked);
      revoke.disabled = !!connection.revoked || ivMcpBusy || !demoGuideCanNavigate();
      revoke.addEventListener("click", () => window.ivMcpRevoke(String(connection.id || connection.connection_id || ""), String(connection.name || "AI client")));
      row.append(title, details, revoke); container.appendChild(row);
    });
    tools.replaceChildren();
    (Array.isArray(data.tools) ? data.tools : []).forEach((tool) => {
      const row = document.createElement("article"); row.className = "iv-mcp-tool";
      const name = document.createElement("strong"); name.textContent = String(tool.name || "Tool");
      const detail = document.createElement("p"); detail.textContent = String(tool.description || "Read this tool's input schema in your MCP client before use.");
      const scope = document.createElement("span"); scope.className = "iv-mcp-tool-scope";
      scope.textContent = tool.write === true ? "Control permission required" : tool.write === false ? "Read permission" : "Permission not reported";
      row.append(name, detail, scope); tools.appendChild(row);
    });
    if (!tools.children.length) { const empty = document.createElement("p"); empty.textContent = "No tool catalogue returned. Refresh or check workspace permissions."; tools.appendChild(empty); }
    ivMcpUpdateVerification(data);
  }

  window.ivMcpRefresh = (force = false) => {
    if (ivMcpIsDesktopPreview()) { ivMcpRequireWorkspace(); return Promise.resolve(false); }
    if (ivMcpRefreshPromise) return force ? ivMcpRefreshPromise.then(() => window.ivMcpRefresh()) : ivMcpRefreshPromise;
    if (!demoGuideCanNavigate()) { ivMcpMessage("MCP controls are paused until workspace access is restored."); return Promise.resolve(false); }
    const epoch = ivMcpContextEpoch, revision = ivMcpMetadataRevision;
    const tracked = ivMcpRequest("/client/api/mcp/connections").then((data) => {
      if (epoch !== ivMcpContextEpoch || revision !== ivMcpMetadataRevision) return false;
      ivMcpRender(data); ivMcpMessage("Connections refreshed. Last use is a recorded request, not a live client heartbeat."); return true;
    }).catch((error) => { if (epoch === ivMcpContextEpoch && revision === ivMcpMetadataRevision) ivMcpMessage(`${error.message} Previously displayed data may be stale.`); return false; }).finally(() => { if (ivMcpRefreshPromise === tracked) ivMcpRefreshPromise = null; });
    ivMcpRefreshPromise = tracked;
    return tracked;
  };

  window.ivMcpCreateConnection = () => {
    if (ivMcpIsDesktopPreview()) { ivMcpRequireWorkspace(); return; }
    const actionMode = document.getElementById("mcp-action-mode")?.value || "confirm";
    const allowAutomatic = document.getElementById("mcp-auto-consent")?.checked === true;
    if (actionMode === "automatic" && !allowAutomatic) { ivMcpMessage("Confirm the automatic-execution permission before creating this connection."); return; }
    if (ivMcpBusy || ivMcpCopyBusy || !demoGuideCanNavigate()) return;
    const name = String(document.getElementById("mcp-name")?.value || "").trim();
    const mode = document.getElementById("mcp-scope")?.value;
    const days = Number(document.getElementById("mcp-days")?.value);
    const platform = document.getElementById("mcp-platform")?.value || "windows";
    const client = document.getElementById("mcp-client")?.value || "codex";
    const epoch = ivMcpContextEpoch, workspace = String(window.APP_CONFIG?.client_id || "");
    if (!name || name.length > 80 || !["read", "control"].includes(mode) || !["windows", "posix"].includes(platform) || !["codex", "claude", "cursor", "manual"].includes(client) || !Number.isInteger(days) || days < 1 || days > 90) {
      ivMcpMessage("Enter a connection name and choose a valid scope and lifetime."); return;
    }
    if (typeof showTotpPrompt !== "function") { ivMcpMessage("Protected-action approval is unavailable. Reload and try again."); return; }
    const clientLabel = ivMcpClientLabel(client);
    const requestApproval = ivMcpLiveDemo ? (_label, callback) => callback("") : showTotpPrompt;
    requestApproval(`Create ${mode === "control" ? "read + control" : "read-only"} MCP connection: ${name} for ${clientLabel} (${platform === "windows" ? "Windows PowerShell" : "Linux/macOS Terminal"})`, async (totp) => {
      if (ivMcpBusy || ivMcpCopyBusy || epoch !== ivMcpContextEpoch || workspace !== String(window.APP_CONFIG?.client_id || "") || !demoGuideCanNavigate()) return;
      if (actionMode !== (document.getElementById("mcp-action-mode")?.value || "confirm") || allowAutomatic !== (document.getElementById("mcp-auto-consent")?.checked === true) || name !== String(document.getElementById("mcp-name")?.value || "").trim() || mode !== document.getElementById("mcp-scope")?.value || days !== Number(document.getElementById("mcp-days")?.value) || platform !== (document.getElementById("mcp-platform")?.value || "windows") || client !== (document.getElementById("mcp-client")?.value || "codex")) { ivMcpMessage("Connection options changed during approval. Review them and request a new command."); return; }
      ivMcpSetBusy(true);
      ivMcpClearCommand();
      try {
        const data = await ivMcpRequest("/client/api/mcp/connections", { name, client, scopes: mode === "control" ? ["read", "control"] : ["read"], action_mode: actionMode, allow_automatic: allowAutomatic, days, totp });
        ivMcpMetadataRevision += 1;
        const serverNow = Number(data.server_now), expiresAt = Number(data.expires_at), advertised = Number(data.expires_in);
        if (!Number.isFinite(serverNow) || serverNow <= 0 || !Number.isFinite(expiresAt) || !Number.isFinite(advertised) || advertised <= 0) throw new Error("Setup expiry could not be verified. Inspect connections and generate a fresh command.");
        const remainingMs = Math.min(300000, advertised * 1000, (expiresAt - serverNow) * 1000) - data.ivRequestElapsedMs;
        if (!Number.isFinite(remainingMs) || remainingMs <= 0) throw new Error("The setup command expired before it arrived. Inspect connections and generate a fresh command.");
        const variants = data.setup_commands;
        if (!variants || typeof variants !== "object" || typeof variants[platform] !== "string" || !variants[platform].trim()) throw new Error("No setup command for the selected platform was returned. Inspect connections before retrying.");
        const connection = data.connection;
        const connectionId = String(connection?.connection_id || connection?.id || "");
        if (!connectionId) throw new Error("The setup command was not bound to a connection. Inspect connections before retrying.");
        const scopes = mode === "control" ? ["control", "read"] : ["read"];
        if (connection.client !== client || connection.name !== name || connection.action_mode !== actionMode || !Array.isArray(connection.scopes) || [...connection.scopes].sort().join("\n") !== scopes.join("\n") || !Number.isFinite(connection.expires_at) || connection.expires_at <= serverNow || connection.revoked !== false || connection.active !== false) throw new Error("The issued connection did not match the approved options. Inspect connections before retrying.");
        const usableMs = Math.min(remainingMs, (connection.expires_at - serverNow) * 1000 - data.ivRequestElapsedMs);
        if (usableMs <= 0) throw new Error("The connection expired before setup arrived. Inspect connections before retrying.");
        ivMcpSetupSnapshot = Object.freeze({ workspace, connectionId, name: connection.name, client: connection.client, scopes: Object.freeze([...connection.scopes]), actionMode: connection.action_mode, expiresAt: connection.expires_at, setupExpiresAt: Math.min(expiresAt, connection.expires_at, serverNow + advertised, serverNow + 300) });
        ivMcpCommandExpires = performance.now() + usableMs;
        ivMcpCommandWorkspace = workspace;
        ivMcpCommandConnectionId = connectionId;
        ivMcpOnboardingConnection = Object.freeze({ workspace, connectionId });
        ivMcpSetupCommands = { windows: typeof variants.windows === "string" ? variants.windows : "", posix: typeof variants.posix === "string" ? variants.posix : "" };
        window.ivMcpChoosePlatform();
        document.getElementById("mcp-setup").hidden = false;
        ivMcpSetStage("connect", true);
        const label = document.getElementById("mcp-prompt-label"); if (label) label.textContent = "Private agent setup prompt";
        const manual = document.getElementById("mcp-manual-setup"); if (manual) manual.hidden = false;
        ivMcpExpiryTimer = setTimeout(() => { ivMcpClearCommand(); ivMcpMessage("Setup prompt expired. Create a fresh connection only if needed; revoke unused connections."); }, usableMs);
        await window.ivMcpRefresh(true);
      } catch (error) { if (epoch === ivMcpContextEpoch && workspace === String(window.APP_CONFIG?.client_id || "")) { ivMcpClearCommand(); ivMcpMessage(error.message); } }
      finally { if (epoch === ivMcpContextEpoch) ivMcpSetBusy(false); }
    });
  };

  window.ivMcpCopySetup = async () => {
    if (ivMcpCopyBusy || ivMcpBusy) return false;
    if (ivMcpIsDesktopPreview()) { ivMcpRequireWorkspace(); return false; }
    if (!demoGuideCanNavigate() || ivMcpCommandWorkspace !== String(window.APP_CONFIG?.client_id || "") || !ivMcpSetupSnapshot || !ivMcpCommandExpires || performance.now() >= ivMcpCommandExpires) { ivMcpClearCommand(); ivMcpMessage("Setup prompt expired or workspace access changed."); return false; }
    const prompt = document.getElementById("mcp-setup-prompt"), command = document.getElementById("mcp-setup-command"); if (!prompt?.value || !command?.value) return false;
    const value = prompt.value, rawCommand = command?.value || "", epoch = ivMcpContextEpoch, commandEpoch = ivMcpCommandEpoch, workspace = String(window.APP_CONFIG?.client_id || "");
    const current = () => epoch === ivMcpContextEpoch && commandEpoch === ivMcpCommandEpoch && !ivMcpIsDesktopPreview() && workspace === String(window.APP_CONFIG?.client_id || "") && demoGuideCanNavigate() && performance.now() < ivMcpCommandExpires && prompt.value === value && (command?.value || "") === rawCommand;
    ivMcpCopyBusy = true; ivMcpSetBusy(ivMcpBusy);
    let phase = "owner-check";
    try {
      // Cookies can change in another tab while this page's APP_CONFIG remains
      // unchanged. Verify the session owner again before touching the clipboard.
      const owner = await ivMcpRequest("/client/api/mcp/connections");
      if (!current()) return false;
      const connection = (Array.isArray(owner.connections) ? owner.connections : []).find((row) => String(row.connection_id || row.id || "") === ivMcpCommandConnectionId);
      if (!connection || connection.revoked || connection.active === true) { ivMcpClearCommand(); ivMcpMessage("This one-use setup is no longer pending. Inspect the connection before reconnecting."); return false; }
      if (!current()) return false;
      phase = "clipboard";
      await navigator.clipboard.writeText(value);
      if (!current()) return false;
      ivMcpMessage("Private setup prompt copied. Paste into your agent's private chat before it expires. Connection is not verified by copying."); return true;
    }
    catch (error) {
      if (current()) {
        if (phase === "owner-check") { ivMcpClearCommand(); ivMcpMessage(error.message || "Workspace access could not be verified. Generate a fresh command."); }
        else { prompt.focus(); prompt.select(); ivMcpMessage("Clipboard unavailable. Copy the selected private prompt manually before it expires; connection is not verified."); }
      }
      return false;
    }
    finally { if (epoch === ivMcpContextEpoch) { ivMcpCopyBusy = false; ivMcpSetBusy(ivMcpBusy); } }
  };

  window.ivMcpRevoke = async (id, name) => {
    if (ivMcpIsDesktopPreview()) { ivMcpMessage("Revocation is unavailable in this Desktop preview. Use your signed-in workspace."); return; }
    if (!id || ivMcpBusy || ivMcpCopyBusy || !demoGuideCanNavigate()) return;
    const epoch = ivMcpContextEpoch, workspace = String(window.APP_CONFIG?.client_id || "");
    if (!(await ivConfirm(`Revoke MCP access for ${name}? The client will lose this connection immediately.`, { confirmText: "Revoke", danger: true }))) return;
    if (epoch !== ivMcpContextEpoch || workspace !== String(window.APP_CONFIG?.client_id || "") || !demoGuideCanNavigate() || typeof showTotpPrompt !== "function") return;
    const requestApproval = ivMcpLiveDemo ? (_label, callback) => callback("") : showTotpPrompt;
    requestApproval(`Revoke MCP connection: ${name}`, async (totp) => {
      if (ivMcpBusy || ivMcpCopyBusy || epoch !== ivMcpContextEpoch || workspace !== String(window.APP_CONFIG?.client_id || "") || !demoGuideCanNavigate()) return;
      ivMcpSetBusy(true);
      try { await ivMcpRequest("/client/api/mcp/connections/revoke", { connection_id: id, totp }); ivMcpMetadataRevision += 1; ivMcpClearCommand(); await window.ivMcpRefresh(true); }
      catch (error) { if (epoch === ivMcpContextEpoch) ivMcpMessage(error.message); }
      finally { if (epoch === ivMcpContextEpoch) ivMcpSetBusy(false); }
    });
  };
  window.addEventListener("infraveil:access-paused", () => {
    ivMcpInvalidateContext();
    ivMcpMessage("MCP controls are paused until workspace access is restored.");
  });
  window.addEventListener("infraveil:session-expired", ivMcpInvalidateContext);
  window.addEventListener("infraveil:access-resumed", () => { ivMcpSetBusy(false); ivMcpMessage("Workspace access restored. Previously displayed connections may be stale until the next refresh."); });
  window.addEventListener("pagehide", ivMcpInvalidateContext);
  if (ivMcpIsDesktopPreview()) ivMcpRequireWorkspace();
  ivMcpSetStage("start");
  ivMcpSetBusy(false);

  function recordNodeLabel(id) {
    const names = typeof agentNames !== "undefined" ? agentNames : window.agentNames;
    return names?.[id] || names?.[String(id).slice(0, 8)] || id;
  }

  let ivUiVersionPoll = null;
  let ivPendingUiVersion = "";
  let ivUiReloadWait = null;

  function ivUiCanReload() {
    const active = document.activeElement;
    const editing = active?.matches?.("input, textarea, select, [contenteditable='true']");
    const modalOpen = document.querySelector("dialog[open], [role='dialog'][aria-modal='true'], .iv-modal-overlay.iv-show");
    return !document.hidden && !editing && !modalOpen && !fleetNavigator.isInteracting();
  }

  function ivApplyPendingUiUpdate() {
    if (!ivPendingUiVersion || !ivUiCanReload()) return;
    sessionStorage.setItem("infraveil-dashboard-build", ivPendingUiVersion);
    window.location.reload();
  }

  function ivQueueUiUpdate(version) {
    ivPendingUiVersion = version;
    if (ivUiReloadWait) return;
    ivUiReloadWait = window.setInterval(ivApplyPendingUiUpdate, 1500);
    ivApplyPendingUiUpdate();
  }

  async function ivCheckUiVersion() {
    if (window.ivDashboardAccess?.paused) return;
    const current = String(window.APP_CONFIG?.asset_version || "");
    if (!current || current === "unavailable") return;
    try {
      const response = await fetch(`/client/api/ui-version?_=${Date.now()}`, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;
      const next = String((await response.json())?.version || "");
      if (next && next !== "unavailable" && next !== current) ivQueueUiUpdate(next);
    } catch {
      // A temporary control-plane failure should never interrupt the dashboard.
    }
  }

  function ivStartUiVersionPolling() {
    if (window.ivDashboardAccess?.paused || ivUiVersionPoll || !window.APP_CONFIG?.asset_version) return;
    ivUiVersionPoll = window.setInterval(ivCheckUiVersion, 30000);
  }
  window.addEventListener("infraveil:access-paused", () => {
    window.clearInterval(ivUiVersionPoll);
    ivUiVersionPoll = null;
  });
  window.addEventListener("infraveil:access-resumed", ivStartUiVersionPolling);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !window.ivDashboardAccess?.paused) ivCheckUiVersion();
  });

  function init() {
    initializeTheme();
    buildNavigation();
    buildHeader();
    buildBetaNotice();
    buildCommandPalette();
    buildDemoGuide();
    buildManifestEditorExperience();
    bindGlobalKeys();
    const settingsObserver = new MutationObserver(() => buildSettingsNavigation());
    const settingsHost = document.getElementById("auth-settings-content");
    if (settingsHost) settingsObserver.observe(settingsHost, { childList: true });
    buildSettingsNavigation();
    buildPageArchitecture();
    buildFeatureGuide();
    ["input", "change"].forEach((eventName) => document.addEventListener(eventName, (event) => {
      if (event.target?.closest?.("#view-pipelines")) window.ivPipelineDraftDirty = true;
    }, true));
    ivStartUiVersionPolling();
    ivPollIssues();
    window.setInterval(ivPollIssues, 15000);
    setTimeout(buildSettingsNavigation, 100);
    setTimeout(buildPageArchitecture, 120);
    setTimeout(() => {
      if (typeof window.refreshPipelineAnalytics === "function") window.refreshPipelineAnalytics();
      if (typeof window.renderConsole === "function") window.renderConsole();
    }, 140);
    refreshIcons();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
