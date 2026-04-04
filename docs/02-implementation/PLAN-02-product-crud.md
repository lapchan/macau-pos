# Implementation Plan 02: Product CRUD — Admin Dashboard

**Status:** ✅ Completed (2026-03-23)
**Persona:** Backend Architect + Frontend Developer

---

## Context
The admin Items page displayed products in a read-only table (350 items imported from YP.mo). Merchants needed to add, edit, and delete products directly from the dashboard.

## Architecture
- **UI pattern**: Right-side slide-over panel for create/edit (Apple-style)
- **Mutations**: Server actions with `{ success, error, data }` return pattern
- **Image upload**: Next.js API route (`/api/upload`) writing to `public/uploads/`
- **Cache**: `revalidatePath("/items")` after each mutation
- **Safety**: Tenant isolation, soft delete, optimistic locking

## Files Created (7)
1. `apps/admin/src/lib/product-actions.ts` — 5 server actions (create, update, delete, bulkDelete, bulkUpdateStatus)
2. `apps/admin/src/lib/category-actions.ts` — 3 server actions (create, update, delete)
3. `apps/admin/src/app/api/upload/route.ts` — Image upload (JPEG/PNG/WebP, 2MB max)
4. `apps/admin/src/components/items/product-slide-over.tsx` — Create/edit form panel
5. `apps/admin/src/components/items/delete-confirm-dialog.tsx` — Delete confirmation
6. `apps/admin/src/components/items/bulk-actions-bar.tsx` — Floating bulk actions
7. `apps/admin/public/uploads/.gitkeep` — Upload directory

## Files Modified (3)
8. `apps/admin/src/app/(dashboard)/items/page.tsx` — Pass full category objects + version
9. `apps/admin/src/app/(dashboard)/items/items-client.tsx` — Wire all CRUD UI
10. `apps/admin/src/lib/queries.ts` — Add `getProductById`

## Key Design Decisions
- **Slide-over** (not modal) — keeps table visible, Apple-style
- **Soft delete** — `deletedAt` field, never hard delete
- **Optimistic locking** — `version` field prevents concurrent edit conflicts
- **Local disk images** — simplest for MVP, migrate to cloud later
- **API route for upload** — more reliable than server action for file streams
- **Translations collapsible** — EN primary, CN/JA/PT in expandable section

## Verification
- ✅ Create product → saved to DB → table refreshed (18 → 19 items)
- ✅ Edit product → form pre-fills → optimistic locking works
- ✅ Delete product → soft delete confirmation → product removed
- ✅ Bulk select → floating action bar → bulk delete/status change
- ✅ Image upload → file saved to public/uploads/ → path in DB
