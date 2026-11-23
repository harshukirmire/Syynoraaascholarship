import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BookmarkMinus, ClipboardPlus, ExternalLink, Info } from 'lucide-react';
import { AppLayout } from '../components/AppLayout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { Scholarship } from '../types/synora.ts';
import { evaluateDeadline, isSafeHttpUrl } from '../utils/validation.ts';

const REMINDER_OPTIONS = [30, 14, 7, 3, 1];

export function SavedScholarshipsPage() {
  const {
    savedScholarships,
    scholarships,
    applications,
    toggleSaveScholarship,
    updateSavedReminderDays,
    upsertApplication,
  } = useAuth();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState('');

  async function toggleReminderDay(scholarshipId: string, currentDays: number[], day: number) {
    setActionError('');
    const exists = currentDays.includes(day);
    const next = exists
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => b - a);
    try {
      await updateSavedReminderDays(scholarshipId, next);
    } catch {
      setActionError('Unable to update reminder preferences. Please try again.');
    }
  }

  async function handleUnsave(scholarship: Scholarship) {
    setActionError('');
    try {
      await toggleSaveScholarship(scholarship);
    } catch {
      setActionError('Unable to remove saved scholarship. Please try again.');
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="border-b border-zinc-200 pb-6">
          <h1 className="font-display text-2xl font-semibold text-zinc-900">
            Saved Scholarships &amp; Deadlines
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Monitor deadlines and configure reminder intervals for your bookmarked scholarships.
          </p>
        </div>

        {/* Honest Notification Infrastructure Notice */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-start gap-3 text-xs text-zinc-700">
          <Info className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-zinc-900">
              Reminder delivery status: Pending external email/push configuration
            </p>
            <p className="text-zinc-600 mt-0.5">
              Your selected reminder intervals (30, 14, 7, 3, 1 days before) are saved to your Firestore account. Automated email/push dispatch requires configuring an external delivery worker (such as Cloud Functions with SMTP/FCM).
            </p>
          </div>
        </div>

        {actionError && (
          <div
            role="alert"
            className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800"
          >
            {actionError}
          </div>
        )}

        {savedScholarships.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
            <p className="text-sm font-medium text-zinc-900">No saved scholarships yet</p>
            <p className="text-xs text-zinc-500 mt-1 mb-5">
              Save programs from Global Scholarships or Find For Me to monitor deadlines and start tracking applications.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/global-scholarships"
                className="px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
              >
                Browse Global Scholarships
              </Link>
              <Link
                to="/find-for-me"
                className="px-4 py-2 text-xs font-medium border border-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-50"
              >
                Run Find For Me
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {savedScholarships.map((saved) => {
              const full = scholarships.find((s) => s.id === saved.scholarshipId);
              const dl = evaluateDeadline(full?.deadline || saved.deadline);
              const existingApp = applications.find(
                (a) => a.scholarshipId === saved.scholarshipId
              );

              return (
                <article
                  key={saved.scholarshipId}
                  className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">
                        {saved.country} · {saved.provider}
                      </p>
                      <h2 className="font-display text-lg font-semibold text-zinc-900 mt-1">
                        <Link
                          to={`/scholarships/${saved.scholarshipId}`}
                          className="hover:underline underline-offset-4"
                        >
                          {saved.scholarshipName}
                        </Link>
                      </h2>
                      <p className="text-xs mt-1.5 font-mono-tabular">
                        <span className="text-zinc-500">Deadline status: </span>
                        <span
                          className={
                            dl.state === 'expired'
                              ? 'text-red-700 font-semibold'
                              : dl.state === 'upcoming'
                              ? 'text-amber-700 font-semibold'
                              : 'text-zinc-800 font-medium'
                          }
                        >
                          {dl.label}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          setActionError('');
                          try {
                            await upsertApplication({
                              id: existingApp?.id || `app_${saved.scholarshipId}`,
                              scholarshipId: saved.scholarshipId,
                              scholarshipName: saved.scholarshipName,
                              provider: saved.provider,
                              deadline: full?.deadline || saved.deadline,
                              applicationDate:
                                existingApp?.applicationDate ||
                                new Date().toISOString().slice(0, 10),
                              status: existingApp?.status || 'Planning',
                              referenceNumber: existingApp?.referenceNumber || '',
                              notes: existingApp?.notes || '',
                            });
                            navigate('/tracker');
                          } catch {
                            setActionError('Unable to open application in tracker. Please try again.');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 whitespace-nowrap"
                      >
                        <ClipboardPlus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{existingApp ? 'View in Tracker' : 'Start Tracking'}</span>
                      </button>

                      {full && isSafeHttpUrl(full.officialPortal) && (
                        <a
                          href={full.officialPortal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-zinc-300 text-zinc-800 rounded-lg hover:bg-zinc-50 whitespace-nowrap"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          void handleUnsave(
                            full || {
                              id: saved.scholarshipId,
                              name: saved.scholarshipName,
                              provider: saved.provider,
                              country: saved.country,
                              scope: 'International',
                              providerType: '',
                              studyLevels: [],
                              degrees: [],
                              fields: [],
                              fundingType: '',
                              fundingDetails: '',
                              duration: '',
                              deadline: saved.deadline,
                              deadlineStatus: '',
                              eligibility: {
                                incomeDetails: '',
                                categories: [],
                                domicile: '',
                                nationalities: [],
                                academicRequirements: '',
                                summary: '',
                              },
                              examRequirement: {
                                status: 'Requirement not verified',
                                category: 'Conditional requirement',
                                examName: '',
                                purpose: '',
                                minimumScore: '',
                                examDeadline: '',
                                officialExamWebsite: '',
                              },
                              requiredDocuments: [],
                              applicationProcedure: [],
                              officialWebsite: '',
                              officialPortal: '',
                              officialSource: '',
                              verificationStatus: 'Needs Review',
                              lastVerifiedDate: '',
                            }
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 whitespace-nowrap"
                      >
                        <BookmarkMinus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Unsave</span>
                      </button>
                    </div>
                  </div>

                  {/* Reminder Intervals */}
                  <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 mr-2">
                      <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Reminder preferences:</span>
                    </span>
                    {REMINDER_OPTIONS.map((day) => {
                      const active = (saved.reminderDays || []).includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            void toggleReminderDay(
                              saved.scholarshipId,
                              saved.reminderDays || [],
                              day
                            )
                          }
                          className={`px-2.5 py-1 text-xs font-mono-tabular rounded-md border transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-zinc-900 text-white border-zinc-900'
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          {day}d before
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
