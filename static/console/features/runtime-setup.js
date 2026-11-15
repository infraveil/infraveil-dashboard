// Runtime setup owns local draft preparation and guided-wizard state only.
// Editor storage, protected saving, requests, target/auth checks and host actions
// stay in the dashboard composition root. Original text/markup is preserved.
(function () {
  "use strict";

  function createController({
    document, readEditorFiles, readCurrentTab, isDemo,
    syncCurrentEditorFile, switchEditorTab, showRawRuntimeJson, ensureManifestFile,
    applyDraftText, showToast, escapeCodeHtml, refreshIcons, requestSave,
  }) {
    // BEGIN exact 9d719758 feature bodies with explicit dependency adapters.
        function parseEditorJsonFile(e) {
          try {
            const t = readEditorFiles()[e];
            return t ? JSON.parse(t) : null;
          } catch (e) {
            return null;
          }
        }
        function editorFileStem(e) {
          return String(e || "")
            .split("/")
            .pop()
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase();
        }
        function firstExistingEditorFile(e) {
          return e.find((e) => readEditorFiles().hasOwnProperty(e)) || "";
        }
        function portFromEditorContent(e, t) {
          const n = String(e || ""),
            o =
              n.match(/PORT\s*[:=]\s*["']?(\d{3,5})["']?/i) ||
              n.match(/listen\s*\(\s*(\d{3,5})/i) ||
              n.match(/app\.run\([^)]*port\s*=\s*(\d{3,5})/i);
          return o ? Number(o[1]) : t;
        }
        function detectRuntimeServicesFromEditor() {
          syncCurrentEditorFile();
          const e = [],
            t = new Set(),
            n = (e) =>
              String(e || "app")
                .replace(/[^a-zA-Z0-9_-]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .toLowerCase() || "app",
            o = (o) => {
              const r = n(o.name);
              if (t.has(r)) return;
              (t.add(r), e.push({ ...o, name: r }));
            },
            r = parseEditorJsonFile("package.json"),
            s = firstExistingEditorFile([
              "server.js",
              "app.js",
              "index.js",
              "src/server.js",
              "src/app.js",
              "src/index.js",
            ]);
          if (r || s) {
            const e = String(r?.scripts?.start || "").trim(),
              t = String(r?.main || s || "server.js").trim(),
              n = s || (readEditorFiles().hasOwnProperty(t) ? t : firstExistingEditorFile([t, "server.js", "index.js"])) || "server.js",
              a = readEditorFiles()[n] || "";
            o({
              name: r?.name || editorFileStem(n) || "node-api",
              runtime: "node",
              entrypoint: n,
              start: e || `node ${n}`,
              port: portFromEditorContent(a, 18444),
              env: { NODE_ENV: "production" },
            });
          }
          const a = firstExistingEditorFile([
            "app.py",
            "main.py",
            "server.py",
            "api.py",
            "src/app.py",
            "src/main.py",
          ]);
          if (a || readEditorFiles().hasOwnProperty("requirements.txt") || readEditorFiles().hasOwnProperty("pyproject.toml")) {
            const e = readEditorFiles()[a] || "";
            o({
              name: editorFileStem(a) || "python-api",
              runtime: "python",
              entrypoint: a || "app.py",
              start: `python ${a || "app.py"}`,
              port: portFromEditorContent(e, 18445),
              env: { PYTHONUNBUFFERED: "1" },
            });
          }
          if (readEditorFiles().hasOwnProperty("go.mod"))
            o({
              name: "go-api",
              runtime: "go",
              entrypoint: firstExistingEditorFile(["main.go", "cmd/server/main.go"]) || ".",
              start: "go run .",
              port: 18446,
            });
          if (readEditorFiles().hasOwnProperty("Cargo.toml"))
            o({
              name: "rust-api",
              runtime: "rust",
              entrypoint: "Cargo.toml",
              start: "cargo run --release",
              port: 18447,
            });
          if (readEditorFiles().hasOwnProperty("pom.xml") || readEditorFiles().hasOwnProperty("build.gradle") || readEditorFiles().hasOwnProperty("build.gradle.kts"))
            o({
              name: "java-api",
              runtime: "java",
              entrypoint: readEditorFiles().hasOwnProperty("pom.xml") ? "pom.xml" : "build.gradle",
              start: readEditorFiles().hasOwnProperty("pom.xml") ? "mvn spring-boot:run" : "gradle bootRun",
              port: 18448,
            });
          if (!e.length) {
            const t = firstExistingEditorFile(["index.html", "public/index.html", "dist/index.html"]);
            t &&
              o({
                name: "static-site",
                runtime: "static",
                entrypoint: t,
                start: `serve ${t.split("/").slice(0, -1).join("/") || "."}`,
                port: 18449,
              });
          }
          if (!e.length)
            o({
              name: "app",
              runtime: "node",
              entrypoint: "server.js",
              start: "node server.js",
              port: 18444,
              env: { NODE_ENV: "production" },
            });
          return e;
        }
        function buildGuidedRuntimeManifest() {
          const e = detectRuntimeServicesFromEditor(),
            t = e.map((e, t) => ({
              path: 0 === t ? "/*" : `/${e.name}/*`,
              service: e.name,
            })),
            n = {
              version: 1,
              mode: "process",
              services: e,
              routes: t,
              gateway: { listen: 18443 },
              env: { INFRAVEIL_GATEWAY_PORT: "18443" },
              persistent_paths: [{ path: "data", type: "dir" }],
            };
          return n;
        }
        function getRuntimeManifestDraft() {
          syncCurrentEditorFile();
          const e = String(readEditorFiles()["infraveil.json"] || "").trim();
          if (e && "{}" !== e) {
            try {
              const t = JSON.parse(e);
              if (t && Array.isArray(t.services) && t.services.length) return t;
            } catch (e) {}
          }
          return buildGuidedRuntimeManifest();
        }
        function commandInstallDefault(e) {
          const t = String(e.runtime || "").toLowerCase();
          if (e.install) return e.install;
          if ("node" === t)
            return readEditorFiles().hasOwnProperty("package-lock.json") ? "npm ci" : "npm install";
          if ("python" === t)
            return readEditorFiles().hasOwnProperty("requirements.txt") ? "python -m pip install -r requirements.txt" : "";
          if ("go" === t) return "go mod download";
          if ("rust" === t) return "cargo fetch";
          if ("java" === t) return readEditorFiles().hasOwnProperty("pom.xml") ? "mvn dependency:resolve" : "gradle dependencies";
          return "";
        }
        function commandBuildDefault(e) {
          const t = String(e.runtime || "").toLowerCase();
          if (e.build) return e.build;
          if ("node" === t) {
            const t = parseEditorJsonFile("package.json");
            return t?.scripts?.build ? "npm run build" : "";
          }
          if ("go" === t) return "go build -o app .";
          if ("rust" === t) return "cargo build --release";
          if ("java" === t) return readEditorFiles().hasOwnProperty("pom.xml") ? "mvn package" : "gradle build";
          return "";
        }
        function normalizeRuntimeServiceForForm(e, t = 0) {
          const n = e || {};
          return {
            name: n.name || `service-${t + 1}`,
            runtime: n.runtime || "node",
            entrypoint: n.entrypoint || "",
            install: commandInstallDefault(n),
            build: commandBuildDefault(n),
            start: n.start || "npm start",
            port: n.port || 18444 + t,
          };
        }
        function collectRuntimeConfigFromForm() {
          const e = document.getElementById("runtime-config-panel"),
            t = Array.from(e?.querySelectorAll("[data-runtime-service]") || []),
            n = t.map((e, t) => {
              const n = (o) => e.querySelector(`[data-runtime-field="${o}"]`)?.value?.trim() || "";
              return {
                name: n("name") || `service-${t + 1}`,
                runtime: n("runtime") || "node",
                entrypoint: n("entrypoint"),
                install: n("install"),
                build: n("build"),
                start: n("start") || "npm start",
                port: Number(n("port") || 18444 + t),
              };
            });
          return {
            version: 1,
            mode: "process",
            services: n,
            routes: n.map((e, t) => ({ path: 0 === t ? "/*" : `/${e.name}/*`, service: e.name })),
            gateway: { listen: Number(e?.querySelector("#runtime-gateway-port")?.value || 18443), engine: e?.querySelector("#runtime-gateway-engine")?.value || "aiohttp" },
            env: { INFRAVEIL_GATEWAY_PORT: String(e?.querySelector("#runtime-gateway-port")?.value || 18443) },
            persistent_paths: [{ path: "data", type: "dir" }],
          };
        }
        function maybeOfferRuntimeSetupGuide() {
          // Guided wizard IS the default surface for the runtime manifest. It auto-opens when
          // the IDE loads on infraveil.json; once dismissed (closed / Manual JSON), it stays
          // out of the way until the user re-opens it from the "Guided Setup" button.
          if (readCurrentTab() === "infraveil.json" && !isDemo() && !_runtimeWizardDismissed) openRuntimeWizard();
        }
        function openRuntimeSetupGuide() {
          ensureManifestFile();
          switchEditorTab("infraveil.json");
          _runtimeWizardDismissed = false;
          openRuntimeWizard();
        }
        const RUNTIME_WIZARD_KINDS = [
          { id: "external", label: "Existing systemd service", icon: "server", entrypoint: "", start: "", install: "" },
          { id: "python", label: "Python", icon: "code", entrypoint: "app.py", start: "python app.py", install: "python -m pip install -r requirements.txt" },
          { id: "node", label: "Node.js", icon: "hexagon", entrypoint: "server.js", start: "npm start", install: "npm install" },
          { id: "go", label: "Go", icon: "box", entrypoint: "main.go", start: "go run .", install: "go mod download" },
          { id: "rust", label: "Rust", icon: "cog", entrypoint: "src/main.rs", start: "./target/release/app", install: "cargo build --release" },
          { id: "java", label: "Java", icon: "coffee", entrypoint: "app.jar", start: "java -jar app.jar", install: "" },
          { id: "dotnet", label: ".NET", icon: "hash", entrypoint: "App.dll", start: "dotnet App.dll", install: "dotnet restore" },
          { id: "ruby", label: "Ruby", icon: "gem", entrypoint: "app.rb", start: "ruby app.rb", install: "bundle install" },
          { id: "php", label: "PHP", icon: "file-code", entrypoint: "index.php", start: "php -S 0.0.0.0:$PORT", install: "" },
          { id: "deno", label: "Deno", icon: "circle", entrypoint: "main.ts", start: "deno run --allow-net --allow-env main.ts", install: "" },
          { id: "bun", label: "Bun", icon: "zap", entrypoint: "server.ts", start: "bun run server.ts", install: "bun install" },
          { id: "generic", label: "Custom command", icon: "terminal", entrypoint: "", start: "", install: "" },
        ];
        const RUNTIME_WIZ_STEPS = [
          { key: "kind", type: "kind", q: "What is this built in?", help: "Pick the runtime for the service you already run. Infraveil does not need your source code; this contract only tells the launcher what command to supervise and what port to watch." },
          { key: "entrypoint", type: "text", skipIf: (a) => a.kind === "external", q: "Optional: what is the main file or binary?", help: "This is metadata for humans. It does not upload a repository. Confirm that your command can access this file in the declared runtime environment." },
          { key: "unit", type: "text", skipIf: (a) => a.kind !== "external", q: "Which existing systemd service?", help: "Use its full unit name, such as my-api.service. The agent observes this existing service; it does not take over the process or run start/install commands." },
          { key: "working_directory", type: "text", skipIf: (a) => a.kind !== "external", q: "Where is that service's app directory?", help: "Enter the absolute directory on your Linux server, such as /opt/my-api. This must match your real systemd service; the wizard does not create the directory." },
          { key: "health", type: "text", skipIf: (a) => a.kind !== "external", q: "Which local health path should we check?", help: "Enter a path such as /health that returns a successful response on the service's local port. No external URL. The runtime checks this alongside systemd state." },
          { key: "port", type: "port", q: "What port does your app listen on?", help: "Point this at the local port your service already uses. The launcher supervises the process, captures stdout/stderr, and wires the gateway to it without taking custody of your code." },
          { key: "gateway", type: "port", q: "Which free port should the gateway use?", help: "Choose a different port from the app's local port. Configure your existing reverse proxy or clients to send traffic through this gateway. Only requests routed through it are observed and protected; direct app traffic and unrelated host traffic are not intercepted." },
          { key: "install", type: "text", skipIf: (a) => a.kind === "external", q: "Optional: how do dependencies get prepared?", help: "Leave this blank when dependencies already exist. Use it only when you explicitly want an install/prep command run in the managed runtime environment." },
          { key: "start", type: "text", skipIf: (a) => a.kind === "external", q: "What long-running command should we supervise?", help: "Use the actual foreground command, such as npm start or python app.py. A one-shot systemctl start or detached docker compose up -d command is not the app process; use Existing systemd service for supported external observation instead." },
          { key: "review", type: "review", q: "Review your setup", help: "" },
        ];
        let _runtimeWiz = null, _runtimeWizardDismissed = false;
        function _runtimeWizKind() { return RUNTIME_WIZARD_KINDS.find((k) => k.id === _runtimeWiz.a.kind) || RUNTIME_WIZARD_KINDS.find((k) => k.id === "python"); }
        function _applyRuntimeWizDefaults() {
          const k = _runtimeWizKind(), a = _runtimeWiz.a;
          if (!a.entrypoint) a.entrypoint = k.entrypoint;
          if (!a.install) a.install = k.install;
          if (!a.start) a.start = k.start;
        }
        function openRuntimeWizard() {
          _runtimeWiz = { step: 0, shellBuilt: false, a: { kind: "python", entrypoint: "", port: 8080, gateway: 18443, install: "", start: "", unit: "my-api.service", working_directory: "/opt/my-api", health: "/health" } };
          let existingService = false;
          try {
            const m = getRuntimeManifestDraft(), s = (m.services || [])[0];
            if (s) {
              existingService = true;
              _runtimeWiz.a.kind = s.runtime || "python";
              _runtimeWiz.a.entrypoint = s.entrypoint || "";
              _runtimeWiz.a.port = s.port || 8080;
              _runtimeWiz.a.install = s.install || "";
              _runtimeWiz.a.start = s.start || "";
              _runtimeWiz.a.unit = s.unit || "my-api.service";
              _runtimeWiz.a.working_directory = s.working_directory || "/opt/my-api";
              _runtimeWiz.a.health = s.health || "/health";
            }
            if (m && m.gateway && m.gateway.listen) _runtimeWiz.a.gateway = m.gateway.listen;
          } catch (e) {}
          if (!existingService) _applyRuntimeWizDefaults();
          const el = document.getElementById("runtime-wizard");
          if (el) el.classList.remove("hidden");
          renderRuntimeWizard();
        }
        function closeRuntimeWizard() { const el = document.getElementById("runtime-wizard"); if (el) el.classList.add("hidden"); if (_runtimeWiz) _runtimeWiz.shellBuilt = false; _runtimeWizardDismissed = true; }
        function pickRuntimeWizKind(id) {
          _runtimeWiz.a.kind = id;
          _runtimeWiz.a.entrypoint = ""; _runtimeWiz.a.install = ""; _runtimeWiz.a.start = "";
          _applyRuntimeWizDefaults();
          runtimeWizNext();
        }
        function _wizStepVisible(i) { const s = RUNTIME_WIZ_STEPS[i]; return !!s && !(s.skipIf && s.skipIf(_runtimeWiz.a)); }
        function _readRuntimeWizInput() {
          const step = RUNTIME_WIZ_STEPS[_runtimeWiz.step], inp = document.getElementById("runtime-wiz-input");
          if (!inp || step.type === "kind" || step.type === "review") return;
          let v = inp.value.trim();
          if (step.type === "port") {
            if (!/^\d+$/.test(v) || Number(v) < 1 || Number(v) > 65535) { showToast("Enter a whole port number from 1 to 65535.", "error"); return false; }
            v = Number(v);
            if (step.key === "gateway" && v === Number(_runtimeWiz.a.port)) { showToast("Gateway and app ports must be different.", "error"); return false; }
          }
          if (step.key === "start" && !v) { showToast("Enter the long-running start command.", "error"); return false; }
          if (step.key === "unit" && !/^[A-Za-z0-9_.@-]{1,128}\.service$/.test(v)) { showToast("Enter a full systemd .service unit name.", "error"); return false; }
          if (step.key === "working_directory" && (!v.startsWith("/") || v.includes("\0"))) { showToast("Enter an absolute directory on the server.", "error"); return false; }
          if (step.key === "health" && (!v.startsWith("/") || v.includes("://") || v.length > 256)) { showToast("Enter a local health path such as /health.", "error"); return false; }
          _runtimeWiz.a[step.key] = v;
          return true;
        }
        function runtimeWizNext() { if (_readRuntimeWizInput() === false) return; let i = _runtimeWiz.step + 1; while (i < RUNTIME_WIZ_STEPS.length && !_wizStepVisible(i)) i++; if (i < RUNTIME_WIZ_STEPS.length) { _runtimeWiz.step = i; renderRuntimeWizard(); } }
        function runtimeWizBack() { _readRuntimeWizInput(); let i = _runtimeWiz.step - 1; while (i >= 0 && !_wizStepVisible(i)) i--; if (i >= 0) { _runtimeWiz.step = i; renderRuntimeWizard(); } }
        function _runtimeWizStepInner() {
          const step = RUNTIME_WIZ_STEPS[_runtimeWiz.step], a = _runtimeWiz.a;
          if (step.type === "kind") {
            return `<div class="runtime-wiz-kinds">${RUNTIME_WIZARD_KINDS.map((k) => `<button type="button" class="runtime-wiz-kind ${a.kind === k.id ? "selected" : ""}" onclick="pickRuntimeWizKind('${k.id}')"><i data-lucide="${k.icon}" class="w-4 h-4 text-blue-300 shrink-0"></i><span>${escapeCodeHtml(k.label)}</span></button>`).join("")}</div>`;
          }
          if (step.type === "review") {
            const k = _runtimeWizKind();
            return `<div class="runtime-wiz-summary">This draft ${a.kind === "external" ? "observes your existing systemd service" : "supervises your foreground command"} on local port <strong>${escapeCodeHtml(String(a.port))}</strong>. Configured gateway routes use port <strong>${escapeCodeHtml(String(a.gateway))}</strong>. Applying a draft does not start an app. Save, review approvals and verify fresh runtime evidence separately.</div>
              <dl class="runtime-wiz-dl">
                <div><dt>Runtime</dt><dd>${escapeCodeHtml(k.label)}</dd></div>
                <div><dt>Install</dt><dd>${escapeCodeHtml(a.install || "— none —")}</dd></div>
                <div><dt>Start</dt><dd>${escapeCodeHtml(a.start || "— none —")}</dd></div>
                <div><dt>App port (PORT)</dt><dd>${escapeCodeHtml(String(a.port))}</dd></div>
                <div><dt>Gateway contract</dt><dd>${escapeCodeHtml(String(a.gateway))}</dd></div>
                <div><dt>Liveness</dt><dd>${a.kind === "external" ? "systemd state + local health" : "process + configured health checks"}</dd></div>
                ${a.kind === "external" ? `<div><dt>Unit</dt><dd>${escapeCodeHtml(a.unit)}</dd></div><div><dt>Server directory</dt><dd>${escapeCodeHtml(a.working_directory)}</dd></div><div><dt>Local health path</dt><dd>${escapeCodeHtml(a.health)}</dd></div>` : ""}
              </dl>`;
          }
          const val = a[step.key], numeric = step.type === "port" ? 'inputmode="numeric"' : "";
          let extra = "";
          if (step.key === "gateway") {
            extra = `<div class="runtime-wiz-callout"><i data-lucide="git-merge" class="w-5 h-5"></i><div><h4>A separate routed listener</h4><p>Only traffic sent through this listener's routes is observed. External systemd mode binds it to loopback: point your existing reverse proxy at it. Confirm the port is free on the host.</p></div></div>`;
          }
          return `<input id="runtime-wiz-input" class="runtime-wiz-input" aria-labelledby="runtime-wiz-question" ${numeric} value="${escapeCodeHtml(val == null ? "" : String(val))}" onkeydown="if(event.key==='Enter'){event.preventDefault();runtimeWizNext();}">${extra}`;
        }
        function renderRuntimeWizard() {
          const host = document.getElementById("runtime-wizard-body");
          if (!host || !_runtimeWiz) return;
          const step = RUNTIME_WIZ_STEPS[_runtimeWiz.step];
          const visible = RUNTIME_WIZ_STEPS.filter((s, i) => _wizStepVisible(i));
          const total = visible.length, curr = visible.indexOf(step) + 1;
          if (!_runtimeWiz.shellBuilt) {
            host.innerHTML = `
              <div class="runtime-wiz-card">
                <button type="button" class="runtime-wiz-close" onclick="closeRuntimeWizard()" aria-label="Close"><i data-lucide="x" class="w-4 h-4"></i></button>
                <div class="runtime-wiz-progressbar"><span id="runtime-wiz-bar"></span></div>
                <div class="runtime-wiz-progress" id="runtime-wiz-stepnum"></div>
                <div id="runtime-wiz-step"></div>
                <div class="runtime-wiz-actions" id="runtime-wiz-actions"></div>
                <button type="button" class="runtime-wiz-advanced" onclick="closeRuntimeWizard(); showRawRuntimeJson();">Advanced: edit raw JSON instead</button>
              </div>`;
            _runtimeWiz.shellBuilt = true;
          }
          const bar = document.getElementById("runtime-wiz-bar");
          if (bar) bar.style.width = ((curr / total) * 100) + "%";
          const num = document.getElementById("runtime-wiz-stepnum");
          if (num) num.textContent = `Step ${curr} of ${total}`;
          const stepHost = document.getElementById("runtime-wiz-step");
          if (stepHost) stepHost.innerHTML = `<div class="runtime-wiz-step"><h2 id="runtime-wiz-question" class="runtime-wiz-q">${escapeCodeHtml(step.q)}</h2>${step.help ? `<p class="runtime-wiz-help">${escapeCodeHtml(step.help)}</p>` : ""}<div class="runtime-wiz-field">${_runtimeWizStepInner()}</div></div>`;
          const isReview = step.type === "review";
          const actions = document.getElementById("runtime-wiz-actions");
          if (actions) actions.innerHTML = `
            ${_runtimeWiz.step > 0 ? `<button type="button" class="btn-secondary px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest" onclick="runtimeWizBack()">Back</button>` : `<span></span>`}
            ${isReview
              ? `<div class="flex gap-2"><button type="button" class="btn-secondary px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest" onclick="finishRuntimeWizard(false)">Apply draft</button>${isDemo() ? "" : `<button type="button" class="btn-primary px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest" onclick="finishRuntimeWizard(true)">Review &amp; save</button>`}</div>`
              : `<button type="button" class="btn-primary px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest" onclick="runtimeWizNext()">Continue</button>`}`;
          refreshIcons();
          const inp = document.getElementById("runtime-wiz-input"); if (inp) { try { inp.focus(); } catch (e) {} }
        }
        function finishRuntimeWizard(deploy) {
          if (_readRuntimeWizInput() === false) return;
          const a = _runtimeWiz.a, gateway = Number(a.gateway) || 18443, port = Number(a.port) || 8080;
          let previous = {};
          try { previous = getRuntimeManifestDraft() || {}; } catch (error) {}
          const previousService = (previous.services || [])[0] || {};
          const svc = a.kind === "external"
            ? { ...previousService, name: previousService.name || "app", runtime: "external", manager: "systemd", unit: a.unit, working_directory: a.working_directory, health: a.health, port }
            : { ...previousService, name: previousService.name || "app", runtime: a.kind, entrypoint: a.entrypoint, install: a.install, build: previousService.build || "", start: a.start, port: port };
          if (a.kind === "external") { delete svc.start; delete svc.install; delete svc.build; }
          else { delete svc.manager; delete svc.unit; delete svc.working_directory; }
          const extra = (previous.services || []).slice(1);
          if (extra.some((service) => (service.runtime === "external") !== (a.kind === "external")))
            return showToast("Managed and external systemd services need separate workload contracts. Review the existing additional services before changing mode.", "error");
          const services = [svc].concat(extra);
          const manifest = {
            ...previous,
            version: previous.version || 1, mode: a.kind === "external" ? "external-process" : "process", services: services,
            routes: Array.isArray(previous.routes) ? previous.routes : services.map((s, i) => ({ path: i === 0 ? "/*" : `/${s.name}/*`, service: s.name })),
            gateway: { ...(previous.gateway || {}), listen: gateway, engine: previous.gateway?.engine || "aiohttp", ...(a.kind === "external" ? { bind_host: "127.0.0.1" } : {}) },
            env: { ...(previous.env || {}), INFRAVEIL_GATEWAY_PORT: String(gateway) },
            persistent_paths: previous.persistent_paths || (a.kind === "external" ? [] : [{ path: "data", type: "dir" }]),
          };
          applyDraftText(JSON.stringify(manifest, null, 2));
          closeRuntimeWizard();
          showRawRuntimeJson();
          showToast(services.length > 1 ? `Local draft configured for ${services.length} services.` : "Local runtime draft configured. Review before saving.", "success");
          if (deploy && !isDemo()) requestSave();
        }

    // END exact 9d719758 feature bodies.

    function resetDismissal() {
      _runtimeWizardDismissed = false;
    }

    function destroy() {
      // No listeners, timers or globals are registered by this controller.
      // Release private wizard state without changing editor drafts or DOM.
      _runtimeWiz = null;
      _runtimeWizardDismissed = false;
    }

    return {
      parseEditorJsonFile,
      editorFileStem,
      firstExistingEditorFile,
      portFromEditorContent,
      detectRuntimeServicesFromEditor,
      buildGuidedRuntimeManifest,
      getRuntimeManifestDraft,
      commandInstallDefault,
      commandBuildDefault,
      normalizeRuntimeServiceForForm,
      collectRuntimeConfigFromForm,
      maybeOfferRuntimeSetupGuide,
      openRuntimeSetupGuide,
      openRuntimeWizard,
      closeRuntimeWizard,
      pickRuntimeWizKind,
      runtimeWizNext,
      runtimeWizBack,
      renderRuntimeWizard,
      finishRuntimeWizard,
      resetDismissal,
      destroy,
    };
  }

  window.InfraveilUI = window.InfraveilUI || {};
  window.InfraveilUI.runtimeSetup = { createController };
})();
