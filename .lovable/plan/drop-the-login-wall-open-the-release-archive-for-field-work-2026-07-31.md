# Drop the Login Wall — Open the Release Archive for Field Work

Remove admin accounts, sign-in, and role checks entirely. The archive becomes just another screen under More, like Timeline or Wrap. No password, no setup, works the moment you open the app.

## What changes

1. **No sign-in anywhere.** The auth screen, the protected-route gate, and the "you are not an admin" states are gone. More -> Release Archive opens straight to the 14 signed releases.
2. **Archive keeps everything it does today**: search, per-row detail, CSV export, PDF download with the correct `ReleaseID_Interviewer_Timestamp.pdf` name, delete.
3. **Renamed for what it is**: "Admin Console" becomes "Release Archive" — it is a crew tool, not an admin area.
4. **Signing flow is untouched.** Participants still sign at the public release links exactly as now.
5. **Delete gets a confirm step**, since there is no longer a login standing between a mis-tap and a destroyed signed release.

## One thing you should know

Signed releases contain participant names, emails, and phone numbers. With the login removed, anyone who has the app's release-archive URL can read and download them. That is the tradeoff for zero-friction access during the event.

Two ways to soften it without a login, if you want either now or later:
- The archive lives at an unguessable URL that is not linked publicly (only reachable from More).
- A single shared crew passcode typed once per device, remembered afterward — about three seconds, no accounts.

Say the word and I'll include one; otherwise it ships fully open.

## Build steps

1. Move the archive out of the protected area to a normal route; delete the auth screen, the route gate, and the role-check code.
2. Database: allow reading and managing releases without an account, and drop the now-unused roles table and role function.
3. Remove the sign-in/sign-out entry points from More and the header.
4. Add the delete confirmation sheet.
5. Verify at 390x844 and 430x932: archive lists all 14 releases, PDF downloads with the right filename, CSV export works.

## Technical notes

- Route: `src/routes/_authenticated/admin.tsx` -> `src/routes/releases.archive.tsx`; delete `src/routes/auth.tsx` and `src/routes/_authenticated/route.tsx` in the same edit so no orphan gate remains. Remove `isCurrentUserAdmin` and its call sites in `src/lib/release-supabase.ts` and `AdminDashboard.tsx`.
- Migration: replace the `has_role`-based policies on `releases` with `anon`/`authenticated` select, update, and delete policies, add matching GRANTs, and drop `user_roles`, `has_role`, and the `app_role` enum. Storage access for `release-pdfs`/`release-signatures` moves to signed URLs minted for anyone with the page open.
- No Supabase auth calls remain in the app, so `onAuthStateChange` wiring and the bearer attacher usage tied to admin go away; nothing else in the app depends on a session.