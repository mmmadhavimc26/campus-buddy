# VJTI Campus Navigator

A dependency-free campus navigation web app, ready for Render Static Sites and an optional Supabase database. Works immediately in local demo mode.

The interactive SVG map is manually reconstructed from VJTI's campus signboard, photographed in 2012 by Ankitdaf. It follows the reference's academic blocks, courtyard, hostels, sports grounds and roads, retaining the numbered building markers. The adapted map geometry is licensed CC BY-SA 3.0; see `assets/ATTRIBUTION.md`. The original photograph is available through a source link, rather than displayed as the navigation interface.

**Building placement and outlines follow the historical image; paths are inferred and distances are unverified.** Proportions are schematic. Unverified weights display as **units**, not metres; walking times stay hidden. Search, filters, selection and routes all act on the same interactive drawing. Survey/approve the campus dataset before real navigation.

## Run locally

Requires Node.js 22.9+ (Node 24 recommended).

```powershell
npm run dev
```

Open http://localhost:5173. No dependency installation, account, API key or payment is required for the demo. Stop the server with Ctrl+C. `npm test` checks graph behavior; `npm run build` creates `dist/`.

For actual browser checks, run `npm install` once and then `npm run test:browser`. This uses Playwright with the installed Microsoft Edge browser. See `BROWSER_TEST_REPORT.md` for tested features, results and remaining live-account checks.

## Implemented

- Interactive vector redraw with 31 searchable places, shared-building floor details, numbered footprints, pan, zoom and reset. Search/filter results also highlight matching places on the map.
- Search (including aliases), category filters and location directory.
- Starting point and destination selection, with swap.
- BFS routing (fewest connections), with one Find route action. Algorithm selection and comparison are deferred.
- Highlighted route and ordered location steps. Metres and walking-time estimates are available only for routes whose every connection has a verified distance.
- Building information and nearby facilities ranked by connection count using BFS.
- Browser-local saved places and recently viewed places.
- Feedback: local browser storage in demo mode; shared database inserts when Supabase is configured.
- Supabase schema, safe browser-key configuration and Render deployment blueprint.
- Student/admin login, separate saved places per account, and a location-details editor with database-enforced administrator permissions.

Email/password login and an administrator location editor are implemented, with local demo student/admin accounts for testing. Read `ACCOUNTS.md` for credentials and Supabase setup. Administrators edit names, categories, floors, room details, opening hours, descriptions, facilities and aliases. Numbered footprints, coordinates and path geometry are not edited by this panel. Indoor navigation, GPS tracking, surveyed accessibility routes and live closures are not implemented.

## Connect Supabase

1. Create a Supabase project using your account.
2. In its SQL Editor, run `supabase/schema.sql`, followed by `supabase/seed.sql`. Seed data is illustrative. Seed inserts preserve existing records.
3. Copy `.env.example` to `.env`. Set `SUPABASE_URL` to your project URL and `SUPABASE_PUBLISHABLE_KEY` to your publishable key (or legacy `anon` key).
4. Restart `npm run dev`. Open About this map to check the database connection. A connection error falls back to the local demo map and displays a warning.
5. Open the Supabase Table Editor to maintain `locations` and `paths`, and review `feedback`. Positions use a 1000 × 760 schematic coordinate space. Connections are bidirectional. Set `distance` to a measured path length in metres and set `distance_verified` to true only after measuring it. Missing/false verification means a demo weight, not metres. Reload the app after editing.

For a fresh project, run the updated schema and seed. If an older demo was already imported, the schema adds new metadata columns safely, but the non-overwriting seed does not replace old records. Migrate those records to the new dataset before connecting it; the app rejects cloud datasets with a mismatched `layout_version` and keeps the bundled layout visible. Back up any custom campus records before a dataset migration.

Only the URL and public key are embedded in the generated frontend. **Never use a secret/service-role key.** The build rejects those keys. Row-level security permits public map reads and feedback submission; visitors cannot read reports or edit data. Feedback uses an anonymous insert for this academic demo; add bot protection/rate limiting before a broadly advertised public launch.

The application requests `locations` and `paths` via Supabase REST. No separate Render backend is needed. The dataset has 31 named places plus 14 internal walkway junctions. Junctions are excluded from the directory, selectors and location steps. The `points` column stores walkway bends and is used in both the base map and route highlights. Add pagination before expanding beyond the Supabase API row limit.

## Deploy on Render

1. Push this project to a Git repository in your own account.
2. In Render, create a **Static Site**, and connect that repository.
3. Build command: `npm run build`.
4. Publish directory: `dist`.
5. For cloud data, add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as Render environment variables before building. For demo mode, leave both unset.
6. Deploy. Render supplies an HTTPS `onrender.com` address. Alternatively, use the included `render.yaml` Blueprint.

Environment variables are used at build time: redeploy after changing them. Do not choose a Node Web Service for this frontend. Render static hosting has free usage limits; check the current plan. Supabase also has plan limits and possible free-project inactivity restrictions.

Documentation: https://render.com/docs/static-sites · https://supabase.com/docs/guides/getting-started/api-keys · https://supabase.com/docs/guides/database/postgres/row-level-security

## 60% demonstration

Show the map, directory, search, categories, start/destination selection, BFS calculation, highlighted route and building details. This covers eight of the original 13 components. Several additional prototype components are already present; a percentage is ultimately determined by the faculty rubric and verified data, not just the number of screens.

## Data and verification

Edit `src/data.js` for the local dataset. `node scripts/seed.mjs` regenerates the SQL seed from that dataset; it does not contact Supabase. Run tests after editing connections. Before a real campus pilot, validate the physical locations, distances, entrances, indoor boundaries and walking directions. The current directions list graph locations rather than turn-by-turn compass instructions.

The UI uses local Tahoma/Arial system fonts, with no external font requests. Map attribution, reference history and connection status are available in About this map. The reference photograph is bundled locally; no map tile service is required.

## Future enhancement: algorithm comparison

Add a separate educational view to compare BFS, DFS and Dijkstra using the same start and destination. It could display each path, explored nodes, connection count and total weight. Normal navigation currently uses BFS only. Weighted shortest-distance recommendations should wait until path lengths and access are verified. Existing algorithm implementations remain in the graph module for future development and testing.
