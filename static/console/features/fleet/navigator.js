// Fleet navigator: private observation/gesture state; application targets stay in the injected selection owner.
(function () {
  "use strict";
  function createController(ports) {
  const ivFleetScopeKey = "infraveil-fleet-scope-v1";
  let ivFleetPayload = null;
  let ivFleetBound = false;
  let ivFleetScope = { kind: "fleet", id: "", hostId: "", label: "Entire fleet" };
  let ivFleetSelection = { kind: "", ids: new Set() };
  let ivFleetViewportInitialized = false;
  let ivFleetViewportUserAdjusted = false;
  let ivFleetCanvas = {
    level: "fleet", launcherId: "", agentId: "", nodes: [], hovered: null,
    scale: 1, offsetX: 24, offsetY: 24, worldWidth: 900, worldHeight: 520,
    dragging: null, dropTarget: null, search: "", clickTimer: null,
  };

  function ivNormalizeFleetScope(scope) {
    const kind = ["fleet", "launcher", "agent", "selection"].includes(scope?.kind) ? scope.kind : "fleet";
    return {
      kind,
      id: kind === "fleet" ? "" : String(scope?.id || ""),
      hostId: kind === "agent" ? String(scope?.hostId || "") : kind === "launcher" ? String(scope?.id || "") : "",
      label: String(scope?.label || (kind === "fleet" ? "Entire fleet" : "Selected scope")),
      ids: kind === "selection" ? [...new Set((scope.ids || []).map(String))] : [],
      hostIds: kind === "selection" ? [...new Set((scope.hostIds || []).map(String))] : [],
      selectionType: scope?.selectionType === "launcher" ? "launcher" : "agent",
    };
  }

  function restoreScope() {
  try { ivFleetScope = ivNormalizeFleetScope(JSON.parse(ports.storage.getItem(ivFleetScopeKey) || "{}")); }
  catch (_) { ivFleetScope = ivNormalizeFleetScope(null); }
  }

  function ivFleetData() {
    const data = ivFleetPayload?.navigator || {};
    return {
      launchers: Array.isArray(data.launchers) ? data.launchers : [],
      agents: Array.isArray(data.agents) ? data.agents : [],
    };
  }

  function ivFleetCatalog() {
    try {
      const state = ports.status.operations();
      return {
        hosts: Array.isArray(state?.catalog?.hosts) ? state.catalog.hosts : [],
        agents: Array.isArray(state?.catalog?.services) ? state.catalog.services : [],
      };
    } catch (_) { return { hosts: [], agents: [] }; }
  }

  function ivUpdateFleetChrome() {
    const indicator = ports.dom.document().getElementById("iv-global-fleet-scope");
    if (indicator) {
      indicator.dataset.kind = ivFleetScope.kind;
      const label = indicator.querySelector("span");
      if (label) label.textContent = ivFleetScope.label;
      indicator.title = `Data scope: ${ivFleetScope.label}. Change it from Operations Home.`;
    }
    const title = ports.dom.document().getElementById("iv-fleet-scope-title");
    const meta = ports.dom.document().getElementById("iv-fleet-scope-meta");
    const back = ports.dom.document().getElementById("iv-fleet-back");
    const data = ivFleetData();
    const childCount = data.agents.filter((item) => item.host_id === ivFleetCanvas.launcherId).length;
    const launcher = data.launchers.find((item) => item.id === ivFleetCanvas.launcherId);
    if (title) title.textContent = ivFleetCanvas.level === "fleet" ? "Entire fleet" : launcher?.label || ivFleetCanvas.launcherId || "Launcher";
    if (meta) meta.textContent = ivFleetCanvas.level === "fleet"
      ? `${data.launchers.length.toLocaleString()} launcher${data.launchers.length === 1 ? "" : "s"}`
      : `${childCount.toLocaleString()} workload${childCount === 1 ? "" : "s"} in rollout order`;
    if (back) back.disabled = ivFleetCanvas.level === "fleet";
  }

  function ivSetFleetScope(scope, options = {}) {
    ivFleetScope = ivNormalizeFleetScope(scope);
    const data = ivFleetData();
    const agentIds = ivFleetScope.kind === "selection" ? ivFleetScope.ids.filter((id) => data.agents.some((item) => item.id === id)) : ivFleetScope.kind === "agent"
      ? [ivFleetScope.id]
      : ivFleetScope.kind === "launcher"
        ? data.agents.filter((item) => item.host_id === ivFleetScope.id).map((item) => item.id)
        : [];
    ports.scope.project(ivFleetScope.kind === "fleet" ? null : { ids: new Set(agentIds), label: ivFleetScope.label });
    try { ports.storage.setItem(ivFleetScopeKey, JSON.stringify(ivFleetScope)); } catch (_) {}
    ivUpdateFleetChrome();
    if (ivFleetPayload) {
      ivBuildFleetNodes();
      ivRenderFleetInspector();
      ivDrawFleet();
    }
    if (!options.silent) {
      ports.scope.publishChange(ivFleetScope);
      ports.scope.apply(ivFleetScope);
    }
  }

  const getFleetScope = () => ({ ...ivFleetScope, ids: [...ivFleetScope.ids], hostIds: [...ivFleetScope.hostIds] });
  const getFleetScopeLabel = () => ivFleetScope.label;
  const getFleetAgentScope = () => ports.scope.projection()?.ids || null;
  const setGlobalFleetScope = ivSetFleetScope;

  function ivFleetBack() {
    if (ivFleetCanvas.level === "fleet") return;
    ivFleetCanvas.level = "fleet";
    ivFleetCanvas.launcherId = "";
    ivFleetCanvas.agentId = "";
    ivFleetSelection = { kind: "", ids: new Set() };
    ivSyncFleetSelection();
    ivSetFleetScope({ kind: "fleet", label: "Entire fleet" });
    ports.timing.frame(ivFitFleet);
  }

  const resetFleetTopology = ivFleetBack;

  function ivBuildFleetNodes() {
    const data = ivFleetData();
    const fleetLevel = ivFleetCanvas.level === "fleet";
    const items = (fleetLevel ? data.launchers : data.agents.filter((item) => item.host_id === ivFleetCanvas.launcherId))
      .slice()
      .sort((a, b) => {
        const orderDelta = Number(a.order || Number.MAX_SAFE_INTEGER) - Number(b.order || Number.MAX_SAFE_INTEGER);
        return orderDelta || String(a.label || a.id || "").localeCompare(String(b.label || b.id || ""));
      });
    const stage = ports.dom.document().getElementById("iv-fleet-stage");
    const viewportWidth = ivFleetViewportUserAdjusted && ivFleetCanvas.layoutWidth
      ? ivFleetCanvas.layoutWidth : Math.max(720, stage?.clientWidth || 980);
    const viewportHeight = ivFleetViewportUserAdjusted && ivFleetCanvas.layoutHeight
      ? ivFleetCanvas.layoutHeight : Math.max(430, stage?.clientHeight || 540);
    ivFleetCanvas.layoutWidth = viewportWidth; ivFleetCanvas.layoutHeight = viewportHeight;
    const rowHeight = fleetLevel ? 100 : 78;
    const nodeWidth = fleetLevel ? 260 : 194;
    const nodeHeight = fleetLevel ? 80 : 58;
    const top = fleetLevel ? 42 : 132;
    const columnWidth = nodeWidth + 34;
    const targetAspect = Math.max(.8, Math.min(2.4, viewportWidth / viewportHeight));
    const columns = items.length
      ? Math.max(1, Math.ceil(Math.sqrt(items.length * targetAspect * rowHeight / columnWidth)))
      : 1;
    const rows = Math.max(1, Math.ceil(items.length / columns));
    const contentWidth = columns * columnWidth - 34;
    const worldWidth = Math.max(760, 88 + contentWidth);
    const contentLeft = (worldWidth - contentWidth) / 2;
    const catalog = ivFleetCatalog();
    const hostById = new Map([...data.launchers.map((host) => [host.id, host]), ...catalog.hosts.map((host) => [String(host.host_id), host])]);
    const catalogById = new Map(catalog.agents.map((agent) => [String(agent.service_id || agent.agent_id), agent]));
    const statusById = new Map((ports.status.latest()?.agents || []).map((agent) => [String(agent.agent_id || agent.service_id), agent]));
    ivFleetCanvas.nodes = items.map((item, index) => {
      const host = hostById.get(String(item.host_id));
      const evidence = !fleetLevel && ports.evidence.available()
        ? ports.evidence.read(item, host, undefined, { detailed: statusById.get(item.id), catalog: catalogById.get(item.id) }) : null;
      return {
        ...item,
        kind: fleetLevel ? "launcher" : "agent",
        evidence,
        evidenceStatus: evidence ? evidence.healthy ? "healthy" : evidence.color === "red" ? "offline" : "warning" : item.status === "online" && (item.unhealthy_count || item.unknown_count) ? "warning" : item.status,
        x: contentLeft + (index % columns) * columnWidth,
        y: top + Math.floor(index / columns) * rowHeight,
        width: nodeWidth,
        height: nodeHeight,
      };
    });
    ivFleetCanvas.columns = columns;
    ivFleetCanvas.rows = rows;
    ivFleetCanvas.worldWidth = worldWidth;
    ivFleetCanvas.worldHeight = Math.max(470, top + rows * rowHeight - (rowHeight - nodeHeight) + 56);
    const empty = ports.dom.document().getElementById("iv-fleet-empty");
    if (empty) empty.hidden = items.length > 0;
  }

  function ivDrawFleet() {
    return ports.renderer.draw({ canvas: ivFleetCanvas, selection: () => ivFleetSelection, data: ivFleetData });
  }

  function ivFitFleet() {
    const stage = ports.dom.document().getElementById("iv-fleet-stage");
    if (!stage || stage.clientWidth < 80 || stage.clientHeight < 80) return;
    ivFleetViewportUserAdjusted = false;
    ivBuildFleetNodes();
    const padding = 38;
    // Fit observed cards, not the artificial minimum world or an empty hidden tab.
    const nodes = ivFleetCanvas.nodes;
    const anchor = ivFleetCanvas.level !== "fleet" ? { left: ivFleetCanvas.worldWidth / 2 - 110, top: 34, right: ivFleetCanvas.worldWidth / 2 + 110, bottom: 104 } : { left: Infinity, top: Infinity, right: 0, bottom: 0 };
    const bounds = nodes.reduce((box, node) => ({ left: Math.min(box.left, node.x), top: Math.min(box.top, node.y), right: Math.max(box.right, node.x + node.width), bottom: Math.max(box.bottom, node.y + node.height) }), anchor);
    const left = nodes.length ? bounds.left : 0, top = nodes.length ? bounds.top : 0;
    const width = nodes.length ? bounds.right - left : ivFleetCanvas.worldWidth;
    const height = nodes.length ? bounds.bottom - top : ivFleetCanvas.worldHeight;
    ivFleetCanvas.scale = Math.max(.00001, Math.min(1.25,
      (stage.clientWidth - padding * 2) / Math.max(1, width),
      (stage.clientHeight - padding * 2) / Math.max(1, height)));
    ivFleetCanvas.offsetX = (stage.clientWidth - width * ivFleetCanvas.scale) / 2 - left * ivFleetCanvas.scale;
    ivFleetCanvas.offsetY = (stage.clientHeight - height * ivFleetCanvas.scale) / 2 - top * ivFleetCanvas.scale;
    ivFleetViewportUserAdjusted = false;
    if (ivFleetCanvas.nodes.length) ivFleetViewportInitialized = true;
    ivDrawFleet();
  }

  function ivFleetHit(event) {
    const stage = ports.dom.document().getElementById("iv-fleet-stage");
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left - ivFleetCanvas.offsetX) / ivFleetCanvas.scale;
    const y = (event.clientY - rect.top - ivFleetCanvas.offsetY) / ivFleetCanvas.scale;
    return ivFleetCanvas.nodes.find((node) => x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) || null;
  }

  function ivRenderFleetInspector() {
    const inspector = ports.dom.document().getElementById("iv-fleet-inspector");
    if (!inspector) return;
    const applyInspector = (markup) => ports.liveContent(inspector, markup, JSON.stringify([ivFleetSelection.kind, [...ivFleetSelection.ids].sort(), ivFleetScope.kind, ivFleetScope.id]));
    // Polling may refresh data while a backup choice is being made. Keep the
    // actual select node, open menu, focus and value until the user finishes.
    if (inspector.contains(ports.dom.document().activeElement) && ports.dom.document().activeElement?.matches?.("input,select,textarea")) return;
    const data = ivFleetData(), catalog = ivFleetCatalog();
    const summary = ivFleetPayload?.summary || {}, facets = ivFleetPayload?.topology?.facets || {};
    const row = (label, value) => `<div><dt>${ports.text.escape(label)}</dt><dd>${ports.text.escape(value ?? "Not reported")}</dd></div>`;
    const applied = (value) => `<details class="iv-fleet-applied"><summary>Applied state</summary><pre>${ports.text.escape(JSON.stringify(value || {}, null, 2))}</pre></details>`;
    const selected = ivFleetSelection.kind === "launcher"
      ? data.launchers.filter((item) => ivFleetSelection.ids.has(item.id))
      : data.agents.filter((item) => ivFleetSelection.ids.has(item.id));
    const action = (name, icon, handler, options = {}) => `<button type="button" onclick="${handler}" ${options.primary ? 'data-primary="true"' : ""} ${options.danger ? 'data-danger="true"' : ""}><i data-lucide="${icon === "terminal" ? "clipboard-copy" : icon}"></i>${ports.text.escape(name)}</button>`;
    if (!selected.length) {
      applyInspector(`<div class="iv-fleet-inspector-head"><span>Telemetry scope</span><strong>${ports.text.escape(ivFleetScope.label)}</strong><small>${ivFleetScope.kind === "fleet" ? "Operational pages are showing the entire fleet." : "Operational views follow this scope. Clear it to see the entire fleet."}</small></div><dl class="iv-fleet-detail-grid">${row("Launchers", Number(summary.hosts || data.launchers.length).toLocaleString())}${row("Workloads", Number(summary.services || data.agents.length).toLocaleString())}${row("Capacity", Number(facets.capacity || 0).toLocaleString())}${row("Needs attention", Number(summary.unhealthy_entities || 0).toLocaleString())}</dl><div class="iv-fleet-inspector-note">Click a launcher to open its rollout. Ctrl-click selects multiple peers. Right-click opens commands. Drag nodes to reorder them.</div>${ivFleetScope.kind === "fleet" ? "" : `<div class="iv-fleet-inspector-actions">${action("Clear scope", "scan", "ivClearFleetScope()", { primary: true })}</div>`}`);
    } else if (selected.length > 1) {
      const label = ivFleetSelection.kind === "launcher" ? "Launchers" : "Workloads";
      applyInspector(`<div class="iv-fleet-inspector-head"><span>Action selection</span><strong>${selected.length.toLocaleString()} ${label}</strong><small>Commands use the same protected API and generate one receipt per target.</small></div><dl class="iv-fleet-detail-grid">${row("Selected", selected.length.toLocaleString())}${row("Online", selected.filter((item) => item.status === "online").length.toLocaleString())}${row("Offline", selected.filter((item) => item.status !== "online").length.toLocaleString())}${row("Kind", label)}</dl><div class="iv-fleet-inspector-actions">${ivFleetSelection.kind === "launcher" ? [action("Restart", "rotate-cw", "ivFleetRunSelection('restart')", { primary: true }), action("Restart APIs", "server-cog", "ivFleetRunSelection('restart-agents')"), action("Diagnose", "gauge", "ivFleetRunSelection('capacity-diagnostic')"), action("Stop APIs", "server-off", "ivFleetRunSelection('stop-agents')", { danger: true })].join("") : [action("Restart", "rotate-cw", "ivFleetRunSelection('restart')", { primary: true }), action("Stop", "square", "ivFleetRunSelection('stop')", { danger: true })].join("")}</div><div class="iv-fleet-selection-note">Click an empty grid cell to clear the selection and return to the entire fleet.</div>`);
    } else if (ivFleetSelection.kind === "launcher") {
      const nav = selected[0] || {};
      const host = catalog.hosts.find((item) => String(item.host_id) === nav.id) || nav;
      const backupCandidates = data.launchers
        .filter((item) => item.id !== nav.id)
        .slice()
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
      const selectedBackupId = String(host.failover_host_id || nav.failover_host_id || "");
      const selectedBackup = data.launchers.find((item) => item.id === selectedBackupId);
      const backupOptions = backupCandidates.map((item) => `<option value="${ports.text.escape(item.id)}" ${item.id === selectedBackupId ? "selected" : ""}>${ports.text.escape(item.label || item.id)}</option>`).join("");
      const backupControl = `<div class="iv-fleet-backup-control"><label for="iv-fleet-backup-select"><span>Backup candidate (reference)</span><select id="iv-fleet-backup-select" onchange="ivFleetSetBackupServer(this.value)" ${backupCandidates.length ? "" : "disabled"}><option value="">${backupCandidates.length ? "No candidate selected" : "Add another launcher first"}</option>${backupOptions}</select></label><p>${backupCandidates.length ? "Records a candidate for operator planning only. It does not move workloads automatically; check the source and target before explicit placement." : "A candidate must be a different launcher. Automatic cross-server recovery is unavailable."}</p></div>`;
      applyInspector(`<div class="iv-fleet-inspector-head"><span>Launcher · telemetry applied</span><strong>${ports.text.escape(nav.label || nav.id)}</strong><small>${ports.text.escape(nav.id)}</small></div><dl class="iv-fleet-detail-grid">${row("Status", host.status)}${row("Region", host.region)}${row("Rollout", `#${nav.order || host.rollout_order || 1}`)}${row("Delay", `${nav.delay_seconds || host.rollout_delay_seconds || 0}s`)}${row("Workloads", nav.agent_count || (host.assigned_agent_ids || []).length || 0)}${row("Capacity", host.max_apis || nav.capacity || 0)}${row("Backup", selectedBackup?.label || "Not selected")}${row("Draining", host.draining ? "Yes" : "No")}</dl>${backupControl}<div class="iv-fleet-inspector-actions">${action("Install command", "terminal", "ivFleetOpenSelectedInstall()", { primary: true })}${action("Restart", "rotate-cw", "ivFleetRunSelection('restart')")}${action("Diagnose", "gauge", "ivFleetRunSelection('capacity-diagnostic')")}</div>${applied({ labels: host.labels || [], failover_host_id: host.failover_host_id || null, runtime_status: host.runtime_status || {}, current_command_receipt: host.current_command_receipt || null })}`);
    } else {
      const nav = selected[0] || {};
      const agent = catalog.agents.find((item) => String(item.service_id || item.agent_id) === nav.id) || nav;
      const host = catalog.hosts.find((item) => String(item.host_id) === String(nav.host_id || agent.launcher_host_id))
        || data.launchers.find((item) => item.id === nav.host_id);
      const evidence = ports.evidence.optional(agent, host);
      applyInspector(`<div class="iv-fleet-inspector-head"><span>Workload · telemetry applied</span><strong>${ports.text.escape(nav.label || nav.id)}</strong><small>${ports.text.escape(nav.id)}</small></div><dl class="iv-fleet-detail-grid">${row("Agent connection", agent.status)}${row("App state", evidence?.label || "Health not reported")}${row("Runtime", agent.runtime_profile || nav.runtime)}${row("Rollout", `#${nav.order || 1}`)}${row("Delay", `${nav.delay_seconds || 0}s`)}${row("Launcher", nav.host_id || agent.launcher_host_id)}${row("Contract", agent.payload_hash || nav.payload_hash || "Not attached")}${row("Heartbeat", agent.last_heartbeat || nav.last_heartbeat || "Not reported")}${row("CPU / memory", `${agent.metrics?.cpu || 0}% / ${agent.metrics?.memory || 0}%`)}</dl><div class="iv-fleet-inspector-note">${ports.text.escape(evidence?.explanation || "Agent connection and app health are separate.")}<br>${ports.text.escape(evidence?.ageText || "Report ages unavailable")}</div><div class="iv-fleet-inspector-actions">${action("Runtime contract", "file-search", "ivFleetOpenSelectedContract()", { primary: true })}${action("Restart", "rotate-cw", "ivFleetRunSelection('restart')")}${action("Runtime logs", "terminal", "ivFleetOpenSelectedLogs()")}</div>${applied({ metrics: agent.metrics || {}, runtime: agent.runtime || {}, payload_hash: agent.payload_hash || nav.payload_hash || "" })}`);
    }
    ports.icons.refresh();
  }

  function ivSyncFleetSelection() {
    const ids = [...ivFleetSelection.ids];
    ports.selection.sync(() => ivFleetSelection.kind, ids);
  }

  function ivClearFleetSelection() {
    ivFleetSelection = { kind: "", ids: new Set() };
    ivFleetCanvas.agentId = "";
    ivSyncFleetSelection();
    ivSetFleetScope({ kind: "fleet", label: "Entire fleet" });
  }

  function ivApplyFleetNodeScope(node) {
    if (!node) return;
    if (node.kind === "launcher") {
      ivSetFleetScope({ kind: "launcher", id: node.id, label: node.label || node.id });
      return;
    }
    ivSetFleetScope({
      kind: "agent",
      id: node.id,
      hostId: node.host_id || "",
      label: node.label || node.id,
    });
  }

  function ivSelectFleetNode(node, event = {}) {
    if (!node) return ivClearFleetSelection();
    const toggle = !!(event.ctrlKey || event.metaKey);
    ports.timing.cancel(ivFleetCanvas.clickTimer);
    if (!toggle || ivFleetSelection.kind !== node.kind) {
      ivFleetSelection = { kind: node.kind, ids: new Set([node.id]) };
    } else if (ivFleetSelection.ids.has(node.id)) {
      ivFleetSelection.ids.delete(node.id);
      if (!ivFleetSelection.ids.size) ivFleetSelection.kind = "";
    } else ivFleetSelection.ids.add(node.id);
    ivFleetCanvas.agentId = node.kind === "agent" && ivFleetSelection.ids.has(node.id) ? node.id : "";
    ivSyncFleetSelection();
    if (!toggle && ivFleetSelection.ids.size === 1) ivApplyFleetNodeScope(node);
    else {
      const data = ivFleetData(), selected = [...ivFleetSelection.ids];
      const hostIds = ivFleetSelection.kind === "launcher" ? selected : [...new Set(data.agents.filter((item) => selected.includes(item.id)).map((item) => item.host_id))];
      const ids = ivFleetSelection.kind === "launcher" ? data.agents.filter((item) => selected.includes(item.host_id)).map((item) => item.id) : selected;
      ivSetFleetScope({ kind: "selection", ids, hostIds, selectionType: ivFleetSelection.kind, label: selected.length ? `${selected.length} selected ${ivFleetSelection.kind === "launcher" ? "servers" : "workloads"}` : "No workloads selected" });
      ivRenderFleetInspector();
      ivDrawFleet();
    }
    if (node.kind === "launcher" && !toggle) {
      ports.timing.cancel(ivFleetCanvas.clickTimer);
      ivFleetCanvas.clickTimer = ports.timing.after(() => {
        ivFleetCanvas.level = "launcher";
        ivFleetCanvas.launcherId = node.id;
        ivUpdateFleetChrome();
        ivBuildFleetNodes();
        ports.timing.frame(ivFitFleet);
      }, 210);
    }
  }

  function ivRolloutPlanSnapshot() {
    const data = ivFleetData(), catalog = ivFleetCatalog();
    const source = ports.status.latest()?.rollout_plan || {};
    const launcherSource = new Map((source.launcher_order || []).map((item) => [String(item.host_id || ""), item]));
    const agentSource = new Map((source.api_order || []).map((item) => [String(item.agent_id || ""), item]));
    const hosts = new Map(catalog.hosts.map((item) => [String(item.host_id || ""), item]));
    return {
      launcher_order: data.launchers.map((item, index) => {
        const prior = launcherSource.get(item.id) || {}, host = hosts.get(item.id) || {};
        return {
          host_id: item.id,
          order: Number(prior.order || item.order || index + 1),
          delay_seconds: Number(prior.delay_seconds ?? item.delay_seconds ?? 0),
          max_apis: Number(host.max_apis || item.capacity || 25),
          weight: Number(host.weight || 100),
          failover_host_id: host.failover_host_id || null,
        };
      }),
      api_order: data.agents.map((item, index) => {
        const prior = agentSource.get(item.id) || {};
        return {
          agent_id: item.id,
          launcher_host_id: prior.launcher_host_id || item.host_id || "",
          order: Number(prior.order || item.order || index + 1),
          delay_seconds: Number(prior.delay_seconds ?? item.delay_seconds ?? 0),
        };
      }),
    };
  }

  function ivApplyRolloutPlan(plan) {
    const hoveredId = ivFleetCanvas.hovered?.id || "";
    const launcherMap = new Map((plan.launcher_order || []).map((item) => [String(item.host_id || ""), item]));
    const agentMap = new Map((plan.api_order || []).map((item) => [String(item.agent_id || ""), item]));
    const data = ivFleetData(), catalog = ivFleetCatalog();
    data.launchers.forEach((item) => {
      const next = launcherMap.get(item.id);
      if (!next) return;
      item.order = Number(next.order || item.order || 1);
      item.delay_seconds = Number(next.delay_seconds || 0);
      item.capacity = Number(next.max_apis || item.capacity || 25);
      item.weight = Number(next.weight || item.weight || 100);
      item.failover_host_id = next.failover_host_id || null;
    });
    data.agents.forEach((item) => {
      const next = agentMap.get(item.id);
      if (!next) return;
      item.order = Number(next.order || item.order || 1);
      item.delay_seconds = Number(next.delay_seconds || 0);
      item.host_id = next.launcher_host_id || item.host_id;
    });
    catalog.hosts.forEach((item) => {
      const next = launcherMap.get(String(item.host_id || ""));
      if (!next) return;
      item.rollout_order = Number(next.order || item.rollout_order || 1);
      item.rollout_delay_seconds = Number(next.delay_seconds || 0);
      item.max_apis = Number(next.max_apis || item.max_apis || 25);
      item.weight = Number(next.weight || item.weight || 100);
      item.failover_host_id = next.failover_host_id || null;
    });
    if (ports.status.latest()) ports.status.latest().rollout_plan = plan;
    ivBuildFleetNodes();
    ivFleetCanvas.hovered = hoveredId ? ivFleetCanvas.nodes.find((item) => item.id === hoveredId) || null : null;
    ivFleetCanvas.dropTarget = null;
    const tooltip = ports.dom.document().getElementById("iv-fleet-tooltip");
    if (tooltip) {
      tooltip.hidden = !ivFleetCanvas.hovered;
      if (ivFleetCanvas.hovered) {
        const node = ivFleetCanvas.hovered;
        tooltip.innerHTML = `<strong>${ports.text.escape(node.label)}</strong><span>Rollout #${Number(node.order || 0).toLocaleString()} - starts after ${Number(node.delay_seconds || 0).toLocaleString()}s</span><small>${ports.text.escape(node.status || "unknown")}${node.region ? ` - ${ports.text.escape(node.region)}` : node.runtime ? ` - ${ports.text.escape(node.runtime)}` : ""}</small>`;
      }
    }
    ivRenderFleetInspector();
    ivUpdateFleetChrome();
    ivDrawFleet();
  }

  function ivPersistRolloutPlan(plan, label) {
    const save = async (totp = "") => {
      const headers = { "Content-Type": "application/json" };
      if (!(ports.auth.isDemo())) headers["X-TOTP-Auth"] = totp;
      const response = await ports.transport.request("/client/api/rollout/order", {
        method: "POST",
        headers,
        body: JSON.stringify({ rollout_plan: plan }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Could not save rollout plan.");
      ivApplyRolloutPlan(payload.rollout_plan || plan);
      ports.notifications.available() && ports.notifications.show(label, "success");
      if (ports.refresh.available()) ports.refresh.request({ force: true });
    };
    const run = async (totp = "") => {
      try { await save(totp); }
      catch (error) {
        ports.notifications.available() && ports.notifications.show(error.message || "Could not save rollout plan.", "error");
        if (ivFleetPayload) ports.dispatch.renderFleetIntelligence(ivFleetPayload);
      }
    };
    if (ports.auth.isDemo()) return run();
    if (ports.auth.hasPrompt()) return ports.auth.prompt("Save fleet rollout plan", async (totp) => run(totp));
    return run();
  }

  function ivCommitFleetReorder(source, target) {
    if (!source || !target || source.kind !== target.kind || source.id === target.id) return;
    const plan = ivRolloutPlanSnapshot();
    const key = source.kind === "launcher" ? "launcher_order" : "api_order";
    const idKey = source.kind === "launcher" ? "host_id" : "agent_id";
    const ordered = plan[key].slice().sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const from = ordered.findIndex((item) => String(item[idKey]) === source.id);
    const to = ordered.findIndex((item) => String(item[idKey]) === target.id);
    if (from < 0 || to < 0) return;
    [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
    ordered.forEach((item, index) => { item.order = index + 1; });
    plan[key] = ordered;
    ivPersistRolloutPlan(plan, `${source.kind === "launcher" ? "Launcher" : "Workload"} rollout order saved.`);
  }

  const ivFleetSetBackupServer = (backupId) => {
    if (ivFleetSelection.kind !== "launcher" || ivFleetSelection.ids.size !== 1) return;
    const hostId = [...ivFleetSelection.ids][0];
    const normalizedBackupId = String(backupId || "");
    const data = ivFleetData();
    if (normalizedBackupId === hostId || (normalizedBackupId && !data.launchers.some((item) => item.id === normalizedBackupId))) {
      ports.notifications.available() && ports.notifications.show("Choose a different connected launcher as the backup server.", "error");
      ivRenderFleetInspector();
      return;
    }
    const plan = ivRolloutPlanSnapshot();
    const launcher = plan.launcher_order.find((item) => String(item.host_id || "") === hostId);
    if (!launcher) return;
    launcher.failover_host_id = normalizedBackupId || null;
    const backup = data.launchers.find((item) => item.id === normalizedBackupId);
    ivPersistRolloutPlan(plan, normalizedBackupId ? `${backup?.label || "Launcher"} saved as a backup candidate only; no automatic move enabled.` : "Backup candidate cleared.");
  };

  const ivFleetOpenBackupSelector = () => {
    ivCloseFleetMenu();
    const select = ports.dom.document().getElementById("iv-fleet-backup-select");
    if (!select) return;
    select.scrollIntoView({ block: "nearest", behavior: "smooth" });
    select.focus({ preventScroll: true });
  };

  function ivOpenDelayEditor(node) {
    if (!node) return;
    ports.timing.cancel(ivFleetCanvas.clickTimer);
    const stage = ports.dom.document().getElementById("iv-fleet-stage");
    if (!stage) return;
    stage.querySelector(".iv-fleet-delay-editor")?.remove();
    const input = ports.dom.document().createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "86400";
    input.step = "1";
    input.value = String(Number(node.delay_seconds || 0));
    input.className = "iv-fleet-delay-editor";
    input.setAttribute("aria-label", `Rollout delay for ${node.label}`);
    input.style.left = `${Math.max(8, ivFleetCanvas.offsetX + (node.x + node.width - 80) * ivFleetCanvas.scale)}px`;
    input.style.top = `${Math.max(8, ivFleetCanvas.offsetY + (node.y + node.height - 31) * ivFleetCanvas.scale)}px`;
    let settled = false;
    const finish = (commit) => {
      if (settled) return;
      settled = true;
      const next = Math.max(0, Math.min(86400, Math.round(Number(input.value || 0))));
      input.remove();
      if (!commit || next === Number(node.delay_seconds || 0)) return;
      const plan = ivRolloutPlanSnapshot();
      const list = node.kind === "launcher" ? plan.launcher_order : plan.api_order;
      const idKey = node.kind === "launcher" ? "host_id" : "agent_id";
      const item = list.find((entry) => String(entry[idKey] || "") === node.id);
      if (!item) return;
      item.delay_seconds = next;
      ivPersistRolloutPlan(plan, `${node.label} delay set to ${next}s.`);
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); finish(true); }
      if (event.key === "Escape") { event.preventDefault(); finish(false); }
    });
    input.addEventListener("blur", () => finish(true));
    stage.appendChild(input);
    input.focus();
    input.select();
  }

  function ivFleetMenu() {
    let menu = ports.dom.document().getElementById("iv-fleet-context-menu");
    if (menu) return menu;
    menu = ports.dom.document().createElement("div");
    menu.id = "iv-fleet-context-menu";
    menu.className = "iv-fleet-context-menu";
    menu.hidden = true;
    ports.dom.document().body.appendChild(menu);
    return menu;
  }

  function ivCloseFleetMenu() {
    const menu = ports.dom.document().getElementById("iv-fleet-context-menu");
    if (menu) menu.hidden = true;
  }

  function ivOpenFleetContextMenu(event, node) {
    if (!node) return;
    ports.guides.closeFeature({ restoreFocus: false });
    ports.guides.closeDemo({ restoreFocus: false });
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (ivFleetSelection.kind !== node.kind || !ivFleetSelection.ids.has(node.id)) {
      ivFleetSelection = { kind: node.kind, ids: new Set([node.id]) };
      ivSyncFleetSelection();
      ivRenderFleetInspector();
      ivDrawFleet();
    }
    const menu = ivFleetMenu();
    const many = ivFleetSelection.ids.size > 1;
    const item = (label, icon, action, danger = false) => `<button type="button" onclick="ivFleetInvokeAction('${action}')" ${danger ? 'data-danger="true"' : ""}><i data-lucide="${icon === "terminal" ? "clipboard-copy" : icon}"></i>${ports.text.escape(label)}</button>`;
    menu.innerHTML = `<div class="iv-fleet-context-menu-label">${many ? `${ivFleetSelection.ids.size} selected` : ports.text.escape(node.label)}</div>${node.kind === "launcher" ? [!many ? item("Choose backup server", "shield-check", "backup") : "", !many ? item("Deployment command", "terminal", "install") : "", item("Restart launcher", "rotate-cw", "restart"), item("Restart workloads", "server-cog", "restart-agents"), item("Capacity diagnostic", "gauge", "capacity-diagnostic"), item("Stop workloads", "server-off", "stop-agents", true)].join("") : [!many ? item("Runtime contract", "file-search", "contract") : "", !many ? item("Open app logs", "scroll-text", "logs") : "", item("Restart workload", "rotate-cw", "restart"), item("Stop workload", "square", "stop", true)].join("")}`;
    menu.hidden = false;
    const width = 216, height = menu.offsetHeight || 220;
    menu.style.left = `${Math.min(ports.viewport.width() - width - 8, Math.max(8, event?.clientX || 8))}px`;
    menu.style.top = `${Math.min(ports.viewport.height() - height - 8, Math.max(8, event?.clientY || 8))}px`;
    ports.icons.refresh();
  }

  const ivFleetInvokeAction = (action) => {
    ivCloseFleetMenu();
    if (action === "backup") return ports.dispatch.ivFleetOpenBackupSelector();
    if (action === "install") return ports.dispatch.ivFleetOpenSelectedInstall();
    if (action === "contract") return ports.dispatch.ivFleetOpenSelectedContract();
    if (action === "logs") return ports.dispatch.ivFleetOpenSelectedLogs();
    ports.dispatch.ivFleetRunSelection(action);
  };

  const ivFleetRunSelection = (command) => {
    if (!ivFleetSelection.ids.size) return;
    ivSyncFleetSelection();
    if (ivFleetSelection.kind === "launcher" && ports.actions.canCommandLaunchers()) ports.actions.commandLaunchers(command);
    if (ivFleetSelection.kind === "agent" && ports.actions.canCommandWorkloads()) ports.actions.commandWorkloads(command);
  };

  const ivClearFleetScope = () => ivSetFleetScope({ kind: "fleet", label: "Entire fleet" });
  const ivFleetOpenSelectedInstall = () => {
    if (ivFleetSelection.kind !== "launcher" || ivFleetSelection.ids.size !== 1) return;
    ports.dispatch.openLauncherInstallDialog([...ivFleetSelection.ids][0]);
  };
  const ivFleetOpenSelectedContract = () => {
    if (ivFleetSelection.kind !== "agent" || ivFleetSelection.ids.size !== 1) return;
    const id = [...ivFleetSelection.ids][0];
    if (ports.actions.canOpenContract()) ports.actions.openContract(id);
  };
  const ivFleetOpenSelectedLogs = () => {
    if (ivFleetSelection.kind !== "agent" || ivFleetSelection.ids.size !== 1) return;
    const id = [...ivFleetSelection.ids][0];
    if (ports.actions.canOpenLogs()) ports.actions.openLogs(id);
    else if (ports.actions.canSwitchView()) ports.actions.switchView("app-logs");
  };

  const openLauncherInstallDialog = (hostId) => {
    // Every server entry point uses the same curl setup flow, including its
    // first connection. Enrollment is performed there, not a prerequisite to it.
    // Select first so a fresh workspace never generates the default host's
    // installer when the operator clicked another host.
    if (ports.guides.hasGlobalClose()) ports.guides.closeGlobal();
    ports.dispatch.closeLauncherInstallDialog();
    if (ports.actions.canSelectHost()) ports.actions.selectHost(hostId);
    if (ports.actions.canSwitchView()) ports.actions.switchView("trust-receipts");
    ports.timing.after(() => {
      ports.dom.document().getElementById("release-approval-panel")?.scrollIntoView({ behavior: "auto", block: "start" });
      ports.dom.document().getElementById("trust-console-download")?.focus();
    }, 0);
  };
  const closeLauncherInstallDialog = () => {
    const dialog = ports.dom.document().getElementById("launcher-command-dialog");
    if (!dialog) return;
    delete dialog.dataset.open;
    dialog.setAttribute("aria-hidden", "true");
    ports.dom.document().documentElement.classList.remove("iv-modal-open");
  };
  const ivOpenLauncherRowMenu = (event, hostId) => {
    const data = ivFleetData();
    const nav = data.launchers.find((item) => item.id === String(hostId)) || { id: String(hostId), label: String(hostId), kind: "launcher" };
    ivOpenFleetContextMenu(event, { ...nav, kind: "launcher" });
  };

  function ivBindFleetNavigator() {
    if (ivFleetBound) return;
    const stage = ports.dom.document().getElementById("iv-fleet-stage");
    const back = ports.dom.document().getElementById("iv-fleet-back");
    const fit = ports.dom.document().getElementById("iv-fleet-fit");
    const search = ports.dom.document().getElementById("iv-fleet-search");
    if (!stage) return;
    ivFleetBound = true;
    back?.addEventListener("click", ivFleetBack);
    fit?.addEventListener("click", ivFitFleet);
    search?.addEventListener("input", () => {
      ivFleetCanvas.search = search.value.trim().toLowerCase();
      const match = ivFleetCanvas.nodes.find((node) => `${node.label} ${node.id}`.toLowerCase().includes(ivFleetCanvas.search));
      ivFleetCanvas.hovered = match || null;
      if (match && ivFleetCanvas.search) {
        ivFleetViewportUserAdjusted = true;
        ivFleetCanvas.offsetX = stage.clientWidth / 2 - (match.x + match.width / 2) * ivFleetCanvas.scale;
        ivFleetCanvas.offsetY = stage.clientHeight / 2 - (match.y + match.height / 2) * ivFleetCanvas.scale;
      }
      ivDrawFleet();
    });
    search?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && ivFleetCanvas.hovered) ivSelectFleetNode(ivFleetCanvas.hovered);
    });
    stage.addEventListener("pointerdown", (event) => {
      if (event.button === 3) { event.preventDefault(); ivFleetBack(); return; }
      if (event.button !== 0) return;
      ivCloseFleetMenu();
      const node = ivFleetHit(event);
      ivFleetCanvas.dragging = {
        kind: node ? "node" : "canvas", node,
        x: event.clientX, y: event.clientY,
        offsetX: ivFleetCanvas.offsetX, offsetY: ivFleetCanvas.offsetY,
        moved: false,
      };
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener("pointermove", (event) => {
      if (ivFleetCanvas.dragging) {
        const dx = event.clientX - ivFleetCanvas.dragging.x;
        const dy = event.clientY - ivFleetCanvas.dragging.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) ivFleetCanvas.dragging.moved = true;
        if (ivFleetCanvas.dragging.kind === "node") {
          const target = ivFleetHit(event);
          ivFleetCanvas.dropTarget = target && target.kind === ivFleetCanvas.dragging.node.kind && target.id !== ivFleetCanvas.dragging.node.id ? target : null;
          stage.style.cursor = ivFleetCanvas.dragging.moved ? "grabbing" : "pointer";
          ivDrawFleet();
          return;
        }
        ivFleetCanvas.offsetX = ivFleetCanvas.dragging.offsetX + dx;
        ivFleetCanvas.offsetY = ivFleetCanvas.dragging.offsetY + dy;
        if (ivFleetCanvas.dragging.moved) ivFleetViewportUserAdjusted = true;
        ivDrawFleet();
        return;
      }
      const node = ivFleetHit(event);
      ivFleetCanvas.hovered = node;
      stage.style.cursor = node ? "pointer" : "grab";
      const tooltip = ports.dom.document().getElementById("iv-fleet-tooltip");
      if (tooltip) {
        tooltip.hidden = !node;
        if (node) {
          tooltip.innerHTML = `<strong>${ports.text.escape(node.label)}</strong><span>Rollout #${Number(node.order || 0).toLocaleString()} - starts after ${Number(node.delay_seconds || 0).toLocaleString()}s</span><small>${ports.text.escape(node.evidence?.label || node.status || "unknown")}${node.region ? ` - ${ports.text.escape(node.region)}` : node.runtime ? ` - ${ports.text.escape(node.runtime)}` : ""}</small>${node.evidence ? `<small>${ports.text.escape(node.evidence.explanation)}</small><small>${ports.text.escape(node.evidence.ageText)}</small>` : ""}`;
          const rect = stage.getBoundingClientRect();
          tooltip.style.left = `${Math.min(stage.clientWidth - 250, Math.max(12, event.clientX - rect.left + 14))}px`;
          tooltip.style.top = `${Math.min(Math.max(12, stage.clientHeight - (tooltip.offsetHeight || 92) - 12), Math.max(12, event.clientY - rect.top + 14))}px`;
        }
      }
      ivDrawFleet();
    });
    stage.addEventListener("pointerup", (event) => {
      const drag = ivFleetCanvas.dragging;
      ivFleetCanvas.dragging = null;
      const dropTarget = ivFleetCanvas.dropTarget;
      ivFleetCanvas.dropTarget = null;
      if (!drag) return;
      if (drag.kind === "node") {
        if (drag.moved && dropTarget) ivCommitFleetReorder(drag.node, dropTarget);
        else if (!drag.moved) ivSelectFleetNode(drag.node, event);
      } else if (!drag.moved) ivClearFleetSelection();
      ivDrawFleet();
    });
    stage.addEventListener("pointerleave", () => {
      if (ivFleetCanvas.dragging) return;
      ivFleetCanvas.hovered = null;
      const tooltip = ports.dom.document().getElementById("iv-fleet-tooltip");
      if (tooltip) tooltip.hidden = true;
      ivDrawFleet();
    });
    stage.addEventListener("contextmenu", (event) => {
      const node = ivFleetHit(event);
      if (node) ivOpenFleetContextMenu(event, node);
    });
    stage.addEventListener("dblclick", (event) => {
      const node = ivFleetHit(event);
      if (!node) return;
      event.preventDefault();
      ivOpenDelayEditor(node);
    });
    stage.addEventListener("wheel", (event) => {
      event.preventDefault();
      ivFleetViewportUserAdjusted = true;
      const rect = stage.getBoundingClientRect();
      const mouseX = event.clientX - rect.left, mouseY = event.clientY - rect.top;
      const worldX = (mouseX - ivFleetCanvas.offsetX) / ivFleetCanvas.scale;
      const worldY = (mouseY - ivFleetCanvas.offsetY) / ivFleetCanvas.scale;
      const next = Math.max(.00001, Math.min(2.2, ivFleetCanvas.scale * (event.deltaY > 0 ? .88 : 1.12)));
      ivFleetCanvas.offsetX = mouseX - worldX * next;
      ivFleetCanvas.offsetY = mouseY - worldY * next;
      ivFleetCanvas.scale = next;
      ivDrawFleet();
    }, { passive: false });
    stage.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !event.target.closest("input,textarea")) {
        event.preventDefault();
        if (!ports.dom.document().getElementById("iv-fleet-context-menu")?.hidden) return ivCloseFleetMenu();
        if (ivFleetSelection.ids.size) return ivClearFleetSelection();
        ivFleetBack();
      }
      if (event.key === "Backspace" && !event.target.closest("input,textarea")) {
        event.preventDefault(); ivFleetBack();
      }
    });
    ports.dom.document().addEventListener("pointerdown", (event) => {
      if (!event.target.closest("#iv-fleet-context-menu")) ivCloseFleetMenu();
    });
    ports.dom.document().addEventListener("keydown", (event) => {
      if (event.key === "Escape" && ports.dom.document().getElementById("launcher-command-dialog")?.dataset.open === "true") {
        ports.dispatch.closeLauncherInstallDialog();
      }
    });
    ports.events.addEventListener("infraveil:themechange", () => ports.timing.frame(ivDrawFleet));
    ports.timing.observeResize(() => {
      // User-adjusted layouts keep node coordinates and pan/zoom stable. A fitted
      // viewport follows a real visible resize and new inventory automatically.
      if (!ivFleetViewportUserAdjusted) { ivBuildFleetNodes(); ivFitFleet(); }
      else ivDrawFleet();
    }, stage);
  }

  const renderFleetIntelligence = function renderFleetNavigator(intelligence) {
    if (!intelligence) return;
    ivFleetPayload = intelligence;
    ports.status.publishTopology(intelligence);
    const data = ivFleetData();
    if (ivFleetScope.kind === "launcher" && !data.launchers.some((item) => item.id === ivFleetScope.id)) ivFleetScope = ivNormalizeFleetScope(null);
    if (ivFleetScope.kind === "agent" && !data.agents.some((item) => item.id === ivFleetScope.id)) ivFleetScope = ivNormalizeFleetScope(null);
    if (ivFleetSelection.kind === "launcher") ivFleetSelection.ids = new Set([...ivFleetSelection.ids].filter((id) => data.launchers.some((item) => item.id === id)));
    if (ivFleetSelection.kind === "agent") ivFleetSelection.ids = new Set([...ivFleetSelection.ids].filter((id) => data.agents.some((item) => item.id === id)));
    if (!ivFleetSelection.ids.size) ivFleetSelection.kind = "";
    ivBindFleetNavigator();
    ivSetFleetScope(ivFleetScope, { silent: true });
    ivBuildFleetNodes();
    ivRenderFleetInspector();
    if ((!ivFleetViewportInitialized || !ivFleetViewportUserAdjusted) && ivFleetCanvas.nodes.length) ports.timing.frame(ivFitFleet);
    else ports.timing.frame(ivDrawFleet);
    ports.icons.refresh();
  };

  return Object.freeze({
    restoreScope,
    getFleetScope, getFleetScopeLabel, getFleetAgentScope, setGlobalFleetScope, resetFleetTopology,
    ivFleetSetBackupServer, ivFleetOpenBackupSelector, ivFleetInvokeAction, ivFleetRunSelection, ivClearFleetScope,
    ivFleetOpenSelectedInstall, ivFleetOpenSelectedContract, ivFleetOpenSelectedLogs,
    openLauncherInstallDialog, closeLauncherInstallDialog, ivOpenLauncherRowMenu, renderFleetIntelligence,
    closeMenu: ivCloseFleetMenu,
    isInteracting: () => !!ivFleetCanvas.dragging,
  });
  }
  window.InfraveilUI = window.InfraveilUI || {};
  window.InfraveilUI.fleetNavigator = { createController };
})();
