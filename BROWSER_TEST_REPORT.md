# Browser test report — 4 November 2026

## Results

Microsoft Edge (headless, installed browser), desktop 1440 × 1000 and mobile viewport 390 × 844.

- Browser tests: **10 passed**.
- Core/account tests: **17 passed**.
- Build: passed with Supabase configuration.
- Live Supabase: 45 location/junction rows, 47 paths, valid layout, email authentication enabled.
- Anonymous reads of feedback and administrator membership: correctly denied.

## Browser-tested features

| Feature | Result and scope |
| --- | --- |
| Interactive campus map | Clicked a live building and verified its information card |
| Directory | Live data loads with 31 named places |
| Alias search | Searched CCF and verified the shared Library footprint is highlighted |
| Category filter | Hostels filter updates the list and dims unrelated buildings |
| Building/floor information | Security Office shows the other places in building 11 |
| Saved places and recent views | Saved a place, reloaded and verified browser persistence |
| BFS route | Chose start/destination and verified the route and endpoint markers |
| Swap / clear route | Verified reversed endpoints and removal of the route |
| Pan / zoom / reset | Exercised controls and dragging in the rendered map |
| Login form | Checked real-mode validation and that demo buttons are hidden |
| Feedback form | Submitted in an isolated demo browser session and verified local storage |
| Demo administrator | Signed in, edited Library information, saved, and verified map/directory updates after reload |
| Demo student | Signed in and verified the admin editor is unavailable |
| Mobile layout | Verified no horizontal overflow and selected a location on the mobile viewport |

## Issues found and fixed

1. A search matching a secondary location (CCF) dimmed its shared primary building (Library). Shared building IDs now remain highlighted when any of their locations matches.
2. Wrapped select labels were ambiguous to browser label lookup. Starting point, Destination, Location and Place selects now have explicit accessible labels. Browser route and admin editor flows pass after the fix.

## What is not yet verified live

- Signing in to the actual admin@example.com account and its administrator membership.
- An authenticated admin edit persisted to the real Supabase database.
- A feedback submission persisted to real Supabase.
- Another real visitor receiving an admin edit through the 30-second refresh.

Admin editing and feedback browser tests used an isolated local demo configuration. They did not mutate the live Supabase project. No account password was requested or used, and no test feedback was sent to the live database.

## Future features

- Add/delete campus locations and position them on the map.
- Add/edit walkway connections and manage closures.
- Administrator feedback inbox and report status changes.
- Verified campus data, measured route lengths and walking-time estimates.
- Public Render deployment and configured GitHub repository.
- Account registration/password-reset screens and cross-device saved places.
- GPS current position after geographic calibration; accessibility and indoor routes.
- Separate BFS/DFS/Dijkstra comparison view for academic demonstrations.

## Re-run

Install development dependencies with `npm install`. Start the local site with `npm run dev`, then run `npm run test:browser`. The tests use the installed Microsoft Edge browser; they do not download another browser. The live tests expect the Supabase project URL and publishable key in `.env`.

The browser runner produces `playwright-report/index.html`, `test-results/campus-desktop.png` and `test-results/campus-mobile.png`. These generated artifacts are ignored by Git.
