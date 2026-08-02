# TanStack Table — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/tanstack/table`
- **Version:** `@tanstack/react-table` v8
- **Official Source:** https://tanstack.com/table/v8
- **Decision Affected:** Data tables, grid layouts, sorting, pagination, and filtering in administrative and operational portals.

## Key Contracts & Implementation Patterns

1. **Headless Architecture:**
   - Separation of table logic (state, sorting, pagination, row selection) from UI component rendering.

2. **Integration with shadcn/ui:**
   - Connect `useReactTable` state and cell renderers with `src/components/ui/table.tsx` primitives (`<Table>`, `<TableHeader>`, `<TableRow>`, `<TableCell>`).

3. **Strongly Typed Column Definitions:**
   - Define columns using `ColumnDef<TData, TValue>[]` to ensure type safety across data fields and cell formatting.

4. **Features & State Management:**
   - Multi-column sorting (`getSortedRowModel`).
   - Global and column-level filtering (`getFilteredRowModel`).
   - Pagination controls (`getPaginationRowModel`) with configurable page size.
   - Column visibility toggling for customizable admin data views.

5. **Accessibility Standards:**
   - Renders semantic HTML table markup (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`) ensuring screen-reader compatibility.
