# Implementation Plan: UX Cleanup + Packaging

## Scope
- Remove edit action buttons where rows/cards are already clickable.
- Provide an initial plan for packaging the app as a desktop installer for easier installation/testing.

## Plan
1) Remove redundant edit buttons
   - Identify pages where list entries are clickable (staff, appointments, treatments).
   - Remove edit action buttons from those pages.
   - Ensure remaining actions (delete/status) are still accessible.

2) Validate navigation UX
   - Verify clickable rows still navigate to the edit/detail views.
   - Ensure keyboard focus styles and hover affordances remain clear.

3) Packaging plan (initial)
   - Choose desktop wrapper: Electron + electron-builder.
   - Bundle backend server + frontend build inside the app.
   - Use SQLite database file stored in app data directory.
   - Configure app to start backend on launch and open UI window.
   - Produce installers for Windows and macOS.

4) Documentation
   - Update `README.md` with packaging overview and local testing steps.

## Verification
- No edit action buttons remain where rows are clickable.
- Clickable rows still work and remaining actions are accessible.
- Packaging plan is documented for next implementation phase.
