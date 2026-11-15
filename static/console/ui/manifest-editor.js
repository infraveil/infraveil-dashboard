// Runtime-contract editor UI only. The composition root retains dirty state,
// source requests, target/access checks, protected saves, hashing and setup.
// Original bodies and multiline markup retain their reviewed indentation.
(function () {
  "use strict";

function createController({ document, refreshIcons, publishValidation }) {
  const cleanups = [];

  function claimView(view) {
    const previous = view.getAttribute("data-manifest-experience");
    view.dataset.manifestExperience = "1";
    cleanups.push(() => {
      if (view.dataset.manifestExperience !== "1") return;
      if (previous === null) view.removeAttribute("data-manifest-experience");
      else view.setAttribute("data-manifest-experience", previous);
    });
  }

  function listen(node, type, listener) {
    node.addEventListener(type, listener);
    cleanups.push(() => node.removeEventListener(type, listener));
  }

  function publishOwnedValidation(validate) {
    const release = publishValidation(validate);
    if (typeof release === "function") cleanups.push(release);
  }

  // BEGIN original manifest editor bodies (four explicit lifecycle adapters).
  function manifestErrorLocation(error) {
    const message = String(error?.message || "Invalid JSON");
    const direct = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (direct) return { line: Number(direct[1]), column: Number(direct[2]) };
    const positioned = message.match(/position\s+(\d+)/i);
    const editor = document.getElementById("source-code-editor");
    if (!positioned || !editor) return null;
    const before = editor.value.slice(0, Number(positioned[1]));
    const lines = before.split("\n");
    return { line: lines.length, column: lines[lines.length - 1].length + 1 };
  }

  function validateManifest() {
    const editor = document.getElementById("source-code-editor");
    const card = document.getElementById("manifest-validation-card");
    const title = document.getElementById("manifest-validation-title");
    const detail = document.getElementById("manifest-validation-detail");
    const iconHost = document.getElementById("manifest-validation-icon");
    const position = document.getElementById("manifest-validation-position");
    const save = document.getElementById("editor-save-deploy-btn");
    if (!editor || !card || !title || !detail || !iconHost || !position) return { valid: false, empty: true, message: "Contract validation is not ready. Reload the editor before saving." };

    const raw = editor.value.trim();
    let state = "empty";
    let parsed = null;
    let message = "Start with a JSON object describing at least one supervised service.";
    let heading = "Waiting for JSON";
    let location = null;

    if (raw && raw !== "Loading runtime contract from server...") {
      try {
        parsed = JSON.parse(raw);
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("The contract root must be a JSON object.");
        if (!Array.isArray(parsed.services) || parsed.services.length === 0) throw new Error('"services" must contain at least one service.');
        if (parsed.routes !== undefined && !Array.isArray(parsed.routes)) throw new Error('"routes" must be an array.');
        if (Array.isArray(parsed.services)) {
          const names = new Set();
          parsed.services.forEach((service, index) => {
            if (!service || typeof service !== "object" || Array.isArray(service)) throw new Error(`services[${index}] must be an object.`);
            if (typeof service.name !== "string" || !service.name.trim()) throw new Error(`services[${index}].name must be a non-empty string.`);
            if (typeof service.runtime !== "string" || !service.runtime.trim()) throw new Error(`services[${index}].runtime must be a non-empty string.`);
            const name = String(service.name).trim();
            if (names.has(name)) throw new Error(`Service name "${name}" is duplicated.`);
            names.add(name);
            if (String(parsed.mode || "process") === "external-process") {
              if (service.runtime !== "external" || service.manager !== "systemd") throw new Error(`services[${index}] must use runtime=external and manager=systemd in external-process mode.`);
              if (!/^[A-Za-z0-9_.@-]{1,128}\.service$/.test(String(service.unit || ""))) throw new Error(`services[${index}].unit must name a systemd .service unit.`);
              if (!String(service.working_directory || "").startsWith("/") || String(service.working_directory).includes("\0")) throw new Error(`services[${index}].working_directory must be an absolute server path.`);
              if (!String(service.health || "").startsWith("/") || String(service.health).includes("://") || String(service.health).includes("\0") || String(service.health).length > 256) throw new Error(`services[${index}].health must be a local absolute path.`);
              if (service.port === undefined) throw new Error(`services[${index}].port is required for external observation.`);
              if (service.start || service.install || service.build) throw new Error(`External service ${name} cannot contain executable commands.`);
            } else if (typeof service.start !== "string" || !service.start.trim()) throw new Error(`services[${index}].start is required for a managed process.`);
            if (service.port !== undefined && (!Number.isInteger(Number(service.port)) || Number(service.port) < 1 || Number(service.port) > 65535)) {
              throw new Error(`services[${index}].port must be an integer from 1 to 65535.`);
            }
          });
          (parsed.routes || []).forEach((route, index) => {
            if (!route || typeof route !== "object" || Array.isArray(route) || (!String(route.path || "").startsWith("/") && route.path !== "*")) throw new Error(`routes[${index}].path must start with / or be *.`);
            if (!names.has(String(route.service || ""))) throw new Error(`routes[${index}] must target a declared service.`);
          });
          if (parsed.gateway?.enabled !== false && parsed.gateway?.listen !== undefined) {
            const port = Number(parsed.gateway.listen);
            if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("gateway.listen must be an integer from 1 to 65535.");
            if (parsed.services.some((service) => Number(service.port) === port)) throw new Error("Gateway and app service ports must be different.");
          }
          if (parsed.mode === "external-process" && parsed.gateway?.enabled !== false && parsed.gateway?.bind_host !== undefined && !["127.0.0.1", "::1"].includes(parsed.gateway.bind_host)) throw new Error("External-process gateway must bind to loopback.");
        }
        state = "valid";
        heading = "Contract is valid";
        message = "Contract structure passed local checks. Commands, files, ports and runtime health still need verification on the target server.";
      } catch (error) {
        state = "invalid";
        heading = "Contract has an error";
        message = String(error.message || "Invalid JSON");
        location = manifestErrorLocation(error);
      }
    }

    card.dataset.state = state;
    editor.dataset.validationState = state;
    editor.setAttribute("aria-invalid", state === "invalid" ? "true" : "false");
    title.textContent = heading;
    detail.textContent = message;
    position.textContent = location ? `Line ${location.line}, column ${location.column}` : "";
    iconHost.innerHTML = `<i data-lucide="${state === "valid" ? "check" : state === "invalid" ? "x" : "braces"}" class="w-5 h-5"></i>`;

    const services = Array.isArray(parsed?.services) ? parsed.services.length : 0;
    const routes = Array.isArray(parsed?.routes) ? parsed.routes.length : 0;
    const mounts = Array.isArray(parsed?.volumes) ? parsed.volumes.length : Array.isArray(parsed?.persistent_paths) ? parsed.persistent_paths.length : 0;
    [["manifest-service-count", services], ["manifest-route-count", routes], ["manifest-mount-count", mounts]].forEach(([id, value]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = state === "valid" ? String(value) : "-";
    });

    const demo = document.body.dataset.demoMode === "true";
    if (save) {
      save.disabled = demo || state !== "valid";
      save.classList.toggle("opacity-50", save.disabled);
      save.classList.toggle("cursor-not-allowed", save.disabled);
      save.title = demo
        ? "Validation is interactive in the demo; saving requires your own workspace."
        : state === "invalid"
          ? "Fix the JSON error before saving."
          : state === "empty"
            ? "Enter a runtime contract before saving."
            : "Save the validated runtime contract.";
    }
    refreshIcons();
    return { valid: state === "valid", empty: state === "empty", parsed, message, location };
  }

  function buildManifestEditorExperience() {
    const view = document.getElementById("view-editor");
    const rail = view?.querySelector(".ide-utility-rail");
    const editor = document.getElementById("source-code-editor");
    if (!view || !rail || !editor || view.dataset.manifestExperience === "1") return;
    claimView(view);
    const title = view.querySelector(".ide-titlebar > .min-w-0 > div:first-child");
    if (title) title.textContent = "INFRAVEIL.json";
    const fileTitle = document.getElementById("editor-file-title");
    if (fileTitle) fileTitle.textContent = "INFRAVEIL.json";
    const breadcrumb = document.getElementById("editor-breadcrumb");
    if (breadcrumb) breadcrumb.textContent = "INFRAVEIL.json";

    const sourceTree = view.querySelector(".ide-sidebar");
    if (sourceTree) sourceTree.remove();
    const tabBar = view.querySelector(".ide-tabbar");
    if (tabBar) tabBar.remove();
    const editorToolbar = breadcrumb?.closest(".border-b");
    if (editorToolbar) {
      editorToolbar.classList.add("manifest-editor-toolbar");
      editorToolbar.querySelector("button[onclick='deleteCurrentEditorFile()']")?.remove();
    }
    const fileCounter = document.getElementById("editor-status-files");
    if (fileCounter) fileCounter.textContent = "INFRAVEIL.json";

    rail.innerHTML = `
      <section id="manifest-validation-card" class="manifest-validation-card" data-state="empty">
        <div class="manifest-validation-heading">
          <span id="manifest-validation-icon" class="manifest-validation-icon"><i data-lucide="braces" class="w-5 h-5"></i></span>
          <div><strong id="manifest-validation-title">Waiting for JSON</strong><span>Automatic validation</span></div>
        </div>
        <p id="manifest-validation-detail">Start with a JSON object describing at least one supervised service.</p>
        <div id="manifest-validation-position" class="manifest-validation-position"></div>
      </section>
      <section class="manifest-summary-card">
        <div class="manifest-card-label">Contract summary</div>
        <div class="manifest-summary-grid">
          <div><span id="manifest-service-count">-</span><small>Services</small></div>
          <div><span id="manifest-route-count">-</span><small>Routes</small></div>
          <div><span id="manifest-mount-count">-</span><small>Mounts</small></div>
        </div>
      </section>
      <section class="manifest-hash-card">
        <div class="manifest-card-label">Current file hash</div>
        <div id="editor-hash-display" class="manifest-hash-value"><span>Start typing to compute...</span></div>
        <div class="manifest-hash-meta"><span>SHA-256</span><span id="hash-tab-label">INFRAVEIL.json</span></div>
      </section>
      <section class="manifest-help-card">
        <div class="manifest-card-label">Start with the running app</div>
        <p>1. Confirm the target workload. 2. Choose a managed foreground command or an existing systemd service. 3. Declare the local app port and separate gateway listener. Add health, environment and storage settings only when needed.</p>
        <button type="button" onclick="openRuntimeSetupGuide()" class="btn-secondary">Open guided setup</button>
        <button type="button" onclick="ivOpenFeatureGuide('editor')" class="btn-secondary">Explain services, routes and approvals</button>
        <p>Apply draft only fills this editor. Save creates a new contract/package and may queue a restart. Approval and fresh runtime reports are separate checks. Validation cannot prove a command or port works on the server.</p>
      </section>
      <div id="editor-pkg-hash-display" hidden></div>`;

    editor.readOnly = false;
    editor.placeholder = '{\n  "services": [\n    { "name": "api", "runtime": "node", "start": "npm start", "port": 8080 }\n  ]\n}';
    listen(editor, "input", validateManifest);
    listen(editor, "blur", validateManifest);
    publishOwnedValidation(validateManifest);
    validateManifest();
    refreshIcons();
  }

  // END original manifest editor bodies.

  function destroy() {
    // No DOM removal or draft reset: the editor and its external listeners belong
    // to the composition root. LIFO releases publication before mount ownership.
    let failure;
    while (cleanups.length) {
      try { cleanups.pop()(); }
      catch (error) { if (!failure) failure = error; }
    }
    if (failure) throw failure;
  }

  return {
    mount: buildManifestEditorExperience,
    validate: validateManifest,
    errorLocation: manifestErrorLocation,
    destroy,
  };
}

  window.InfraveilUI = window.InfraveilUI || {};
  window.InfraveilUI.manifestEditor = { createController };
})();
