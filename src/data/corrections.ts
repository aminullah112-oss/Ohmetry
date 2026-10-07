/**
 * Public corrections log. Add an entry whenever a published page, value or formula was wrong and has been fixed.
 * Shown on /corrections/ and as a notice on the page concerned.
 * `page` is the page slug ('' for site-wide). `date` is ISO (YYYY-MM-DD).
 */
export interface Correction { date: string; page: string; wrong: string; fixed: string }
export const corrections: Correction[] = [
  // { date: '2026-11-03', page: 'breaker-size-calculator', wrong: 'The 110 A rating was missing from the list.', fixed: 'Added 110 A to the standard ratings.' },
];
