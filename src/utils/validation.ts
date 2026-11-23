import type { UserProfile } from '../types/synora.ts';

export const BLUEPRINT_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  ID_MAX: 128,
  EMAIL_MAX: 254,
  EXAM_NAME_MAX: 120,
  ATTEMPT_LABEL_MAX: 80,
  YEAR_MAX: 20,
  DATE_MAX: 40,
  SCHOLARSHIP_NAME_MAX: 240,
  PROVIDER_MAX: 200,
  COUNTRY_MAX: 100,
  STATE_MAX: 100,
  UNIVERSITY_MAX: 200,
  DEADLINE_MAX: 120,
  REFERENCE_MAX: 120,
  NOTES_MAX: 2000,
  URL_MAX: 500,
  FUNDING_DETAILS_MAX: 600,
  DURATION_MAX: 160,
  REMINDER_DAYS_MAX: 5,
} as const;

export function sanitizeId(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, BLUEPRINT_LIMITS.ID_MAX);
}

export function isSafeHttpUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'Not verified') return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function truncate(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export interface DeadlineInfo {
  label: string;
  state: 'upcoming' | 'expired' | 'varies' | 'unverified';
  daysRemaining: number | null;
}

export function evaluateDeadline(deadline: string, referenceNow: Date = new Date()): DeadlineInfo {
  const clean = (deadline || '').trim();
  if (!clean || clean.toLowerCase().includes('not verified')) {
    return { label: 'Not verified', state: 'unverified', daysRemaining: null };
  }

  // Only treat ISO or explicit calendar date strings (e.g., 2027-01-31 or November 30, 2026) as exact dates
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(clean);
  const parsedMs = isoMatch ? Date.parse(`${clean}T23:59:59Z`) : Date.parse(clean);

  if (!Number.isNaN(parsedMs) && /\d{4}/.test(clean)) {
    const diffMs = parsedMs - referenceNow.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days < 0) {
      return { label: `Expired (${Math.abs(days)}d ago)`, state: 'expired', daysRemaining: days };
    }
    if (days === 0) {
      return { label: 'Due today', state: 'upcoming', daysRemaining: 0 };
    }
    return { label: `${days} days remaining`, state: 'upcoming', daysRemaining: days };
  }

  return { label: clean, state: 'varies', daysRemaining: null };
}

export function calculateProfileCompletion(profile: UserProfile | null): {
  percentage: number;
  missingFields: string[];
} {
  if (!profile) {
    return { percentage: 0, missingFields: ['Complete basic profile'] };
  }

  const checks: Array<{ label: string; filled: boolean }> = [
    { label: 'Full name', filled: Boolean(profile.personal?.fullName?.trim()) },
    { label: 'Country', filled: Boolean(profile.personal?.country?.trim()) },
    { label: 'State', filled: Boolean(profile.personal?.state?.trim()) },
    {
      label: 'Scholarship search categories',
      filled: Boolean(profile.searchPreferences && profile.searchPreferences.length > 0),
    },
    { label: 'Current education level (optional)', filled: Boolean(profile.education?.level?.trim()) },
    { label: 'Family income (optional)', filled: Boolean(profile.eligibility?.annualFamilyIncome?.trim()) },
  ];

  const filledCount = checks.filter((c) => c.filled).length;
  const percentage = Math.round((filledCount / checks.length) * 100);
  const missingFields = checks.filter((c) => !c.filled).map((c) => c.label);

  return { percentage, missingFields };
}
