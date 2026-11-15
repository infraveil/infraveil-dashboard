// Infraveil fleet identity/selection owner. Ports are supplied by the composition root.
(function () {
  "use strict";
  function createController({ document, storage, workspace, inventory, updateWorkloads }) {
    let currentLauncherHostId = null, launcherUserPinnedHostId = null;
    let selectedLauncherHostIds = new Set(), selectedWorkloadIds = new Set();
    const sessionStorage = storage;
    const window = { get __launcherHosts() { return inventory(); } };
    function updateWorkloadBulkActions() { updateWorkloads(); }
        function launcherHostIdentity(e) {
          if ("object" == typeof e && e)
            return String(
              e.host_id || e.launcher_host_id || e.id || e.name || "",
            ).trim();
          return String(e || "").trim();
        }
        function launcherHostAliases(e) {
          const t = [];
          if ("object" == typeof e && e)
            ["host_id", "launcher_host_id", "id", "name"].forEach((n) => {
              const o = String(e[n] || "").trim();
              o && t.push(o);
            });
          else {
            const n = String(e || "").trim();
            n && t.push(n);
          }
          return [...new Set(t)];
        }
        function launcherHostAliasKey(e) {
          return String(e || "").trim().toLowerCase();
        }
        function launcherHostMatches(e, t) {
          const n = new Set(launcherHostAliases(t).map(launcherHostAliasKey));
          return !!n.size && launcherHostAliases(e).some((e) => n.has(launcherHostAliasKey(e)));
        }
        function canonicalLauncherHostId(e, t = window.__launcherHosts || []) {
          const n = launcherHostIdentity(e);
          if (!n) return "";
          const o = (Array.isArray(t) ? t : []).find((t) => launcherHostMatches(t, e));
          return o ? launcherHostIdentity(o) : n;
        }
        function agentIdentity(e) {
          if ("object" == typeof e && e)
            return String(e.agent_id || e.id || e.name || "").trim();
          return String(e || "").trim();
        }
        function updateLauncherBulkActions() {
          const e = document.getElementById("launcher-bulk-actions"),
            t = document.getElementById("launcher-selected-count");
          if (!e || !t) return;
          const n = selectedLauncherHostIds.size;
          ((t.textContent = `${n} selected`),
            e.classList.toggle("hidden", !n),
            e.classList.toggle("flex", !!n));
          document.querySelectorAll("[data-launcher-select]").forEach((e) => {
            e.checked = selectedLauncherHostIds.has(
              canonicalLauncherHostId(e.getAttribute("data-launcher-select")),
            );
          });
        }
        function applyLauncherSelectionDomState() {
          document.querySelectorAll("[data-launcher-select]").forEach((e) => {
            const t = canonicalLauncherHostId(e.getAttribute("data-launcher-select"));
            e.checked = selectedLauncherHostIds.has(t);
          });
        }
        function launcherSelectionStorageKey() {
          return `infraveil:selected-launchers:${workspace().client_id || workspace().demo_session_key || "workspace"}`;
        }
        function launcherActiveHostStorageKey() {
          return `infraveil:active-launcher-host:${workspace().client_id || workspace().demo_session_key || "workspace"}`;
        }
        function loadStoredCurrentLauncherHost() {
          try {
            return launcherHostIdentity(
              sessionStorage.getItem(launcherActiveHostStorageKey()) || "",
            );
          } catch (e) {
            return "";
          }
        }
        function saveStoredCurrentLauncherHost() {
          try {
            currentLauncherHostId
              ? sessionStorage.setItem(
                  launcherActiveHostStorageKey(),
                  canonicalLauncherHostId(currentLauncherHostId),
                )
              : sessionStorage.removeItem(launcherActiveHostStorageKey());
          } catch (e) {}
        }
        function hostIdSet(e = []) {
          return new Set((Array.isArray(e) ? e : []).map(launcherHostIdentity).filter(Boolean));
        }
        function resolveActiveLauncherHostId(e = []) {
          const t = hostIdSet(e);
          if (!t.size) return "";
          const s = canonicalLauncherHostId(launcherUserPinnedHostId, e);
          if (s && t.has(s)) return s;
          const n = canonicalLauncherHostId(currentLauncherHostId, e);
          if (n && t.has(n)) return n;
          const o = canonicalLauncherHostId(loadStoredCurrentLauncherHost(), e);
          if (o && t.has(o)) return o;
          const r = [...selectedLauncherHostIds].map((t) => canonicalLauncherHostId(t, e)).find((e) => t.has(e));
          if (r) return r;
          return launcherHostIdentity(e[0]);
        }
        function loadStoredLauncherSelection() {
          try {
            const e = JSON.parse(
              sessionStorage.getItem(launcherSelectionStorageKey()) || "[]",
            );
            return Array.isArray(e)
              ? e.map(launcherHostIdentity).filter(Boolean)
              : [];
          } catch (e) {
            return [];
          }
        }
        function saveStoredLauncherSelection() {
          try {
            sessionStorage.setItem(
              launcherSelectionStorageKey(),
              JSON.stringify([...selectedLauncherHostIds].map(launcherHostIdentity).filter(Boolean)),
            );
          } catch (e) {}
        }
        function reconcileDashboardSelections(e = [], t = []) {
          const n = hostIdSet(e);
          loadStoredLauncherSelection().forEach((t) => {
            const o = canonicalLauncherHostId(t, e);
            o && selectedLauncherHostIds.add(o);
          });
          selectedLauncherHostIds = new Set(
            [...selectedLauncherHostIds]
              .map((t) => canonicalLauncherHostId(t, e))
              .filter((e) => e && (!n.size || n.has(e))),
          );
          currentLauncherHostId = resolveActiveLauncherHostId(e);
          const o = new Set(
            (Array.isArray(t) ? t : []).map(agentIdentity).filter(Boolean),
          );
          selectedWorkloadIds = new Set(
            [...selectedWorkloadIds]
              .map(agentIdentity)
              .filter((e) => e && (!o.size || o.has(e))),
          );
          saveStoredLauncherSelection();
          updateLauncherBulkActions();
          updateWorkloadBulkActions();
          applyLauncherSelectionDomState();
        }
        function toggleLauncherHostSelection(e, t, n = null) {
          const o = canonicalLauncherHostId(e);
          if (!o) return;
          t?.stopPropagation();
          null === n
            ? selectedLauncherHostIds.has(o)
              ? selectedLauncherHostIds.delete(o)
              : selectedLauncherHostIds.add(o)
            : n
              ? selectedLauncherHostIds.add(o)
              : selectedLauncherHostIds.delete(o);
          saveStoredLauncherSelection();
          applyLauncherSelectionDomState();
          updateLauncherBulkActions();
        }
    // One facade per backing Set, not a retargeting facade. Captured old aliases
    // keep the old Set after reassignment, exactly like the legacy lexical owner.
    const facades = new WeakMap(), backingSets = new WeakMap();
    function facade(set) {
      if (facades.has(set)) return facades.get(set);
      const result = {
        get size() { return set.size; },
        has(value) { return set.has(value); },
        add(value) { set.add(value); return result; },
        delete(value) { return set.delete(value); },
        clear() { return set.clear(); },
        [Symbol.iterator]() { return set[Symbol.iterator](); },
      };
      Object.freeze(result);
      facades.set(set, result); backingSets.set(result, set);
      return result;
    }
    function backing(value) { return backingSets.get(value) || value; }
    const state = Object.freeze({
      get currentLauncherHostId() { return currentLauncherHostId; },
      set currentLauncherHostId(value) { currentLauncherHostId = value; },
      get launcherUserPinnedHostId() { return launcherUserPinnedHostId; },
      set launcherUserPinnedHostId(value) { launcherUserPinnedHostId = value; },
      get selectedLauncherHostIds() { return facade(selectedLauncherHostIds); },
      set selectedLauncherHostIds(values) { selectedLauncherHostIds = backing(values); },
      get selectedWorkloadIds() { return facade(selectedWorkloadIds); },
      set selectedWorkloadIds(values) { selectedWorkloadIds = backing(values); },
    });
    return Object.freeze({ state, launcherHostIdentity, launcherHostAliases, launcherHostAliasKey, launcherHostMatches, canonicalLauncherHostId, agentIdentity, updateLauncherBulkActions, applyLauncherSelectionDomState, launcherSelectionStorageKey, launcherActiveHostStorageKey, loadStoredCurrentLauncherHost, saveStoredCurrentLauncherHost, hostIdSet, resolveActiveLauncherHostId, loadStoredLauncherSelection, saveStoredLauncherSelection, reconcileDashboardSelections, toggleLauncherHostSelection });
  }
  window.InfraveilUI = window.InfraveilUI || {};
  window.InfraveilUI.fleetSelection = { createController };
})();
