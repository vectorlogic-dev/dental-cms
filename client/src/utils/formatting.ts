import { PatientSummary, UserSummary } from '../types/api';

/**
 * Format a person's full name from a patient, user, or string ID
 * @param person - PatientSummary, UserSummary, or string ID
 * @returns Formatted full name or empty string
 */
export function formatPersonName(person?: PatientSummary | UserSummary | string): string {
  if (!person || typeof person === 'string') return '';
  return `${person.firstName || ''} ${person.lastName || ''}`.trim();
}
