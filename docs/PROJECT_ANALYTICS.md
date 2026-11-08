# Project popularity in Umami

Open [Umami Cloud](https://cloud.umami.is/) → **Ude Projects** and select a date range.

## What the measurements mean

| Event | Meaning | Property |
| --- | --- | --- |
| `project-open` | Visitor expands an Exhibition or Workshop tile | `project` |
| `project-link` | Visitor follows a project link | `project`, `type` (`launch`, `source`, `subscribe`) |
| `app-use` | Visitor activates a selected action within an instrumented app | `project`, `action` |
| Page views | Application or portfolio page loaded | Page path / domain |

In Umami's **Events**, select the event and group/filter by the `project` property. To compare popularity, use a custom event report grouped by project if your Umami Cloud plan exposes Reports. Otherwise inspect the event-property breakdown. A project-link event records a click, not confirmation that the destination loaded. An app-use event records an interaction, not the duration or success of the action.

## Coverage

Public Exhibition and Workshop; plus application entry pages in these repositories:

- SuperCollision
- Dactyl-Nightmare-Lucid-Dream
- Mergent
- Maze-Seedling-Rejuvenation
- Old-Man-JiGaZo
- Pocket-Operations-Mobile-Depot
- TV-b-goner
- Moire-Lab
- Kokoro Voice Lab (both hosted entry pages)
- Asheville GoLocal project information page

The same Umami website ID is used for the public applications. When hosted on another domain, Umami's website domain configuration may need to permit that host. Other application routes and projects are not yet comprehensively instrumented. Do not infer zero usage from missing app-use events.

No tracking is installed on the unlisted personal dashboard. Do not send user-entered text, file names, content, or full outbound URLs as analytics properties.

## Reliability and interpretation

Browser content blockers may suppress tracking. The same person can appear as multiple visitors across browsers or devices. Your own traffic may be included. The counts are approximate, not a reliable way to identify particular people. Project popularity is not comparable across applications until instrumentation coverage is equivalent.

For a private project-popularity report, use Umami's authenticated dashboard rather than publishing a public statistics page or embedding an analytics API token in GitHub Pages.
