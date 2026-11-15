// Infraveil UI: behavior-preserving live DOM primitives, not a sanitizer.
// Callers own markup trust, refresh scheduling, scope and component lifecycle.
(function () {
  "use strict";

  function ivPatchLiveNode(node, fresh) {
      if (node.nodeType === 3 && fresh.nodeType === 3) { if (node.data !== fresh.data) node.data = fresh.data; return; }
      if (node.nodeType !== fresh.nodeType || node.nodeName !== fresh.nodeName) { node.replaceWith(fresh); return; }
      if (node.nodeType !== 1 || ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName)) return;
      // Native disclosures belong to the operator. Update their contents without
      // deleting/reopening them, and leave editable controls and focus intact.
      Array.from(node.attributes).forEach((attr) => { if (attr.name !== "open" && !fresh.hasAttribute(attr.name)) node.removeAttribute(attr.name); });
      Array.from(fresh.attributes).forEach((attr) => { if (attr.name !== "open" && node.getAttribute(attr.name) !== attr.value) node.setAttribute(attr.name, attr.value); });
      const oldChildren = Array.from(node.childNodes), nextChildren = Array.from(fresh.childNodes);
      nextChildren.forEach((child, index) => { oldChildren[index] ? ivPatchLiveNode(oldChildren[index], child) : node.appendChild(child); });
      oldChildren.slice(nextChildren.length).forEach((child) => child.remove());
  }
  const liveContent = function liveContent(host, markup, identity) {
    if (host.dataset.liveIdentity !== identity) {
      host.innerHTML = markup; host.dataset.liveIdentity = identity; host.__ivLiveMarkup = markup; return;
    }
    if (host.__ivLiveMarkup === markup) return;
    const fresh = host.cloneNode(false); fresh.innerHTML = markup;
    ivPatchLiveNode(host, fresh); host.__ivLiveMarkup = markup;
  };
  const stableLogRows = function stableLogRows(host, content) {
    const staging = typeof content === "string" ? document.createElement(host.tagName || "div") : content;
    if (typeof content === "string") staging.innerHTML = content;
    const key = (node) => node.dataset?.ivRowKey || node.dataset?.workloadRow || node.id || node.querySelector?.("[id]")?.id || "";
    const existing = new Map(Array.from(host.children).filter((node) => key(node)).map((node) => [key(node), node]));
    const wanted = Array.from(staging.children), retained = new Set();
    wanted.forEach((fresh, index) => {
      const node = existing.get(key(fresh)) || fresh;
      if (node !== fresh && node.__ivRenderedMarkup !== fresh.innerHTML) ivPatchLiveNode(node, fresh);
      node.__ivRenderedMarkup = fresh.innerHTML;
      retained.add(node);
      if (host.children[index] !== node) host.insertBefore(node, host.children[index] || null);
    });
    Array.from(host.children).forEach((node) => { if (!retained.has(node)) node.remove(); });
  };
  const liveDom = { patchNode: ivPatchLiveNode, liveContent, stableLogRows };
  window.InfraveilUI = window.InfraveilUI || {};
  window.InfraveilUI.liveDom = liveDom;
})();
