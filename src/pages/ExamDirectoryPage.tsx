import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { AppLayout } from '../components/AppLayout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { isSafeHttpUrl } from '../utils/validation.ts';

export function ExamDirectoryPage() {
  const { exams } = useAuth();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(exams.map((e) => e.category)))],
    [exams]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exams.filter((exam) => {
      if (categoryFilter !== 'All' && exam.category !== categoryFilter) return false;
      if (!q) return true;
      return [
        exam.name,
        exam.shortName,
        exam.countryOrRegion,
        exam.purpose,
        exam.relatedPrograms.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [exams, query, categoryFilter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="border-b border-zinc-200 pb-6">
          <h1 className="font-display text-2xl font-semibold text-zinc-900">
            Examination Information Directory
          </h1>
          <p className="text-sm text-zinc-600 mt-1 max-w-3xl">
            Explore language proficiency tests, national/state entrance exams, and scholarship-specific examinations with verified official links.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search
              className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exams (IELTS, TOEFL, HSK, JLPT, TOPIK, MEXT, GATE, JEE)..."
              aria-label="Search examinations"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((exam) => (
            <article
              key={exam.id}
              className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">
                  {exam.category} · {exam.countryOrRegion}
                </p>
                <h2 className="font-display text-lg font-semibold text-zinc-900">
                  {exam.shortName} — {exam.name}
                </h2>

                <dl className="mt-4 space-y-3 text-xs border-t border-zinc-100 pt-4">
                  <div>
                    <dt className="text-zinc-400 font-medium">Purpose</dt>
                    <dd className="text-zinc-800 mt-0.5 leading-relaxed">{exam.purpose}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-400 font-medium">Who generally takes it</dt>
                    <dd className="text-zinc-800 mt-0.5 leading-relaxed">{exam.whoTakesIt}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-400 font-medium">Related scholarships or programs</dt>
                    <dd className="text-zinc-800 mt-0.5">
                      {exam.relatedPrograms.join(' · ') || 'Depends on university/program'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-400 font-medium">Official requirements note</dt>
                    <dd className="text-zinc-700 mt-0.5 leading-relaxed">{exam.requirementsNote}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 mt-5 border-t border-zinc-100">
                <span className="text-xs text-zinc-500">
                  {exam.verificationStatus} · {exam.lastVerifiedDate}
                </span>
                {isSafeHttpUrl(exam.officialWebsite) ? (
                  <a
                    href={exam.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Official Exam Website</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-xs text-zinc-400">Official link not verified</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
