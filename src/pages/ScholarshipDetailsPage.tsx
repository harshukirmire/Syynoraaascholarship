import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  CheckSquare,
  ClipboardPlus,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { evaluateDeadline, isSafeHttpUrl } from '../utils/validation.ts';

export function ScholarshipDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    scholarships,
    savedScholarships,
    applications,
    toggleSaveScholarship,
    upsertApplication,
  } = useAuth();

  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const scholarship = scholarships.find((s) => s.id === id);

  if (!scholarship) {
    return (
      <AppLayout>
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center max-w-xl mx-auto">
          <h1 className="font-display text-xl font-semibold text-zinc-900 mb-2">
            Scholarship not found
          </h1>
          <p className="text-sm text-zinc-600 mb-6">
            This scholarship record could not be located in the current catalog.
          </p>
          <Link
            to="/global-scholarships"
            className="px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
          >
            Browse Global Scholarships
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isSaved = savedScholarships.some((s) => s.scholarshipId === scholarship.id);
  const existingApp = applications.find((a) => a.scholarshipId === scholarship.id);
  const deadlineInfo = evaluateDeadline(scholarship.deadline);

  async function handleSave() {
    if (!scholarship || saving) return;
    setSaving(true);
    setActionMsg('');
    try {
      const nowSaved = await toggleSaveScholarship(scholarship);
      setActionMsg(nowSaved ? 'Scholarship saved to your account.' : 'Removed from saved scholarships.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStartTracking() {
    if (!scholarship || tracking) return;
    setTracking(true);
    setActionMsg('');
    try {
      await upsertApplication({
        id: existingApp?.id || `app_${scholarship.id}`,
        scholarshipId: scholarship.id,
        scholarshipName: scholarship.name,
        provider: scholarship.provider,
        deadline: scholarship.deadline,
        applicationDate: existingApp?.applicationDate || new Date().toISOString().slice(0, 10),
        status: existingApp?.status || 'Planning',
        referenceNumber: existingApp?.referenceNumber || '',
        notes: existingApp?.notes || '',
      });
      navigate('/tracker');
    } finally {
      setTracking(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl">
        <div>
          <Link
            to="/global-scholarships"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Scholarships</span>
          </Link>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <p className="text-xs text-zinc-500 mb-2">
                  {scholarship.scope} · {scholarship.providerType} · {scholarship.country}
                  {scholarship.state ? ` (${scholarship.state})` : ''}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-zinc-900 leading-tight">
                  {scholarship.name}
                </h1>
                <p className="text-sm text-zinc-600 mt-2">{scholarship.provider}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    isSaved
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                  <span>{isSaved ? 'Saved' : 'Save Scholarship'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartTracking}
                  disabled={tracking}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <ClipboardPlus className="w-4 h-4" aria-hidden="true" />
                  <span>{existingApp ? 'Open in Tracker' : 'Track Application'}</span>
                </button>

                <Link
                  to={`/guide?scholarshipId=${encodeURIComponent(scholarship.id)}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border border-zinc-300 bg-white text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  <span>Ask Synora Guide</span>
                </Link>
              </div>
            </div>

            {actionMsg && (
              <p className="mt-4 text-xs font-medium text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2">
                {actionMsg}
              </p>
            )}

            {/* Key Facts Grid */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8 pt-6 border-t border-zinc-200 text-xs">
              <div>
                <dt className="text-zinc-400">Study Levels</dt>
                <dd className="text-zinc-900 font-medium mt-1">
                  {scholarship.studyLevels.join(', ') || 'Not verified'}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400">Degrees</dt>
                <dd className="text-zinc-900 font-medium mt-1">
                  {scholarship.degrees.join(', ') || 'Depends on university/program'}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400">Funding Type</dt>
                <dd className="text-zinc-900 font-medium mt-1">{scholarship.fundingType}</dd>
              </div>
              <div>
                <dt className="text-zinc-400">Deadline</dt>
                <dd className="text-zinc-900 font-medium mt-1 font-mono-tabular">
                  {deadlineInfo.label}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400">University / Host</dt>
                <dd className="text-zinc-900 font-medium mt-1">
                  {scholarship.university || 'Multiple recognized institutions'}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400">Duration</dt>
                <dd className="text-zinc-900 font-medium mt-1">
                  {scholarship.duration || 'Depends on university/program'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-zinc-400">Eligible Fields</dt>
                <dd className="text-zinc-900 font-medium mt-1">
                  {scholarship.fields.join(', ') || 'All fields'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Funding & Eligibility */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-900 mb-2">
              Funding &amp; Eligibility Overview
            </h2>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {scholarship.fundingDetails || 'Funding breakdown not verified.'}
            </p>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-zinc-100 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Eligibility Summary</dt>
              <dd className="text-zinc-800 mt-1 leading-relaxed">
                {scholarship.eligibility.summary || 'Not verified.'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Academic Requirements</dt>
              <dd className="text-zinc-800 mt-1 leading-relaxed">
                {scholarship.eligibility.academicRequirements || 'Not verified.'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Income Requirements</dt>
              <dd className="text-zinc-800 mt-1 leading-relaxed">
                {scholarship.eligibility.incomeDetails || 'Not specified'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Domicile &amp; Category Rules</dt>
              <dd className="text-zinc-800 mt-1 leading-relaxed">
                {scholarship.eligibility.domicile} · Categories:{' '}
                {scholarship.eligibility.categories.join(', ')}
              </dd>
            </div>
          </dl>
        </section>

        {/* Clearly Separated EXAM REQUIRED Section */}
        <section
          aria-labelledby="exam-required-heading"
          className="bg-white border border-zinc-900 rounded-xl p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-200">
            <div>
              <p className="text-xs font-semibold tracking-wider text-zinc-500">
                EXAM REQUIRED
              </p>
              <h2 id="exam-required-heading" className="font-display text-xl font-semibold text-zinc-900 mt-0.5">
                {scholarship.examRequirement.status}
              </h2>
            </div>
            <span className="text-xs font-medium text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
              Classification: {scholarship.examRequirement.category}
            </span>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 text-sm">
            <div>
              <dt className="text-xs text-zinc-500">Exam Name</dt>
              <dd className="font-medium text-zinc-900 mt-1">
                {scholarship.examRequirement.examName || 'Not verified'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Exam Type / Category</dt>
              <dd className="font-medium text-zinc-900 mt-1">
                {scholarship.examRequirement.category}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Purpose</dt>
              <dd className="text-zinc-800 mt-1">
                {scholarship.examRequirement.purpose || 'Not verified.'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Minimum Score (Official Specification)</dt>
              <dd className="text-zinc-800 mt-1 font-mono-tabular">
                {scholarship.examRequirement.minimumScore || 'Depends on university/program'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Exam Deadline</dt>
              <dd className="text-zinc-800 mt-1">
                {scholarship.examRequirement.examDeadline || 'Depends on university/program'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Verification &amp; Source</dt>
              <dd className="text-zinc-800 mt-1">
                {scholarship.verificationStatus} · Verified {scholarship.lastVerifiedDate} ·{' '}
                {scholarship.officialSource}
              </dd>
            </div>
          </dl>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-wrap gap-3">
            {isSafeHttpUrl(scholarship.examRequirement.officialExamWebsite) && (
              <a
                href={scholarship.examRequirement.officialExamWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-50"
              >
                <span>External Official Exam Website</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
            {isSafeHttpUrl(scholarship.officialWebsite) && (
              <a
                href={scholarship.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-50"
              >
                <span>External Official Scholarship Website</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </section>

        {/* Required Documents & Application Procedure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-zinc-200 rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900 mb-4">
              Required Documents Checklist
            </h2>
            {scholarship.requiredDocuments.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Required document checklist not verified. Check the official scholarship website.
              </p>
            ) : (
              <ul className="space-y-2.5 text-sm text-zinc-800">
                {scholarship.requiredDocuments.map((docItem, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckSquare className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{docItem}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-zinc-200 rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900 mb-4">
              Application Procedure
            </h2>
            {scholarship.applicationProcedure.length === 0 ? (
              <p className="text-sm text-zinc-500">Application procedure not verified.</p>
            ) : (
              <ol className="space-y-3 text-sm text-zinc-800 list-decimal pl-5">
                {scholarship.applicationProcedure.map((stepText, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {stepText}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Official Links & Verification */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-zinc-600 space-y-1">
            <p className="font-semibold text-zinc-900">
              Official Links &amp; Data Verification
            </p>
            <p>
              Source: {scholarship.officialSource} · Status: {scholarship.verificationStatus} · Last verified: {scholarship.lastVerifiedDate}
            </p>
            <p className="text-zinc-500">
              External links open official government, foundation, or university portals in a new tab.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            {isSafeHttpUrl(scholarship.officialWebsite) && (
              <a
                href={scholarship.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border border-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-50 whitespace-nowrap"
              >
                <span>Official Website</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
            {isSafeHttpUrl(scholarship.officialPortal) && (
              <a
                href={scholarship.officialPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 whitespace-nowrap"
              >
                <span>Official Application Portal</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
