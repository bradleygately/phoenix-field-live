# Fix: Admin Login and Release Archive Access

## What's actually wrong (verified)

- The backend has **zero user accounts** and **zero admin role records**, while 14 signed releases sit in the archive.
- Your recent sign-up attempts were rejected because the password was flagged as too weak/common; the sign-in attempts then failed as "invalid credentials" because no account was ever created.
- Even if the sign-up had succeeded, you still could not get in: admin access is granted by an admin-role record, and there is currently **no way for anyone to ever receive that record** — nothing in the app or database creates one. So the archive would have shown "not authorized" regardless of password.

## The fix

1. **Bootstrap the first admin.** A one-time, self-closing rule: if no admin exists yet, the first account created through a dedicated setup step becomes the admin automatically. Once one admin exists, that door closes permanently and only an existing admin can grant the role.
2. **Add "Crew members" management** inside the admin console so you can promote Jesse or Duane later without touching anything technical.
3. **Make sign-up survivable in the field.**
   - Show the real reason a sign-up fails (weak password, email already used) instead of a generic error.
   - Show password requirements up front with a strength meter, so you know before tapping Create.
   - Sign in immediately after sign-up (no email-confirmation dead end that would strand you in a ballroom).
4. **Clear access states on the archive.** Not signed in -> sign-in prompt. Signed in but not admin -> "Ask an admin to grant you access", with your account email shown. No more silent blank screen.
5. **Password reset** link on the sign-in screen so a forgotten password does not lock you out of 14 signed releases.

## Setup after the change

You create the first admin account once (I'll point you at the exact screen). Use a long passphrase — the backend rejects common passwords. From then on the archive opens straight from More -> Admin.

## Technical notes

- Migration: a `SECURITY DEFINER` function plus an admin-only insert path for `user_roles`; bootstrap grant only when `count(admin) = 0`, executed server-side so the browser cannot claim the role. Existing `has_role` and RLS on `releases` stay untouched.
- Role checks continue to read `user_roles` via `has_role`; roles are never stored on a profile.
- Auth config: enable auto-confirm for email sign-up so first login works without an email round-trip, and surface GoTrue's 422 `weak_password` message in the UI.
- Admin route stays under `_authenticated/` with the managed gate; the admin dashboard adds a role-check state instead of rendering an empty table.

---

# Previously proposed (still pending): Release Export — One-Tap Send by Email or Text

Goal: after a participant signs, the PDF goes out with one tap — emailed or texted to them (and optionally to the crew) — instead of the current generate → download link → hope-it-saved dance. This follows the admin-access fix above.

## What changes for you in the field

1. **Signing screen ends with "Send copy"**
   - The PDF is generated and archived automatically the moment the form is signed. No extra tap to create it.
   - One row of big buttons: **Email**, **Text**, **Share/Save**.
   - Email and Text are pre-filled with the contact info the participant already typed on the form — confirm and tap Send.
   - A clear status line: "Sent to jane@example.com · 9:41 PM", or a retry button if it failed. Queued and retried if the ballroom Wi-Fi drops.
   - "Send me a copy" on the form auto-triggers the email send, so the common case takes zero thinking.

2. **What the participant receives**
   - Email: branded Mojo Phoenix message with a secure, expiring download link to the release (mail providers reject large attachments unpredictably; a link always works), correct filename `ReleaseID_Interviewer_YYYYMMDD-HHmm.pdf`.
   - Text: short message with the same secure link.

3. **Admin archive**
   - Per row: **Email**, **Text**, **Download** — the same three actions, so you can resend later from anywhere.
   - **Select multiple → Download ZIP** so an end-of-day handoff is one tap, not one at a time.
   - Each row shows delivery state (sent / not sent / failed) so nothing quietly falls through.

4. **Filename / save location**
   - Descriptive filename everywhere: single download, ZIP entries, and the file the emailed link serves.
   - On phones the primary path becomes native Share, so it lands in Files, Mail, or AirDrop instead of a mystery browser download folder.

## What I need from you before email/text can send

- **Email**: sending requires a domain you own (e.g. mojophoenix.com), so mail comes from your brand and stays out of spam. There is no free shared sender. If you have a domain, setup is one dialog; if not, you can buy one and we continue.
- **Text (SMS)**: requires connecting a Twilio account with a sending number. I'll open that connect flow when we get there.

If either isn't ready, that button stays disabled with a short "set up sending" note, and Share/Save still works fully — nothing breaks.

## Build order

1. Auto-generate and archive the PDF on signature; collapse the post-sign UI to the three send buttons plus status.
2. Signed, time-limited download links from the release archive (server-side; bucket stays private).
3. Email domain setup, then a branded app-email template and server-side send tied to a release ID, with retry/queue.
4. Twilio connect and server-side SMS send of the same link.
5. Admin archive: per-row Email/Text/Download, multi-select ZIP, delivery status column.
6. Test at 390x844 and 430x932; verify a real signed PDF opens from both the emailed link and the ZIP.

## Technical notes

- Delivery is server-side only: a server function takes `releaseId` + channel, verifies the caller, mints a signed storage URL for `release-pdfs`, and sends. The browser never receives privileged keys and there is no arbitrary-recipient send endpoint.
- A `release_deliveries` table records channel, recipient, status, sent_at, and error — powering status UI and resend, admin-only read.
- Email uses Lovable's built-in sending (React Email template, brand styling); SMS goes through the Twilio connector gateway.
- Offline: sends enqueue in the existing local-first queue and flush when back online, matching current field behavior.
- Filename logic stays in `releasePdfFilenameFor` (Charlotte time) and is reused for storage keys, ZIP entries, and email link text.