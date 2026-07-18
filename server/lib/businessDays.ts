/**
 * Adds N *business* days (Mon-Fri) to a date, skipping weekends.
 * Used for the 15-business-day free trial so a signup on a Friday doesn't
 * silently lose two days of trial to the weekend.
 *
 * Does not account for Peruvian public holidays -- if that precision is
 * ever needed, plug a holiday calendar into `isBusinessDay`.
 */
export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      remaining -= 1;
    }
  }

  return result;
}

export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}
