// Infraveil fleet canvas: exact existing drawing primitives, no graph/application state owner.
(function () {
  "use strict";
  function createRenderer(ports) {
  function ivFleetColors() {
    const style = ports.platform.computedStyle(ports.dom.document().documentElement);
    const value = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    const light = ports.dom.document().documentElement.dataset.theme !== "dark";
    return {
      panel: value("--panel-bg", "#fff"), surface: value("--surface-muted", "#f6f8fb"),
      hover: value("--surface-hover", "#eef3f8"), border: value("--panel-border", "#d0d5dd"),
      grid: value("--input-border", light ? "#bfc7d1" : "#45454a"), gridAlpha: light ? .68 : .48,
      text: value("--text-main", "#101828"), muted: value("--text-muted", "#475467"),
      accent: value("--accent", "#175cd3"), healthy: value("--signal-healthy", "#067647"),
      warning: value("--signal-warning", "#b54708"), critical: value("--signal-critical", "#b42318"),
      bg: value("--bg-body", "#f6f7f9"),
    };
  }

  function ivOctagon(ctx, x, y, width, height) {
    const cut = Math.min(13, height * .23);
    ctx.beginPath();
    ctx.moveTo(x + cut, y); ctx.lineTo(x + width - cut, y); ctx.lineTo(x + width, y + cut);
    ctx.lineTo(x + width, y + height - cut); ctx.lineTo(x + width - cut, y + height);
    ctx.lineTo(x + cut, y + height); ctx.lineTo(x, y + height - cut); ctx.lineTo(x, y + cut); ctx.closePath();
  }

  function ivStatusColor(status, colors) {
    const value = String(status || "").toLowerCase();
    if (["online", "healthy", "completed", "operational"].includes(value)) return colors.healthy;
    if (["starting", "pending", "degraded", "draining", "warning"].includes(value)) return colors.warning;
    return colors.critical;
  }

  function ivCanvasText(ctx, value, maxWidth) {
    let text = String(value || "");
    if (ctx.measureText(text).width <= maxWidth) return text;
    while (text.length > 4 && ctx.measureText(`${text}...`).width > maxWidth) text = text.slice(0, -1);
    return `${text}...`;
  }

  function ivDrawFleet(model) {
    const ivFleetCanvas = model.canvas;
    const readSelection = model.selection;
    const ivFleetData = model.data;
    const canvas = ports.dom.document().getElementById("iv-fleet-canvas");
    const stage = ports.dom.document().getElementById("iv-fleet-stage");
    if (!canvas || !stage) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(2, ports.platform.devicePixelRatio() || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    const colors = ivFleetColors();
    const typography = ports.platform.computedStyle(ports.dom.document().documentElement);
    const sansFont = typography.getPropertyValue("--iv-font-sans").trim() || '"Instrument Sans", Arial, sans-serif';
    const monoFont = typography.getPropertyValue("--iv-font-mono").trim() || 'Consolas, monospace';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.save(); ctx.translate(ivFleetCanvas.offsetX, ivFleetCanvas.offsetY); ctx.scale(ivFleetCanvas.scale, ivFleetCanvas.scale);
    ctx.strokeStyle = colors.grid; ctx.globalAlpha = colors.gridAlpha; ctx.lineWidth = 1 / ivFleetCanvas.scale;
    const gridSize = ivFleetCanvas.scale < .12 ? Math.max(256, 2 ** Math.ceil(Math.log2(32 / ivFleetCanvas.scale))) : ivFleetCanvas.scale < .26 ? 128 : 32;
    const viewportLeft = -ivFleetCanvas.offsetX / ivFleetCanvas.scale;
    const viewportTop = -ivFleetCanvas.offsetY / ivFleetCanvas.scale;
    const viewportRight = (rect.width - ivFleetCanvas.offsetX) / ivFleetCanvas.scale;
    const viewportBottom = (rect.height - ivFleetCanvas.offsetY) / ivFleetCanvas.scale;
    const gridLeft = Math.floor(viewportLeft / gridSize) * gridSize;
    const gridTop = Math.floor(viewportTop / gridSize) * gridSize;
    const gridRight = Math.ceil(viewportRight / gridSize) * gridSize;
    const gridBottom = Math.ceil(viewportBottom / gridSize) * gridSize;
    for (let x = gridLeft; x <= gridRight; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, viewportTop); ctx.lineTo(x, viewportBottom); ctx.stroke(); }
    for (let y = gridTop; y <= gridBottom; y += gridSize) { ctx.beginPath(); ctx.moveTo(viewportLeft, y); ctx.lineTo(viewportRight, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (ivFleetCanvas.level !== "fleet") {
      const launcher = ivFleetData().launchers.find((item) => item.id === ivFleetCanvas.launcherId);
      if (launcher) {
        const anchor = { x: ivFleetCanvas.worldWidth / 2 - 110, y: 34, width: 220, height: 70 };
        const busY = 116;
        ctx.strokeStyle = colors.border; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(anchor.x + anchor.width / 2, anchor.y + anchor.height); ctx.lineTo(anchor.x + anchor.width / 2, busY); ctx.stroke();
        if (ivFleetCanvas.nodes.length) {
          const columnBranches = new Map();
          ivFleetCanvas.nodes.forEach((node) => {
            const centerX = node.x + node.width / 2;
            columnBranches.set(centerX, Math.max(columnBranches.get(centerX) || 0, node.y));
          });
          const branchXs = [...columnBranches.keys()];
          ctx.beginPath(); ctx.moveTo(Math.min(...branchXs), busY); ctx.lineTo(Math.max(...branchXs), busY); ctx.stroke();
          columnBranches.forEach((lastY, centerX) => {
            ctx.beginPath(); ctx.moveTo(centerX, busY); ctx.lineTo(centerX, lastY); ctx.stroke();
          });
        }
        ivOctagon(ctx, anchor.x, anchor.y, anchor.width, anchor.height);
        ctx.fillStyle = colors.surface; ctx.fill(); ctx.strokeStyle = ivStatusColor(launcher.status, colors); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = colors.text; ctx.font = "700 13px " + sansFont;
        ctx.fillText(ivCanvasText(ctx, launcher.label, 180), anchor.x + 16, anchor.y + 28);
        ctx.fillStyle = colors.muted; ctx.font = "10px " + monoFont;
        ctx.fillText(`LAUNCHER ${launcher.order} / ${launcher.agent_count} WORKLOADS`, anchor.x + 16, anchor.y + 50);
      }
    }
    const compactNodes = ivFleetCanvas.scale < .28;
    const densityNodes = ivFleetCanvas.scale < .12;
    ivFleetCanvas.nodes.forEach((node) => {
      const selected = readSelection().kind === node.kind && readSelection().ids.has(node.id);
      const hovered = ivFleetCanvas.hovered?.id === node.id;
      const dropTarget = ivFleetCanvas.dropTarget?.id === node.id;
      ivOctagon(ctx, node.x, node.y, node.width, node.height);
      ctx.fillStyle = densityNodes ? ivStatusColor(node.evidenceStatus, colors) : selected ? colors.hover : colors.panel;
      ctx.globalAlpha = densityNodes ? .82 : 1;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = selected || hovered || dropTarget ? colors.accent : colors.border;
      ctx.lineWidth = (selected ? 2.5 : hovered || dropTarget ? 2 : 1.2) / Math.min(1, ivFleetCanvas.scale);
      ctx.stroke();
      if (densityNodes) return;
      ctx.fillStyle = ivStatusColor(node.evidenceStatus, colors);
      ctx.fillRect(node.x, compactNodes ? node.y : node.y + 13, compactNodes ? node.width : 4, compactNodes ? 8 : node.height - 26);
      if (compactNodes) return;
      ctx.fillStyle = colors.text; ctx.font = "700 12px " + sansFont;
      ctx.fillText(ivCanvasText(ctx, node.label, node.width - 42), node.x + 16, node.y + 25);
      ctx.fillStyle = colors.muted; ctx.font = "9px " + monoFont;
      const detail = node.kind === "launcher" ? `${node.healthy_count || 0} HEALTHY · ${node.unhealthy_count || 0} FAILING · ${node.unknown_count || 0} UNKNOWN` : `#${node.order} ${node.evidence?.label || "Agent report; health unknown"}`;
      const delay = `+${Number(node.delay_seconds || 0)}s`;
      ctx.fillText(ivCanvasText(ctx, detail.toUpperCase(), node.width - (node.kind === "launcher" ? 32 : 76)), node.x + 16, node.y + 45);
      if (node.kind === "launcher") ctx.fillText(`${node.agent_count} ASSIGNED · CAPACITY ${node.capacity}`, node.x + 16, node.y + 64);
      ctx.textAlign = "right";
      ctx.fillText(delay.toUpperCase(), node.x + node.width - 14, node.y + (node.kind === "launcher" ? 64 : 45));
      ctx.textAlign = "left";
    });
    ctx.restore();
  }

  return Object.freeze({ draw: ivDrawFleet });
  }
  window.InfraveilUI = window.InfraveilUI || {};
  window.InfraveilUI.fleetCanvas = { createRenderer };
})();
