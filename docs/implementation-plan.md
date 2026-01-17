# Implementation Plan: Omnibox UX Fixes

## Scope
- Provide a clear way to exit/close the search omnibox.
- Include dentists in omnibox search results.

## Plan
1) Reproduce omnibox behavior
   - Confirm how the omnibox opens and current dismissal paths (blur, escape, click outside).
   - Identify the component and state handling.

2) Add explicit exit affordances
   - Add close button (X) and ensure Escape key closes.
   - Ensure click outside/blur closes without losing app focus.

3) Extend search sources
   - Add dentists to search index/query.
   - Ensure result rendering differentiates entity types.

4) Verification
   - Omnibox closes via X button, Escape, and click outside.
   - Dentist results appear and navigate correctly.
