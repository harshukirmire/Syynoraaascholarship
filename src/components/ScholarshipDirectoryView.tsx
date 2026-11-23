import { useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { ScholarshipCard } from './ScholarshipCard.tsx';
import type { Scholarship } from '../types/synora.ts';

interface ScholarshipDirectoryViewProps {
  title: string;
  subtitle: string;
  scholarships: Scholarship[];
  bannerNote?: string;
}

const CATEGORIES = [
  'All Scholarships',
  'Central',
  'State',
  'International',
  'Government',
  'University',
  'Foundation',
  'Full Funding',
  'Partial Funding',
  'Undergraduate',
  "Master's",
  'PhD',
  'Engineering & Technology',
  'Natural Sciences',
  'Medicine & Health',
  'Business & Economics',
  'Humanities & Social Sciences',
] as const;

const QUICK_CHIPS = [
  'Full Funding',
  'No Separate Exam',
  'Undergraduate',
  "Master's",
  'PhD',
  'Japan',
  'China',
  'Germany',
] as const;

export function ScholarshipDirectoryView({
  title,
  subtitle,
  scholarships,
  bannerNote,
}: ScholarshipDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All Scholarships');
  const [quickChip, setQuickChip] = useState<string>('');

  const [countryFilter, setCountryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [studyLevelFilter, setStudyLevelFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [fundingFilter, setFundingFilter] = useState('');
  const [examReqFilter, setExamReqFilter] = useState('');

  const uniqueCountries = useMemo(
    () => Array.from(new Set(scholarships.map((s) => s.country))).sort(),
    [scholarships]
  );
  const uniqueStates = useMemo(
    () =>
      Array.from(
        new Set(scholarships.map((s) => s.state).filter((x): x is string => Boolean(x)))
      ).sort(),
    [scholarships]
  );
  const uniqueProviders = useMemo(
    () => Array.from(new Set(scholarships.map((s) => s.providerType))).sort(),
    [scholarships]
  );
  const uniqueFunding = useMemo(
    () => Array.from(new Set(scholarships.map((s) => s.fundingType))).sort(),
    [scholarships]
  );

  function resetAll() {
    setSearchQuery('');
    setActiveCategory('All Scholarships');
    setQuickChip('');
    setCountryFilter('');
    setStateFilter('');
    setProviderFilter('');
    setStudyLevelFilter('');
    setFieldFilter('');
    setFundingFilter('');
    setExamReqFilter('');
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return scholarships.filter((s) => {
      if (q) {
        const haystack = [
          s.name,
          s.provider,
          s.country,
          s.state || '',
          s.university || '',
          s.fields.join(' '),
          s.degrees.join(' '),
          s.studyLevels.join(' '),
          s.examRequirement.examName,
          s.examRequirement.status,
          s.eligibility.summary,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (activeCategory !== 'All Scholarships') {
        if (activeCategory === 'Central' && s.providerType !== 'Central Government') return false;
        if (activeCategory === 'State' && s.providerType !== 'State Government') return false;
        if (activeCategory === 'International' && s.scope !== 'International') return false;
        if (
          activeCategory === 'Government' &&
          !s.providerType.toLowerCase().includes('government') &&
          s.providerType !== 'AICTE' &&
          s.providerType !== 'UGC'
        ) {
          return false;
        }
        if (activeCategory === 'University' && !s.university && s.providerType !== 'University') {
          return false;
        }
        if (activeCategory === 'Foundation' && s.providerType !== 'Foundation') return false;
        if (activeCategory === 'Full Funding' && s.fundingType !== 'Full Funding') return false;
        if (activeCategory === 'Partial Funding' && s.fundingType !== 'Partial Funding') return false;
        if (
          ['Undergraduate', "Master's", 'PhD'].includes(activeCategory) &&
          !s.studyLevels.includes(activeCategory)
        ) {
          return false;
        }
        if (
          [
            'Engineering & Technology',
            'Natural Sciences',
            'Medicine & Health',
            'Business & Economics',
            'Humanities & Social Sciences',
          ].includes(activeCategory) &&
          !s.fields.includes(activeCategory)
        ) {
          return false;
        }
      }

      if (quickChip) {
        if (quickChip === 'Full Funding' && s.fundingType !== 'Full Funding') return false;
        if (
          quickChip === 'No Separate Exam' &&
          s.examRequirement.category !== 'No separate scholarship examination'
        ) {
          return false;
        }
        if (
          ['Undergraduate', "Master's", 'PhD'].includes(quickChip) &&
          !s.studyLevels.includes(quickChip)
        ) {
          return false;
        }
        if (['Japan', 'China', 'Germany'].includes(quickChip) && s.country !== quickChip) {
          return false;
        }
      }

      if (countryFilter && s.country !== countryFilter) return false;
      if (stateFilter && s.state !== stateFilter) return false;
      if (providerFilter && s.providerType !== providerFilter) return false;
      if (studyLevelFilter && !s.studyLevels.includes(studyLevelFilter)) return false;
      if (fieldFilter && !s.fields.includes(fieldFilter)) return false;
      if (fundingFilter && s.fundingType !== fundingFilter) return false;
      if (examReqFilter) {
        if (
          examReqFilter === 'No Separate Exam' &&
          s.examRequirement.category !== 'No separate scholarship examination'
        ) {
          return false;
        }
        if (
          examReqFilter === 'Exam / Test Required' &&
          s.examRequirement.category === 'No separate scholarship examination'
        ) {
          return false;
        }
        if (
          examReqFilter === 'Language Test' &&
          s.examRequirement.category !== 'Language proficiency test'
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    scholarships,
    searchQuery,
    activeCategory,
    quickChip,
    countryFilter,
    stateFilter,
    providerFilter,
    studyLevelFilter,
    fieldFilter,
    fundingFilter,
    examReqFilter,
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="font-display text-2xl font-semibold text-zinc-900">{title}</h1>
        <p className="text-sm text-zinc-600 mt-1 max-w-3xl">{subtitle}</p>
        {bannerNote && (
          <p className="text-xs text-zinc-500 mt-3 bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5">
            {bannerNote}
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scholarship name, provider, country, university, field, degree, or exam..."
            aria-label="Search scholarships"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium border border-zinc-300 bg-white text-zinc-800 rounded-lg hover:bg-zinc-50 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500 mr-1">Quick filters:</span>
        {QUICK_CHIPS.map((chip) => {
          const active = quickChip === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => setQuickChip(active ? '' : chip)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-200">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === cat
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Structured Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-white border border-zinc-200 rounded-xl p-4">
        <select
          aria-label="Filter by Country"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800"
        >
          <option value="">All Countries</option>
          {uniqueCountries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by State"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800"
        >
          <option value="">All States / Regions</option>
          {uniqueStates.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by Provider Type"
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800"
        >
          <option value="">All Provider Types</option>
          {uniqueProviders.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by Study Level"
          value={studyLevelFilter}
          onChange={(e) => setStudyLevelFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800"
        >
          <option value="">All Study Levels</option>
          <option value="Class 12">Class 12</option>
          <option value="Diploma">Diploma</option>
          <option value="Undergraduate">Undergraduate</option>
          <option value="Master's">Master&apos;s</option>
          <option value="Postgraduate">Postgraduate</option>
          <option value="PhD">PhD</option>
        </select>

        <select
          aria-label="Filter by Field"
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800"
        >
          <option value="">All Academic Fields</option>
          <option value="Engineering & Technology">Engineering &amp; Technology</option>
          <option value="Natural Sciences">Natural Sciences</option>
          <option value="Medicine & Health">Medicine &amp; Health</option>
          <option value="Business & Economics">Business &amp; Economics</option>
          <option value="Humanities & Social Sciences">Humanities &amp; Social Sciences</option>
        </select>

        <select
          aria-label="Filter by Funding Type"
          value={fundingFilter}
          onChange={(e) => setFundingFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800"
        >
          <option value="">All Funding Types</option>
          {uniqueFunding.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by Exam Requirement"
          value={examReqFilter}
          onChange={(e) => setExamReqFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800"
        >
          <option value="">All Exam Requirements</option>
          <option value="No Separate Exam">No Separate Scholarship Exam</option>
          <option value="Language Test">Language Proficiency Test</option>
          <option value="Exam / Test Required">Exam / Test Applicable</option>
        </select>

        <div className="flex items-center px-3 py-2 text-xs text-zinc-500 font-mono-tabular">
          Showing {filtered.length} of {scholarships.length} programs
        </div>
      </div>

      {/* Results Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-zinc-900">
            No verified scholarships match the active filters
          </p>
          <p className="text-xs text-zinc-500 mt-1 mb-4">
            Try clearing one or more filters or broadening your search keyword.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((s) => (
            <ScholarshipCard key={s.id} scholarship={s} />
          ))}
        </div>
      )}
    </div>
  );
}
