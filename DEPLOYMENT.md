# Database and hosting handoff

## Current status

The frontend works locally. Supabase database tables and Render configuration are prepared in this repository, but no Supabase project has been connected and no Render site has been deployed. Account access is required to finish those external steps.

## Architecture

```text
Visitor's browser
  ├── Render Static Site: HTML / CSS / JS / interactive SVG map
  ├── Supabase REST: campus locations, graph connections, feedback
  └── Browser localStorage: saved places and recent views
```

Graph calculations run in the browser. Supabase stores the data; it does not calculate routes. A separate always-running application server is unnecessary for this version.

## Database

1. Create/select a free Supabase project.
2. Run `supabase/schema.sql` in SQL Editor. It creates tables, enables row-level security and grants only map reads and feedback inserts to visitors.
3. Run `supabase/seed.sql` to add the illustrative routing dataset. This does not overwrite existing rows.
4. Retrieve the project URL and publishable key. Use these two values for the frontend. A server secret or service-role key must never be included.
5. Manage records and feedback in the Supabase dashboard. Public visitors cannot read feedback or modify the map.

| Table | Contents | Visitor permissions |
| --- | --- | --- |
| locations | Names, categories, schematic positions, descriptions, aliases, facilities | Read |
| paths | Connected location IDs, route weight, distance verification flag | Read |
| feedback | Location reference, message, status and creation time | Insert message + location only |

Saved places and recents are browser-local, separated by signed-in account and not synchronized across devices. The website now has login and an admin location editor. Follow `ACCOUNTS.md` to create Auth users and grant the first administrator access using `supabase/admin-setup.sql`.

## Render

1. Put the repository in your GitHub account.
2. Create a Render **Static Site** connected to it.
3. Set build command to `npm run build` and publish directory to `dist`.
4. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as build environment variables.
5. Deploy, then check About this map reports a database connection. A fallback warning means it is showing the demo dataset instead.

The `render.yaml` file also supports creating the static site through a Render Blueprint. Both environment values must be set together; for local-only mode leave both empty. Changing them requires a new build.

## Distance verification

The photo has no usable calibrated scale in this application. Do not derive metres from an arbitrary pixels-to-metres factor. For each actual walkable connection:

1. Verify the entrance, endpoints and accessible path on site.
2. Measure the path length (including bends), or obtain a georeferenced path with a reliable scale.
3. Store the metre length in `paths.distance` and set `distance_verified = true`.

Only a route with all its segments verified displays metres and a walking-time estimate. The estimate uses 80 metres/minute, excluding stops and indoor delays. The layout is redrawn from the historical signboard; connections are inferred rather than surveyed. The interactive map includes junctions and path bends.

## Before the presentation

- Confirm Supabase is active; free projects can be paused for inactivity.
- Check Render serves the page and bundled image.
- Find a route and confirm it highlights on the routing graph.
- Submit a test report and verify it appears in the Supabase dashboard.
- Confirm a visitor cannot read the feedback table or edit locations via the public API.

Reference documentation: https://render.com/docs/static-sites and https://supabase.com/pricing .
