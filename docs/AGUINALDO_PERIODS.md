# Aguinaldo Periods: Generation & Management

## Overview

Aguinaldo periods (June and December semesters) are **generated automatically** as the system progresses through time. No manual creation of new periods is required.

---

## How Periods Are Generated

### Automatic Period Availability

The system shows:
- **Past periods**: Last 2 years (for historical reference)
- **Current periods**: June/December of current year (if not passed)
- **Future periods**: June/December of next year (planning ahead)

**Total: 2-3 semesters visible at any time** (newest first)

### When New Periods Appear

New periods become available **automatically** as the calendar date advances:

#### Example Timeline:

**Today: April 2026**
```
✓ Junio 2024 (past)
✓ Diciembre 2024 (past)
✓ Junio 2025 (past)
✓ Diciembre 2025 (past)
→ Junio 2026 (current - upcoming)
→ Diciembre 2026 (next year)
```

**Three months later: July 2026** (after June passed)
```
✓ Diciembre 2024 (past)
✓ Junio 2025 (past)
✓ Diciembre 2025 (past)
✓ Junio 2026 (now passed/completed)
→ Diciembre 2026 (current - upcoming)
→ Junio 2027 (next year)
```

**Six months later: December 2026** (after December passed)
```
✓ Junio 2025 (past)
✓ Diciembre 2025 (past)
✓ Junio 2026 (past)
✓ Diciembre 2026 (now passed/completed)
→ Junio 2027 (next year - upcoming)
→ Diciembre 2027 (next year + 6 months)
```

---

## Workflow: Pre-generation of New Periods

### Step 1: Period Availability (Automatic)
When June or December arrives, the period automatically appears in the dropdown.

### Step 2: Pre-generation (Manual)
User decides to prepare aguinaldos for an upcoming period:

1. **Navigate**: Reportes → Calculadora de Aguinaldos
2. **Select Period**: Choose the upcoming June/December from dropdown
3. **Click**: "Pre-generar" button
4. **System Creates**: Draft payroll records for all active employees
5. **User Edits**: Completes the cash/deposit split in Liquidaciones

### Step 3: Records Become "Paid" (User Action)
Once the user fills in payment details and confirms, records change status from "draft" → "processed"

---

## Database & RLS Considerations

### New Periods Don't Require Schema Changes
- All June/December periods use the **same `payroll_records` table**
- No migration needed when a new period arrives
- The `period` column accepts any `YYYY-MM` format

### Example Payroll Record Fields
```sql
INSERT INTO payroll_records (
  employee_id,
  period,              -- "2027-06" (new period, auto-supported)
  aguinaldo,           -- calculated amount
  status,              -- "draft" or "processed"
  created_at,
  updated_at
) VALUES (...)
```

---

## Key Points

✅ **No Manual Period Creation**: The system automatically recognizes new June/December dates  
✅ **Smart Dropdown**: Only shows relevant periods (2 years past + next 1-2 future)  
✅ **Future-Proof**: Works for 2027, 2028, and beyond with no code changes  
✅ **Scalable RLS**: Aguinaldo RLS policies apply to all periods equally  

---

## Common Questions

### Q: What if I want to pre-generate January or March aguinaldos?
**A**: The system only supports June and December (Argentine law requirement). Other months will be rejected with an error message.

### Q: What happens if the system date skips forward?
**A**: New periods automatically become available. No intervention needed.

### Q: Can I manually add a period?
**A**: No, and you don't need to. Periods are generated algorithmically based on the current date.

### Q: What if I need to show 5 years of history?
**A**: Modify `generateAguinaldoPeriods()` in `src/utils/preGenerateAguinaldos.ts` to increase the `year - 5` range. All historical records are preserved in the database.

---

## Implementation Details

### File: `src/utils/preGenerateAguinaldos.ts`

**Function**: `generateAguinaldoPeriods()`

Logic:
1. Get current date and month
2. Calculate which June/December is next
3. Generate: 2 years past + current year + next year (if applicable)
4. Sort descending (newest first)
5. Return array of `{value: "YYYY-MM", label: "Month Year"}`

### File: `src/pages/Reports.tsx`

Uses `generateAguinaldoPeriods()` to populate dropdown in:
- Calculadora de Aguinaldos tab
- Period selector component

### File: `src/components/AguinaldoReport.tsx`

Also uses `generateAguinaldoPeriods()` for the Reporte de Aguinaldo period selector.

---

## Future Enhancements

Potential improvements (not required now):
- Add "auto-schedule" feature to pre-generate on specific dates
- Email notification when new period arrives
- Dashboard warning "Próximo aguinaldo en X días"
- API endpoint to get next aguinaldo date

---

**Last Updated**: 2026-06-05  
**Status**: Ready for production
