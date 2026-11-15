import { addDays, format } from 'date-fns';

/**
 * Returns an active journey date for tests (tomorrow's date by default)
 * to ensure that membership expiration checks are always valid regardless of the real system clock.
 */
export function getTestJourneyDate(offsetDays: number = 1): string {
  const target = addDays(new Date(), offsetDays);
  return format(target, 'yyyy-MM-dd');
}
