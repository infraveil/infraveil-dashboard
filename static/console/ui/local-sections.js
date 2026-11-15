// Infraveil UI: the existing local-section navigation controller.
// The caller owns content, icons, feature state and when a layout is mounted.
(function () {
  "use strict";

  function createController({ document, icon }) {
    function selectLocalSection(layout, key) {
      if (!layout) return;
      layout.querySelectorAll("[data-iv-local-key]").forEach((button) => {
        const active = button.dataset.ivLocalKey === key;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
      });
      layout.querySelectorAll("[data-iv-local-section]").forEach((section) => {
        const active = section.dataset.ivLocalSection === key;
        section.classList.toggle("active", active);
        section.hidden = !active;
      });
    }

    function createLocalLayout(label, sections, className = "") {
      const layout = document.createElement("div");
      layout.className = `iv-local-layout ${className}`.trim();
      const nav = document.createElement("nav");
      nav.className = "iv-local-nav";
      nav.setAttribute("aria-label", label);
      const panel = document.createElement("div");
      panel.className = "iv-local-panel";

      sections.forEach((section, index) => {
        const button = section.button || document.createElement("button");
        button.type = "button";
        button.dataset.ivLocalKey = section.key;
        button.classList.toggle("active", index === 0);
        button.setAttribute("aria-selected", index === 0 ? "true" : "false");
        if (!section.button) {
          button.append(icon(section.icon || "circle", "w-4 h-4"), document.createTextNode(section.label));
        }
        button.addEventListener("click", () => selectLocalSection(layout, section.key));
        nav.appendChild(button);

        const content = section.content;
        content.dataset.ivLocalSection = section.key;
        content.classList.add("iv-local-section");
        content.classList.toggle("active", index === 0);
        content.hidden = index !== 0;
        panel.appendChild(content);
      });

      layout.append(nav, panel);
      return layout;
    }

    return { selectSection: selectLocalSection, createLayout: createLocalLayout };
  }

  window.InfraveilUI = window.InfraveilUI || {};
  window.InfraveilUI.localSections = { createController };
})();
