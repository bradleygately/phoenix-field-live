# Correct release PDF export filenames

## Goal
Every signed-release PDF export should use:

`<release-id>_<interviewer>_<Charlotte-date-time>.pdf`

Example: `PSI26-A-20260731-2132-5JBMS_Brad-Smith_20260731-2132.pdf`

## Changes
1. Make the filename formatter authoritative and timezone-safe:
   - Read the interviewer from **Release obtained by** for adult and minor releases.
   - Format the timestamp in `America/New_York`, independent of the device timezone.
   - Sanitize names for valid filenames and retain a clear fallback when no interviewer was entered.
2. Use that filename for the PDF generated immediately after form submission, including native share and direct-download flows.
3. Store newly submitted archive PDFs under the same descriptive filename instead of only `<release-id>.pdf`.
4. Change the Release Console's **Signed PDF** action from opening a signed storage URL to downloading the PDF blob with the descriptive filename. Derive the correct name from the archived interviewer and signing timestamp, so existing releases also export correctly without changing old stored files.
5. Keep a separate open/print fallback for browsers that cannot honor direct downloads, while displaying the exact intended filename to the user.

## Verification
- Submit adult and minor test releases with interviewer names containing spaces and punctuation.
- Confirm the post-submit download, native-share file, fallback link, and Release Console download all expose the same expected filename.
- Confirm the timestamp reflects Charlotte local time and the generated file is a valid PDF.
- Run the relevant checks and a browser download test.