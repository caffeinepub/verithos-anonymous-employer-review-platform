# Specification

## Summary
**Goal:** Fix evidence “Download as archive (ZIP)” so it reliably fetches accessible evidence blobs (matching the same effective access/URL resolution as single-file downloads) and produces a non-empty ZIP when at least one file is downloadable.

**Planned changes:**
- Update the evidence ZIP download flow to reuse the same URL resolution/access mechanism as single-file downloads (via the same resolver used by `useFileUrl(...)`), avoiding hardcoded gateway URL construction.
- Adjust `frontend/src/utils/evidenceArchiveDownload.ts` to fetch evidence files in a browser-compatible way for binary content (explicit fetch + ArrayBuffer/Blob handling) and only add non-empty results to the ZIP.
- Ensure both existing “Download as archive” entry points (review evidence list and MultipleEvidenceModal) invoke one shared ZIP download flow with identical network behavior, progress/disabled state, and success/failure handling.
- Preserve partial success behavior: include all successfully fetched files, keep the existing `_archive_info.txt` failure summary, and only show the existing “no files could be included” message when all fetches fail.

**User-visible outcome:** Downloading evidence as a ZIP from either location produces a ZIP containing all accessible evidence files (PDF/images/audio/video); if some files fail, the ZIP still downloads with the remaining files and a failure summary.
