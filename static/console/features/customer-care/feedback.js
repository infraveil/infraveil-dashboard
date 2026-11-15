// Product feedback owns sentiment selection and the existing submit workflow.
// Protected transport, page context, account refresh and telemetry stay root-owned.
(function () {
  "use strict";
  function createController({ document, request, readFeedbackEndpoint, readCurrentView,
      showToast, trackEvent, refreshAccount }) {
    let _selectedFeedbackSentiment = "confusing";
        function setFeedbackSentiment(e) {
          ((_selectedFeedbackSentiment = e),
            ["sharp", "confusing", "blocked"].forEach((t) => {
              const n = document.getElementById(`feedback-tone-${t}`);
              n &&
                (n.classList.toggle("btn-primary", t === e),
                n.classList.toggle("btn-secondary", t !== e));
            }));
        }
        async function submitDashboardFeedback() {
          const e = (
              document.getElementById("feedback-message")?.value || ""
            ).trim(),
            t = readCurrentView(),
            n = document.getElementById("feedback-category")?.value || "ux";
          if (e)
            try {
              const o = await request(readFeedbackEndpoint(), {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    view: t,
                    category: n,
                    sentiment: _selectedFeedbackSentiment,
                    message: e,
                  }),
                }),
                r = await o.json().catch(() => ({}));
              if (!o.ok || !r.success)
                throw new Error(r.error || "Could not submit feedback.");
              ((document.getElementById("feedback-message").value = ""),
                trackEvent("action", t, "submit_feedback", {
                  category: n,
                  sentiment: _selectedFeedbackSentiment,
                }),
                await refreshAccount(),
                showToast(
                  "Feedback captured. We will use it to tighten the dashboard.",
                  "success",
                ));
            } catch (e) {
              showToast(e.message || "Could not submit feedback.", "error");
            }
          else showToast("Write a short note first.", "error");
        }
    return Object.freeze({ setSentiment: setFeedbackSentiment, submit: submitDashboardFeedback });
  }
  const ui = window.InfraveilUI = window.InfraveilUI || {};
  ui.feedback = Object.freeze({ createController });
})();
