// Support Center owns ticket UI state, reply rendering and resolved timers.
// Transport/factor/access policy remains in the dashboard composition root.
(function () {
  "use strict";
  function createController({ document, request, readSupportEndpoint, showToast,
      refreshIcons, setTimeout, clearTimeout, lifecycleTarget }) {
    let _supportTickets = [], _supportUnreadCount = 0,
        _supportExpanded = {}, _supportResolvedTimers = {}, disposed = false;
        function urgencyTone(e) {
          const t = String(e || "normal").toLowerCase();
          return "critical" === t
            ? {
                badge: "bg-red-500/15 text-red-300 border-red-500/25",
                label: "Critical",
              }
            : "high" === t
              ? {
                  badge: "bg-amber-500/15 text-amber-300 border-amber-500/25",
                  label: "High",
                }
              : "low" === t
                ? {
                    badge: "bg-slate-500/15 text-slate-300 border-slate-500/25",
                    label: "Low",
                  }
                : {
                    badge: "bg-blue-500/15 text-blue-300 border-blue-500/25",
                    label: "Normal",
                  };
        }
        function toggleSupportTicket(e) {
          ((_supportExpanded[e] = !_supportExpanded[e]),
            renderSupportTickets());
        }
        async function deleteSupportTicket(e, t = !1) {
          try {
            const n = await request(`${readSupportEndpoint()}/${e}`, { method: "DELETE" }),
              o = await n.json().catch(() => ({}));
            if (!n.ok || !o.success)
              throw new Error(o.error || "Could not delete support ticket.");
            ((_supportUnreadCount = Number(o.unread_count || 0)),
              delete _supportExpanded[e],
              _supportResolvedTimers[e] &&
                (clearTimeout(_supportResolvedTimers[e]),
                delete _supportResolvedTimers[e]),
              await refreshSupportTickets(),
              t || showToast("Ticket removed.", "success"));
          } catch (e) {
            t ||
              showToast(
                e.message || "Could not delete support ticket.",
                "error",
              );
          }
        }
        function scheduleResolvedTicketCleanup(e) {
          if (disposed) return;
          const t = e.ticket_id;
          t &&
            "resolved" === e.status &&
            !_supportResolvedTimers[t] &&
            ((_supportExpanded[t] = !0),
            (_supportResolvedTimers[t] = setTimeout(async () => {
              (delete _supportResolvedTimers[t],
                await deleteSupportTicket(t, !0));
            }, 1e4)));
        }
        function renderSupportTickets() {
          if (disposed) return;
          const e = document.getElementById("support-ticket-list"),
            t = document.getElementById("support-open-count"),
            n = document.getElementById("support-unread-count"),
            o = document.getElementById("user-menu-support-badge"),
            r = {},
            s = document.activeElement?.id || "";
          if (
            (document
              .querySelectorAll('[id^="support-reply-"]')
              .forEach((e) => {
                r[e.id] = e.value || "";
              }),
            t &&
              (t.innerText = String(
                (_supportTickets || []).filter((e) => "open" === e.status)
                  .length,
              )),
            n && (n.innerText = String(_supportUnreadCount || 0)),
            o &&
              ((o.textContent = String(_supportUnreadCount || 0)),
              o.classList.toggle("hidden", !_supportUnreadCount)),
            e)
          )
            if (_supportTickets.length) {
              if (
                ((e.innerHTML = _supportTickets
                  .map((e) => {
                    const t = !1 !== _supportExpanded[e.ticket_id],
                      n = urgencyTone(e.urgency),
                      o = (e.messages || [])
                        .map((e) => {
                          const t = "admin" === e.author;
                          return `<div class="rounded-xl border px-4 py-3 ${t ? "bg-blue-500/[0.05]" : "bg-white/[0.03]"}" style="border-color: var(--table-border)">\n                        <div class="flex items-center justify-between gap-3">\n                            <div class="text-[10px] uppercase tracking-widest font-bold ${t ? "text-blue-300" : "text-white"}">${t ? "Admin Reply" : "You"}</div>\n                            <div class="text-[10px] font-mono-cli" style="color: var(--text-subtle)">${e.created_at ? new Date(e.created_at).toLocaleString() : "-"}</div>\n                        </div>\n                        <div class="text-sm mt-2 whitespace-pre-wrap" style="color: var(--text-main)">${String(e.body || "").replace(/</g, "&lt;")}</div>\n                    </div>`;
                        })
                        .join("");
                    return (
                      scheduleResolvedTicketCleanup(e),
                      `<div class="rounded-2xl border p-5 space-y-4 relative overflow-hidden" style="border-color: ${e.unread_for_client ? "rgba(59,130,246,0.35)" : "resolved" === e.status ? "rgba(16,185,129,0.35)" : "var(--table-border)"}; background: var(--nav-hover)">\n                    ${"resolved" === e.status ? '<div class="absolute inset-0 flex items-center justify-center bg-emerald-500/12 backdrop-blur-[1px] pointer-events-none"><div class="px-5 py-2 rounded-full border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-[0.3em]">Resolved</div></div>' : ""}\n                    <button type="button" onclick="toggleSupportTicket('${e.ticket_id}')" class="w-full text-left flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">\n                        <div class="min-w-0">\n                            <div class="flex flex-wrap items-center gap-2">\n                                <span class="text-sm font-bold" style="color: var(--text-main)">${String(e.subject || e.summary || "Support Ticket").replace(/</g, "&lt;")}</span>\n                                <span class="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${n.badge}">${n.label}</span>\n                                <span class="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border" style="border-color: var(--table-border); color: var(--text-subtle)">${String(e.status || "open").replace(/</g, "&lt;")}</span>\n                                ${e.unread_for_client ? '<span class="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border bg-blue-500/15 text-blue-300 border-blue-500/25">New Reply</span>' : ""}\n                            </div>\n                            <div class="text-xs mt-2" style="color: var(--text-muted)">${String(e.summary || "").replace(/</g, "&lt;")}</div>\n                        </div>\n                        <div class="flex items-center gap-3">\n                            <div class="text-[10px] font-mono-cli whitespace-nowrap" style="color: var(--text-subtle)">${e.updated_at ? new Date(e.updated_at).toLocaleString() : "-"}</div>\n                            <i data-lucide="${t ? "chevron-up" : "chevron-down"}" class="w-4 h-4" style="color: var(--text-subtle)"></i>\n                        </div>\n                    </button>\n                    <div class="${t ? "space-y-4" : "hidden"}">\n                    <div class="space-y-3">${o}</div>\n                    <div class="flex flex-col md:flex-row gap-3">\n                        <textarea id="support-reply-${e.ticket_id}" rows="3" class="ink-input flex-1 rounded-xl px-4 py-3 text-sm" placeholder="Reply to this ticket..."></textarea>\n                        <div class="flex flex-col gap-3 md:w-48">\n                            <button onclick="submitSupportReply('${e.ticket_id}')" class="btn-primary px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest">Send Reply</button>\n                            ${e.unread_for_client ? `<button onclick="markSupportTicketRead('${e.ticket_id}')" class="btn-secondary px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest">Mark Read</button>` : ""}\n                            <button onclick="deleteSupportTicket('${e.ticket_id}')" class="btn-secondary px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest">Delete</button>\n                        </div>\n                    </div>\n                    </div>\n                </div>`
                    );
                  })
                  .join("")),
                Object.entries(r).forEach(([e, t]) => {
                  const n = document.getElementById(e);
                  n && t && (n.value = t);
                }),
                s)
              ) {
                const e = document.getElementById(s);
                if (e) {
                  e.focus();
                  const t = e.value.length;
                  e.setSelectionRange(t, t);
                }
              }
              refreshIcons();
            } else
              e.innerHTML =
                '<div class="rounded-2xl border border-dashed px-6 py-10 text-center text-sm" style="border-color: var(--table-border); color: var(--text-subtle)">No support tickets yet. Start one on the left and it will show up here as a live thread.</div>';
        }
        async function refreshSupportTickets(e = !1) {
          try {
            const e = await request(readSupportEndpoint());
            if (!e.ok) throw new Error("Could not load support tickets");
            const t = await e.json();
            ((_supportTickets = t.tickets || []),
              (_supportUnreadCount = Number(t.unread_count || 0)),
              renderSupportTickets());
          } catch (t) {
            e &&
              showToast(
                t.message || "Could not load support tickets.",
                "error",
              );
          }
        }
        async function submitSupportTicket() {
          const e =
              document.getElementById("support-urgency")?.value || "normal",
            t = document.getElementById("support-category")?.value || "general",
            n =
              document.getElementById("support-contact-method")?.value ||
              "email_and_dashboard",
            o = (
              document.getElementById("support-summary")?.value || ""
            ).trim(),
            r = (
              document.getElementById("support-description")?.value || ""
            ).trim();
          if (!o) return showToast("Quick description required.", "error");
          if (!r) return showToast("Full detail required.", "error");
          try {
            const s = await request(readSupportEndpoint(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  urgency: e,
                  category: t,
                  contact_method: n,
                  summary: o,
                  description: r,
                  subject: o,
                }),
              }),
              a = await s.json().catch(() => ({}));
            if (!s.ok || !a.success)
              throw new Error(a.error || "Could not create support ticket.");
            ((document.getElementById("support-summary").value = ""),
              (document.getElementById("support-description").value = ""),
              await refreshSupportTickets(),
              showToast("Support ticket created.", "success"));
          } catch (e) {
            showToast(e.message || "Could not create support ticket.", "error");
          }
        }
        async function submitSupportReply(e) {
          const t = document.getElementById(`support-reply-${e}`),
            n = (t?.value || "").trim();
          if (!n) return showToast("Reply message required.", "error");
          try {
            const o = await request(`${readSupportEndpoint()}/${e}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: n }),
              }),
              r = await o.json().catch(() => ({}));
            if (!o.ok || !r.success)
              throw new Error(r.error || "Could not send support reply.");
            (t && (t.value = ""),
              await refreshSupportTickets(),
              showToast("Reply sent.", "success"));
          } catch (e) {
            showToast(e.message || "Could not send support reply.", "error");
          }
        }
        async function markSupportTicketRead(e) {
          try {
            const t = await request(`${readSupportEndpoint()}/${e}/read`, {
                method: "POST",
              }),
              n = await t.json().catch(() => ({}));
            if (!t.ok || !n.success)
              throw new Error(n.error || "Could not update ticket.");
            ((_supportUnreadCount = Number(n.unread_count || 0)),
              await refreshSupportTickets());
          } catch (e) {
            showToast(e.message || "Could not update ticket.", "error");
          }
        }
    function updateUnreadCount(value, badge) {
      _supportUnreadCount = Number(value || 0);
      if (badge) {
        badge.textContent = String(_supportUnreadCount);
        badge.classList.toggle("hidden", !_supportUnreadCount);
      }
    }
    function onPageHide(event) {
      if (!event.persisted) dispose();
    }
    function dispose() {
      if (disposed) return;
      disposed = true;
      Object.values(_supportResolvedTimers).forEach(clearTimeout);
      _supportResolvedTimers = {};
      lifecycleTarget.removeEventListener("pagehide", onPageHide);
    }
    lifecycleTarget.addEventListener("pagehide", onPageHide);
    return Object.freeze({
      toggleTicket: toggleSupportTicket, deleteTicket: deleteSupportTicket,
      refresh: refreshSupportTickets, submitTicket: submitSupportTicket,
      submitReply: submitSupportReply, markRead: markSupportTicketRead,
      updateUnreadCount, dispose,
    });
  }
  const ui = window.InfraveilUI = window.InfraveilUI || {};
  ui.support = Object.freeze({ createController });
})();
