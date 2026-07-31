# Release Export: One-Tap Send by Email or Text

Goal: after a participant signs, the PDF goes out with one tap — emailed or texted to them (and optionally to the crew) — instead of the current generate → download link → hope-it-saved dance.

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