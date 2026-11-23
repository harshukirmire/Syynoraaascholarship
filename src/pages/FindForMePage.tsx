import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, HelpCircle, Info, XCircle } from 'lucide-react';
import { AppLayout } from '../components/AppLayout.tsx';
import { ScholarshipCard } from '../components/ScholarshipCard.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { EligibilityMatchStatus } from '../types/synora.ts';
import { evaluateScholarshipMatch } from '../utils/matching.ts';

type StatusFilter = 'All' | EligibilityMatchStatus;

const STATUS_ORDER: Record<EligibilityMatchStatus, number> = {
  'Matches provided criteria': 0,
  'More information required': 1,
  'Eligibility could not be verified': 2,
  'Does not match a known requirement': 3,
};

export function FindForMePage() {
  const { profile, examResults, scholarships } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const evaluations = useMemo(() => {
    return scholarships
      .map((s) => evaluateScholarshipMatch(s, profile, examResults))
      .sort(
        (a, b) =>
          STATUS_ORDER[a.matchStatus] - STATUS_ORDER[b.matchStatus] ||
          b.matchedPreferences.length - a.matchedPreferences.length ||
          b.matchedCriteria.length - a.matchedCriteria.length
      );
  }, [scholarships, profile, examResults]);

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return evaluations;
    return evaluations.filter((e) => e.matchStatus === statusFilter);
  }, [evaluations, statusFilter]);

  const preferences = profile?.searchPreferences || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-zinc-900">
              Find For Me — Personalized Scholarship Matching
            </h1>
            <p className="text-sm text-zinc-600 mt-1 max-w-3xl">
              Evaluates each scholarship&apos;s own requirements independently using your education level, selected search categories, exam records, location, and optional academic or income details.
            </p>
          </div>
          <Link
            to="/profile"
            className="px-4 py-2 text-xs font-medium border border-zinc-300 bg-white text-zinc-900 rounded-lg hover:bg-zinc-50 whitespace-nowrap shrink-0 self-start lg:self-auto"
          >
            Update Profile, Categories &amp; Exams
          </Link>
        </div>

        {/* Active Profile Signals Summary */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-zinc-400 font-medium">Location &amp; Education Level</p>
            <p className="text-zinc-900 font-medium mt-1">
              {[
                profile?.personal?.state,
                profile?.personal?.country,
                profile?.education?.level || 'Education level not set',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div>
            <p className="text-zinc-400 font-medium">Selected Search Preferences</p>
            <p className="text-zinc-900 font-medium mt-1">
              {preferences.length > 0 ? preferences.join(', ') : 'None selected yet'}
            </p>
          </div>
          <div>
            <p className="text-zinc-400 font-medium">Recorded Exams</p>
            <p className="text-zinc-900 font-medium mt-1">
              {examResults.length > 0
                ? examResults.map((e) => e.examName).join(', ')
                : 'No exams recorded yet'}
            </p>
          </div>
        </div>

        {/* Non-rejection / Transparency Notice */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-start gap-3 text-xs text-zinc-700">
          <Info className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-zinc-900">
              Missing details never automatically exclude you from a scholarship.
            </p>
            <p className="text-zinc-600 mt-0.5">
              Each program is checked only against criteria that apply to it. Scholarships missing a detail appear under &ldquo;More information required&rdquo; with an explanation of what is needed. Want to browse without profile filtering? Open{' '}
              <Link to="/explorer" className="underline font-medium text-zinc-900">
                Scholarship Explorer
              </Link>
              {' '}or{' '}
              <Link to="/global-scholarships" className="underline font-medium text-zinc-900">
                Global Scholarships
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              'All',
              'Matches provided criteria',
              'More information required',
              'Eligibility could not be verified',
              'Does not match a known requirement',
            ] as StatusFilter[]
          ).map((status) => {
            const count =
              status === 'All'
                ? evaluations.length
                : evaluations.filter((e) => e.matchStatus === status).length;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === status
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>

        {/* Match Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((item) => (
            <div key={item.scholarship.id} className="space-y-3">
              <ScholarshipCard
                scholarship={item.scholarship}
                footerExtra={
                  <div className="border-t border-zinc-100 pt-3 pb-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`font-semibold ${
                          item.matchStatus === 'Matches provided criteria'
                            ? 'text-emerald-800'
                            : item.matchStatus === 'Does not match a known requirement'
                            ? 'text-red-800'
                            : item.matchStatus === 'More information required'
                            ? 'text-amber-800'
                            : 'text-zinc-700'
                        }`}
                      >
                        {item.matchStatus}
                      </span>
                      {item.matchedPreferences.length > 0 && (
                        <span className="text-zinc-500">
                          Categories: {item.matchedPreferences.join(' · ')}
                        </span>
                      )}
                    </div>

                    <p className="text-zinc-700">{item.explanation}</p>

                    {item.matchedCriteria.length > 0 && (
                      <div>
                        <p className="font-medium text-emerald-800 mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Matched criteria</span>
                        </p>
                        <ul className="space-y-0.5 text-zinc-700 pl-5 list-disc">
                          {item.matchedCriteria.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.unmetCriteria.length > 0 && (
                      <div>
                        <p className="font-medium text-red-800 mb-1 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Known requirements not met</span>
                        </p>
                        <ul className="space-y-0.5 text-zinc-700 pl-5 list-disc">
                          {item.unmetCriteria.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.missingInformation.length > 0 && (
                      <div>
                        <p className="font-medium text-amber-800 mb-1 flex items-center gap-1.5">
                          {item.matchStatus === 'Eligibility could not be verified' ? (
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>Information needed to verify</span>
                        </p>
                        <ul className="space-y-0.5 text-zinc-600 pl-5 list-disc">
                          {item.missingInformation.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
