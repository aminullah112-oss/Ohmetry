/**
 * Human review record, shown on a page as "Reviewed <date> by <name>".
 * Leave a page out until a qualified person has actually checked it. Never add an entry for work nobody did.
 * Key = page slug, for example 'kw-to-amps-calculator'.
 */
export const reviews: Record<string, { date: string; by: string }> = {
  // 'kw-to-amps-calculator': { date: '2026-11-01', by: 'A. Name, protection engineer' },
};
