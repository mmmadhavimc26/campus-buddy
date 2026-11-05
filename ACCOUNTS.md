# Accounts and location management

## Try the local demo

Start the app with `npm run dev` and open http://localhost:5173.

Click **Sign in**. When no Supabase configuration is present, these clearly labelled demo accounts are available:

| Role | Email | Password |
| --- | --- | --- |
| Student | student@demo.local | Student123! |
| Administrator | admin@demo.local | Admin123! |

Use a fill button, then click Sign in. The demo student can browse, navigate and save places. The demo administrator also sees **Manage locations**. Demo account sessions last in the current browser tab. Demo passwords are public test values; they are not Supabase credentials.

Choose a location, edit it and save. The directory and map update immediately. Demo edits remain in this browser's localStorage and survive a reload. They are never uploaded to Supabase. To reset them, remove the `vjti-demo-location-edits` localStorage entry in browser developer tools.

Saved places and recent views are kept separately for the guest, demo student and administrator. These remain device-local, including when real login is enabled; cross-device favourites are a future feature.

## Enable real accounts with Supabase

1. Create/select a Supabase project.
2. Run the updated `supabase/schema.sql` in SQL Editor. It safely adds the account permissions, editable fields and update timestamp to an existing schema.
3. For a fresh database, run `supabase/seed.sql` to insert the campus layout. If an older layout was imported, follow README migration guidance first.
4. In **Authentication → Users**, create an administrator account with an email and a strong password. Confirm the email through the dashboard or complete its email verification flow.
5. Open `supabase/admin-setup.sql`, replace the sample email with this exact account email, and run it in SQL Editor. Verify the result contains that account. Running the sample without changing its email grants nobody access.
6. Create a separate normal test user in Authentication → Users. Do not insert that user into `admin_users`.
7. Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `.env` locally, or in Render build environment variables. Restart/redeploy.
8. Sign in through the website with the real account. Demo credentials and fill buttons are disabled when Supabase is configured.

Creating an Auth user alone does **not** make that user an administrator. Only membership assigned by the trusted SQL dashboard grants location-edit access. Public registration, password-reset screens and email invitations are not implemented in this milestone; accounts are provisioned through the dashboard.

## What an administrator can edit

- Location name and category
- Floor and room/office information
- Opening hours and description
- Facilities and alternative search names

Changes save to `public.locations` with the signed-in user's access token, and the edited record is applied to the current page after Supabase confirms the write. Other open visitors refresh map data every 30 seconds and when their tab regains focus. The Supabase dashboard also shows the saved record.

The numbered building footprint and path geometry are fixed layout data in this milestone. The editor does not move buildings, add/delete locations, edit path connections or verify distances. Place names on building labels, directory rows, search results, selectors and information cards use updated database values.

If another administrator changed the same location since it was opened, the save is rejected using `updated_at`. Close and reopen the editor to load the latest record before editing again.

## Permissions

The schema enables row-level security. Visitors can read campus locations and paths, and submit feedback. Normal signed-in users have the same map permissions. Administrators may update only the approved location-detail columns; public clients cannot change admin membership, location IDs, coordinates or path geometry.

Administrator checks in the interface are for navigation; database policies enforce the permission. The site never uses a secret/service-role key. Sessions are stored in browser sessionStorage and access tokens are refreshed before expiry. Real sessions and administrator membership are verified against Supabase when restored.

## Connection verification

1. Sign in as the normal test user: Manage locations must be absent.
2. Sign in as the administrator: Manage locations must be available.
3. Change a description or opening time and save.
4. Check the `locations` row in Supabase and reload the public website.
5. Confirm another browser receives the new information after a refresh or the next 30-second update.

Automated tests cover local account roles, token refresh, membership revocation and the demo edit flow. Live Supabase authentication and policies still need to be checked against your connected project.
