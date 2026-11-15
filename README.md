# Infraveil Dashboard

The customer-facing web dashboard for **Infraveil**, a backend operations platform
for applications running on customer-controlled infrastructure. This repository
publishes the dashboard's frontend source: its views, browser controllers, styles,
shared UI components, font and wordmark.

The interface connects application and fleet operations in one workspace:
workloads and servers, placement and runtime updates, application health and logs,
managed traffic and security policy, pipelines, MCP connections, account settings,
billing, and support.

- [Infraveil](https://infraveil.com/)
- [Hosted dashboard](https://portal.infraveil.com/dashboard)
- [Customer-side installer, launcher and agent source](https://github.com/infraveil/infraveil-runtime)
- [Architecture and operating boundaries](https://infraveil.com/transparency)

## Start reading

The entrypoint is [`html_templates/client_dashboard.html`](html_templates/client_dashboard.html).
It defines the shell, navigation, dialogs, configuration handoff and asset loading.

| Source area | Responsibility |
| --- | --- |
| [`html_templates/console/views/`](html_templates/console/views) | Feature-view templates, including operations, workloads, servers, monitoring, policy, account and support surfaces. |
| [`html_templates/console/controllers/`](html_templates/console/controllers) | Browser-controller templates for navigation, state transport, polling, actions, onboarding, authentication interactions and feature behavior. |
| [`html_templates/console/styles/`](html_templates/console/styles) | Style templates covering tokens, surfaces, controls, logs, dialogs and responsive behavior. |
| [`static/console/ui/`](static/console/ui) | Shared live-DOM updates, local sections, manifest editing and fleet-canvas behavior. |
| [`static/console/features/`](static/console/features) | Fleet selection/navigation, runtime setup, support and feedback modules. |
| [`static/dashboard-modern.css`](static/dashboard-modern.css) and [`static/dashboard-modern.js`](static/dashboard-modern.js) | Shared dashboard presentation and interaction enhancements. |

For example, follow [the server view](html_templates/console/views/launcher.html),
[runtime setup](static/console/features/runtime-setup.js), and
[deployment/onboarding controller](html_templates/console/controllers/deployment-onboarding.js.j2)
to see how server connection and workload setup are presented. Follow
[fleet selection](static/console/features/fleet/selection.js) and
[fleet navigation](static/console/features/fleet/navigator.js) for scoped fleet UI.

## How the frontend is composed

The HTML uses Jinja templates. [`asset-bundles.json`](asset-bundles.json) lists the
stylesheet/script bundles and their exact template order. The main controller
bundle is a classic JavaScript script with a shared lexical scope; the later
scripts retain their original loading positions. These are source-ownership
modules, not independently importable ES modules.

The hosted application renders the HTML, supplies per-workspace `app_config`,
serves the versioned `/client/dashboard-assets/` resources and implements the API
routes the browser calls. This source snapshot contains no populated workspace
configuration. Opening the template directly as a local HTML file is not a
standalone running control plane.

The hosted backend and administrative console are not part of this repository.
The installer/launcher/agent are published separately in
[`infraveil-runtime`](https://github.com/infraveil/infraveil-runtime).

## Snapshot and updates

This repository follows healthy deployed releases automatically. A server-side
job checks approximately every five minutes; it does not depend on the owner's
PC. [`SOURCE-RELEASE.json`](SOURCE-RELEASE.json) records the exported release and
file hashes. See [`SYNC.md`](SYNC.md) for synchronization and failure behavior.
Publication does not deploy software or operate a customer workload.

The entrypoint retains its existing CDN references to Tailwind CSS, Lucide and
QRCode.js; those external libraries are not vendored into this repository.
Source Sans 3 is bundled with its existing SIL Open Font License.

## Rights and attribution

See [`NOTICE.md`](NOTICE.md). This publication does not apply the separate runtime
repository's Apache license to the dashboard. No additional open-source license
is supplied for Infraveil-owned frontend code. Existing third-party license terms
and notices remain applicable.
