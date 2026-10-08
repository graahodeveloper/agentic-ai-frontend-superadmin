# 2026-10-08 — Demo Users: slimmer table + full-record Details modal

`/dashboard/demo-users` showed 8 columns and no way to read a lead's full record — and
never showed `additional_preferences`, the free text where a lead says what they want
covered in the demo. The table is now five columns with a **Details** button per row, and
the modal shows every field on the record.

## Why

Requested against the running super admin app: show the demo request information including
Additional Preferences, with a few columns in the table and a details button for the rest.

## What changed

- `src/features/demoUsers/demoUsersApi.ts` — one line: `additional_preferences?: string | null;` on the `DemoUser` interface. No endpoint, hook, tag, or cache change.
- `src/components/demo-users/DemoUsersList.tsx`:
  - **Table reduced from 8 columns to 5**: User, Company, Status, Registered, Actions.
    Contact, Sessions and Last Active were dropped as columns; the email folded into the
    User cell and the job title into the Company cell. No information is lost — phone,
    session count and last-active all appear in the modal.
  - **New `DetailsModal`**, a local component in the same file, matching the existing
    `DeleteModal` / `NoteModal` idiom already there (same overlay, blur, panel, gradient
    rule) rather than importing another feature's modal.
  - Field groups: Person (name, email, phone, job title), Company (company, source),
    Interest (`interest` plus a full-width `additional_preferences` block), Activity
    (status, sessions, first access, last active, registered, updated), Conversion
    (converted, converted user, converted at), Admin (internal notes).
  - `additional_preferences` and `admin_notes` render `whitespace-pre-wrap break-words` —
    they are free text (up to 2000 chars) and must keep their line breaks.
  - Any missing, `null`, or empty value renders as `—`, never `undefined`/blank.
  - Closes via overlay click, the X, the footer Close button, and Escape.
  - Removed the `formatDate` helper, orphaned when the Last Active column went; the
    remaining `formatDateTime` is reused throughout the modal.

Every existing behavior is preserved: search, status filter, pagination, refetch, the
inline status `<select>`, mark-as-engaged, add-note and delete, each with its handler.

## Intended outcome

A super admin can see what each lead asked for without leaving the page, while the table
stays scannable. Signal it worked: Details opens a populated modal; signal it did not:
fields read `—` for a lead whose data exists.

## Verification

- `npx tsc --noEmit` — exit 0, **zero** errors repo-wide.
- `npm run build` — exit 0; `/dashboard/demo-users` compiles at 8.18 kB (133 kB first load).
- Table integrity checked after the edit: 5 `<th>` and 5 `<td>` per row.

**Not verified:** the page was not rendered in a browser. The list endpoint requires super
admin authentication, so no logged-in session was available in this environment — layout
and data binding are verified by type checking and build only, not visually.

## Critical notes

- **`additional_preferences` will read `—` for every lead until the backend ships.** The
  column, migration and serializer changes live in `graaho-ai-agent-backend`
  (`0080_guestuser_additional_preferences`) and must be migrated and deployed first. The
  modal is built to look correct in that interim state.
- Branch `super-dev` (switched from `koronikai-prod`, which was checked out when this
  started). Uncommitted — nothing staged, committed, or pushed.
