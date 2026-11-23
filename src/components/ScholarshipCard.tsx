import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowUpRight } from 'lucide-react';
import type { Scholarship } from '../types/synora.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { evaluateDeadline } from '../utils/validation.ts';

interface ScholarshipCardProps {
  scholarship: Scholarship;
  footerExtra?: React.ReactNode;
}

export function ScholarshipCard({ scholarship, footerExtra }: ScholarshipCardProps) {
  const { savedScholarships, toggleSaveScholarship } = useAuth();
  const [saving, setSaving] = useState(false);

  const isSaved = savedScholarships.some((s) => s.scholarshipId === scholarship.id);
  const deadlineInfo = evaluateDeadline(scholarship.deadline);

  async function handleToggleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await toggleSaveScholarship(scholarship);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between transition-colors hover:border-zinc-300">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 mb-1.5 truncate">
              <span>{scholarship.country}</span>
              {scholarship.state ? (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>{scholarship.state}</span>
                </>
              ) : null}
              <span aria-hidden="true"> · </span>
              <span>{scholarship.fundingType}</span>
            </p>
            <h3 className="font-display text-lg font-semibold text-zinc-900 leading-snug">
              <Link
                to={`/scholarships/${scholarship.id}`}
                className="hover:underline underline-offset-4"
              >
                {scholarship.name}
              </Link>
            </h3>
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            disabled={saving}
            aria-label={isSaved ? `Unsave ${scholarship.name}` : `Save ${scholarship.name}`}
            aria-pressed={isSaved}
            className={`p-2 rounded-lg border transition-colors shrink-0 ${
              isSaved
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        <p className="text-sm text-zinc-600 mb-4">{scholarship.provider}</p>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs border-t border-zinc-100 pt-4 mb-4">
          <div>
            <dt className="text-zinc-400">Study Level</dt>
            <dd className="text-zinc-800 font-medium mt-0.5">
              {scholarship.studyLevels.join(', ') || 'Not specified'}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Degree</dt>
            <dd className="text-zinc-800 font-medium mt-0.5">
              {scholarship.degrees.join(', ') || 'Depends on program'}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Fields</dt>
            <dd className="text-zinc-800 font-medium mt-0.5 truncate">
              {scholarship.fields.join(', ') || 'All eligible fields'}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Deadline</dt>
            <dd className="text-zinc-800 font-medium mt-0.5 font-mono-tabular">
              {deadlineInfo.label}
            </dd>
          </div>
        </dl>

        <div className="bg-zinc-50 border border-zinc-200/80 rounded-lg px-3.5 py-2.5 mb-4">
          <p className="text-[11px] font-semibold tracking-wide text-zinc-500">
            EXAM REQUIRED
          </p>
          <p className="text-xs font-medium text-zinc-900 mt-0.5">
            {scholarship.examRequirement.status}
          </p>
          <p className="text-xs text-zinc-600 mt-0.5 truncate">
            {scholarship.examRequirement.examName}
          </p>
        </div>

        {footerExtra}
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100">
        <span className="text-xs text-zinc-500">
          {scholarship.verificationStatus} · {scholarship.lastVerifiedDate}
        </span>
        <Link
          to={`/scholarships/${scholarship.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
        >
          <span>View Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
