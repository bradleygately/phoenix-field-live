# Clean Release Export Filenames

## Goal
Make every signed-release PDF export use this consistent order:

`Participant-Name_YYYYMMDD-HHmm_Session-Location_ReleaseID.pdf`

Example:

`Jane-Doe_20260731-1815_Westin-Grand-Ballroom_PSI26-A-1234.pdf`

## Changes
- Update the shared filename generator to accept participant name, Charlotte-local signing timestamp, session/location, and release ID.
- Use safe, readable filename segments: trim whitespace, replace separators with hyphens, remove unsupported characters, and provide clear fallbacks when a field is blank.
- Apply the same naming function to:
  - the participant’s post-signature download/share flow;
  - newly archived PDF storage objects;
  - Release Archive downloads for both existing and new records.
- Preserve existing PDFs and database records; old archive entries will receive the clean filename when downloaded without requiring data migration.

## Verification
- Test adult and minor releases, including missing-location fallback behavior.
- Confirm download, native share, and archive download all present the identical filename.
- Confirm the timestamp remains in America/New_York time.