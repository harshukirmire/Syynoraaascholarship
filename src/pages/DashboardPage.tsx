import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  ClipboardCheck,
  Compass,
  MessageSquare,
  Sparkles,
  User,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout.tsx';
import { ScholarshipCard } from '../components/ScholarshipCard.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { evaluateScholarshipMatch } from '../utils/matching.ts';
import { calculateProfileCompletion, evaluateDeadline } from '../utils/validation.ts';

export function DashboardPage() {
  const {
    user,
    profile,
    examResults,
    savedScholarships,
    applications,
    scholarships,
  } = useAuth();

  const studentName =
    profile?.personal?.fullName?.trim() ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Student';

  const { percentage: completionPct, missingFields } = useMemo(
    () => calculateProfileCompletion(profile),
    [profile]
  );

  const recommended = useMemo(() => {
    const statusOrder = {
      'Matches provided criteria': 0,
      'More information required': 1,
      'Eligibility could not be verified': 2,
      'Does not match a known requirement': 3,
    };
    return scholarships
      .map((s) => evaluateScholarshipMatch(s, profile, examResults))
      .sort(
        (a, b) =>
          statusOrder[a.matchStatus] - statusOrder[b.matchStatus] ||
          b.matchedPreferences.length - a.matchedPreferences.length ||
          b.matchedCriteria.length - a.matchedCriteria.length
      )
      .slice(0, 3);
  }, [scholarships, profile, examResults]);

  const upcomingDeadlinesCount = useMemo(() => {
    return savedScholarships.filter((s) => {
      const d = evaluateDeadline(s.deadline);
      return d.state === 'upcoming';
    }).length;
  }, [savedScholarships]);

  const statusCounts = useMemo(() => {
    return applications.reduce<Record<string, number>>((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
  }, [applications]);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <p className="text-xs text-zinc-500">Student Workspace</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-zinc-900 mt-1">
              Welcome, {studentName}
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              {profile?.education?.level
                ? `${profile.education.level}${profile.education.course ? ` · ${profile.education.course}` : ''}${profile.personal?.country ? ` · ${profile.personal.country}` : ''}`
                : 'Complete your profile details to improve scholarship guidance.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/find-for-me"
              className="px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
            >
              Run Find For Me
            </Link>
            <Link
              to="/global-scholarships"
              className="px-4 py-2 text-xs font-medium border border-zinc-300 bg-white text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
            >
              Browse Global Directory
            </Link>
          </div>
        </section>

        {/* 4 Dashboard Summary Cards */}
        <section aria-label="Workspace summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/saved"
            className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 transition-colors"
          >
            <p className="text-xs text-zinc-500">Saved Scholarships</p>
            <p className="font-mono-tabular text-3xl font-semibold text-zinc-900 mt-2">
              {savedScholarships.length}
            </p>
            <p className="text-xs text-zinc-500 mt-2">Bookmarked programs</p>
          </Link>

          <Link
            to="/tracker"
            className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 transition-colors"
          >
            <p className="text-xs text-zinc-500">Applications</p>
            <p className="font-mono-tabular text-3xl font-semibold text-zinc-900 mt-2">
              {applications.length}
            </p>
            <p className="text-xs text-zinc-500 mt-2">Tracked submissions</p>
          </Link>

          <Link
            to="/saved"
            className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 transition-colors"
          >
            <p className="text-xs text-zinc-500">Upcoming Deadlines</p>
            <p className="font-mono-tabular text-3xl font-semibold text-zinc-900 mt-2">
              {upcomingDeadlinesCount}
            </p>
            <p className="text-xs text-zinc-500 mt-2">Dated saved deadlines</p>
          </Link>

          <Link
            to="/profile"
            className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 transition-colors"
          >
            <p className="text-xs text-zinc-500">Profile Completion</p>
            <p className="font-mono-tabular text-3xl font-semibold text-zinc-900 mt-2">
              {completionPct}%
            </p>
            <p className="text-xs text-zinc-500 mt-2 truncate">
              {missingFields.length > 0 ? `${missingFields.length} fields remaining` : 'All core fields saved'}
            </p>
          </Link>
        </section>

        {/* Recommended Scholarships */}
        <section aria-labelledby="recommended-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="recommended-heading" className="font-display text-lg font-semibold text-zinc-900">
                Potentially Matching Scholarships
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Transparent rule-based preview from Find For Me. Always verify official eligibility.
              </p>
            </div>
            <Link
              to="/find-for-me"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-900 hover:underline whitespace-nowrap shrink-0"
            >
              <span>View all matches</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {recommended.map((match) => (
              <ScholarshipCard
                key={match.scholarship.id}
                scholarship={match.scholarship}
                footerExtra={
                  <p className="text-xs text-zinc-700 pb-3">
                    <span className="font-semibold">{match.matchStatus}</span>
                    {match.matchedCriteria.length > 0 && (
                      <>
                        <span className="text-zinc-400"> · </span>
                        <span>{match.matchedCriteria.length} criteria matched</span>
                      </>
                    )}
                  </p>
                }
              />
            ))}
          </div>
        </section>

        {/* Saved Deadlines, Applications, Exams & Synora Guide AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saved & Deadlines */}
          <section className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-semibold text-zinc-900">
                  Saved Scholarships &amp; Deadlines
                </h2>
                <Link to="/saved" className="text-xs font-medium text-zinc-700 hover:text-zinc-900">
                  Manage
                </Link>
              </div>
              {savedScholarships.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4">
                  No scholarships saved yet. Bookmark scholarships from Global Scholarships or Find For Me to monitor deadlines.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {savedScholarships.slice(0, 4).map((item) => {
                    const dl = evaluateDeadline(item.deadline);
                    return (
                      <li key={item.scholarshipId} className="py-3 first:pt-0 last:pb-0">
                        <Link
                          to={`/scholarships/${item.scholarshipId}`}
                          className="text-sm font-medium text-zinc-900 hover:underline block truncate"
                        >
                          {item.scholarshipName}
                        </Link>
                        <p className="text-xs text-zinc-500 mt-0.5 font-mono-tabular">
                          {item.country} · {dl.label}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <Link
              to="/saved"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 hover:underline"
            >
              <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Open Saved Scholarships</span>
            </Link>
          </section>

          {/* Application Status & Exam Summary */}
          <section className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-base font-semibold text-zinc-900">
                  Application Status
                </h2>
                <Link to="/tracker" className="text-xs font-medium text-zinc-700 hover:text-zinc-900">
                  Tracker
                </Link>
              </div>
              {applications.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No applications tracked yet. Start tracking from any scholarship page.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="bg-zinc-50 border border-zinc-200/70 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-zinc-700">{status}</span>
                      <span className="font-mono-tabular font-semibold text-zinc-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-base font-semibold text-zinc-900">
                  Exam Profile Summary
                </h2>
                <Link to="/profile" className="text-xs font-medium text-zinc-700 hover:text-zinc-900">
                  Edit Exams
                </Link>
              </div>
              {examResults.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No exam attempts recorded. Add JEE, MHT-CET, NEET, GATE, IELTS, or board scores.
                </p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {examResults.slice(0, 3).map((ex) => (
                    <li key={ex.id} className="flex items-center justify-between text-zinc-700">
                      <span className="font-medium text-zinc-900">{ex.examName}</span>
                      <span className="text-zinc-500">{ex.attemptLabel}{ex.year ? ` · ${ex.year}` : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Quick Actions & Synora Guide AI */}
          <section className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-zinc-900 mb-2">
                Synora Guide AI &amp; Quick Actions
              </h2>
              <p className="text-xs text-zinc-600 mb-5">
                Ask verified questions about required documents, exam distinctions, application steps, or your own tracked deadlines.
              </p>

              <div className="space-y-2">
                <Link
                  to="/guide"
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Open Synora Guide AI</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/find-for-me"
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs font-medium border border-zinc-200 text-zinc-800 rounded-lg hover:bg-zinc-50"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Find Scholarships For Me</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/exam-directory"
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs font-medium border border-zinc-200 text-zinc-800 rounded-lg hover:bg-zinc-50"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Explore Exam Directory</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/explorer"
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs font-medium border border-zinc-200 text-zinc-800 rounded-lg hover:bg-zinc-50"
                >
                  <span className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Search Scholarship Explorer</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/tracker"
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs font-medium border border-zinc-200 text-zinc-800 rounded-lg hover:bg-zinc-50"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Update Application Tracker</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs font-medium border border-zinc-200 text-zinc-800 rounded-lg hover:bg-zinc-50"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Update Profile &amp; Exam Scores</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
