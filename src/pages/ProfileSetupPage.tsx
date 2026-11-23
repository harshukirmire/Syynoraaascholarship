import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import {
  SCHOLARSHIP_SEARCH_CATEGORIES,
  type EducationLevel,
  type EligibilityInfo,
  type EducationInfo,
  type PersonalInfo,
} from '../types/synora.ts';

const EDUCATION_LEVELS: EducationLevel[] = [
  'Class 10',
  'Class 12',
  'Diploma',
  'Undergraduate',
  'Postgraduate',
  'PhD',
  'Other',
];

export function ProfileSetupPage() {
  const { user, profile, saveProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [personal, setPersonal] = useState<PersonalInfo>({
    fullName: '',
    dob: '',
    gender: '',
    nationality: '',
    country: '',
    state: '',
    city: '',
  });

  const [searchPreferences, setSearchPreferences] = useState<string[]>([]);

  const [eligibility, setEligibility] = useState<EligibilityInfo>({
    annualFamilyIncome: '',
    incomeCategory: '',
    category: '',
    domicile: '',
    disabilityStatus: 'No',
    additionalNotes: '',
  });

  const [education, setEducation] = useState<EducationInfo>({
    level: '',
    classOrYear: '',
    degree: '',
    course: '',
    branch: '',
    institution: '',
    currentYearOfStudy: '',
    passingYear: '',
    percentage: '',
    cgpa: '',
  });

  useEffect(() => {
    if (profile) {
      setPersonal({
        fullName: profile.personal?.fullName || user?.displayName || '',
        dob: profile.personal?.dob || '',
        gender: profile.personal?.gender || '',
        nationality: profile.personal?.nationality || '',
        country: profile.personal?.country || '',
        state: profile.personal?.state || '',
        city: profile.personal?.city || '',
      });
      setSearchPreferences(profile.searchPreferences || []);
      setEligibility({
        annualFamilyIncome: profile.eligibility?.annualFamilyIncome || '',
        incomeCategory: profile.eligibility?.incomeCategory || '',
        category: profile.eligibility?.category || '',
        domicile: profile.eligibility?.domicile || '',
        disabilityStatus: profile.eligibility?.disabilityStatus || 'No',
        additionalNotes: profile.eligibility?.additionalNotes || '',
      });
      setEducation({
        level: profile.education?.level || '',
        classOrYear: profile.education?.classOrYear || '',
        degree: profile.education?.degree || '',
        course: profile.education?.course || '',
        branch: profile.education?.branch || '',
        institution: profile.education?.institution || '',
        currentYearOfStudy: profile.education?.currentYearOfStudy || '',
        passingYear: profile.education?.passingYear || '',
        percentage: profile.education?.percentage || '',
        cgpa: profile.education?.cgpa || '',
      });
    } else if (user?.displayName) {
      setPersonal((prev) => ({ ...prev, fullName: user.displayName || '' }));
    }
  }, [profile, user]);

  function toggleSearchPreference(category: string) {
    setSearchPreferences((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  }

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (step === 1) {
      if (!personal.fullName.trim() || !personal.country.trim()) {
        setErrorMsg('Please enter your full name and country.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    setSaving(true);
    try {
      await saveProfile({
        personal,
        eligibility,
        education,
        searchPreferences,
        profileCompleted: true,
      });
      navigate('/dashboard', { replace: true });
    } catch {
      setErrorMsg('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between">
        <span className="font-display text-lg font-bold tracking-tight text-zinc-900">
          SYNORA
        </span>
        <div className="flex items-center gap-4 text-xs">
          <Link
            to="/explorer"
            className="text-zinc-700 hover:text-zinc-900 font-medium underline underline-offset-4"
          >
            Browse Explorer
          </Link>
          <span className="text-zinc-500 hidden sm:inline">{user?.email}</span>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="text-zinc-700 hover:text-zinc-900 font-medium"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-xl p-8">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-semibold text-zinc-900">
              Set up your Synora profile
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              Discover scholarships by education stage, target categories, and entrance exams. College details and CGPA are completely optional.
            </p>

            {/* Step Progress Indicator */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { num: 1, title: 'Basic Info' },
                { num: 2, title: 'Search Preferences' },
                { num: 3, title: 'Optional Academic' },
              ].map((item) => {
                const active = step === item.num;
                const done = step > item.num;
                return (
                  <div
                    key={item.num}
                    className={`px-3.5 py-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                      active
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : done
                        ? 'border-zinc-300 bg-zinc-50 text-zinc-900'
                        : 'border-zinc-200 bg-white text-zinc-500'
                    }`}
                  >
                    <span className="font-mono-tabular font-semibold">
                      {done ? <Check className="w-3.5 h-3.5" /> : `0${item.num}`}
                    </span>
                    <span className="font-medium truncate">{item.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800"
            >
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="setup-fullName" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Full name *
                  </label>
                  <input
                    id="setup-fullName"
                    type="text"
                    required
                    value={personal.fullName}
                    onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                    placeholder="Enter your legal full name"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-country" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Country *
                  </label>
                  <input
                    id="setup-country"
                    type="text"
                    required
                    value={personal.country}
                    onChange={(e) => setPersonal({ ...personal, country: e.target.value })}
                    placeholder="e.g., India"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-state" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    State / Province
                  </label>
                  <input
                    id="setup-state"
                    type="text"
                    value={personal.state}
                    onChange={(e) => setPersonal({ ...personal, state: e.target.value })}
                    placeholder="e.g., Maharashtra"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-level" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Current education level (optional)
                  </label>
                  <select
                    id="setup-level"
                    value={education.level}
                    onChange={(e) =>
                      setEducation({ ...education, level: e.target.value as EducationLevel | '' })
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="">Not specified / Preparing for exams</option>
                    {EDUCATION_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="setup-nationality" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Nationality (optional)
                  </label>
                  <input
                    id="setup-nationality"
                    type="text"
                    value={personal.nationality}
                    onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })}
                    placeholder="e.g., Indian"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-dob" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Date of birth (optional)
                  </label>
                  <input
                    id="setup-dob"
                    type="date"
                    value={personal.dob}
                    onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-gender" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Gender (optional, for scheme eligibility)
                  </label>
                  <select
                    id="setup-gender"
                    value={personal.gender}
                    onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="">Prefer not to specify</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary / Other">Non-binary / Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3">
                <Link
                  to="/explorer"
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline underline-offset-4"
                >
                  Skip &amp; browse Explorer
                </Link>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Continue to Search Preferences
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div>
                <h2 className="font-display text-base font-semibold text-zinc-900">
                  Scholarship Search Preferences
                </h2>
                <p className="text-xs text-zinc-600 mt-1">
                  Select one or more scholarship categories you want to explore. You can update these anytime and also add entrance exams in your profile.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SCHOLARSHIP_SEARCH_CATEGORIES.map((category) => {
                  const selected = searchPreferences.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleSearchPreference(category)}
                      aria-pressed={selected}
                      className={`px-3.5 py-2.5 rounded-lg border text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors ${
                        selected
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <span>{category}</span>
                      {selected && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-sm font-medium border border-zinc-300 text-zinc-800 rounded-lg hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
                >
                  Continue to Optional Details
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleComplete} className="space-y-4">
              <p className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                All academic and financial fields below are <strong>optional</strong>. If you are in Class 10/12, preparing for exams, or not yet enrolled in college, leave college/CGPA blank and finish setup directly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="setup-degree" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Degree or course (optional)
                  </label>
                  <input
                    id="setup-degree"
                    type="text"
                    value={education.degree}
                    onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                    placeholder="e.g., B.Tech / B.Sc / Diploma"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-institution" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    College or institution (optional)
                  </label>
                  <input
                    id="setup-institution"
                    type="text"
                    value={education.institution}
                    onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                    placeholder="School, college, or university (if enrolled)"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-branch" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Branch or specialization (optional)
                  </label>
                  <input
                    id="setup-branch"
                    type="text"
                    value={education.branch}
                    onChange={(e) => setEducation({ ...education, branch: e.target.value })}
                    placeholder="e.g., Computer Science / Science"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-classOrYear" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Current year or semester (optional)
                  </label>
                  <input
                    id="setup-classOrYear"
                    type="text"
                    value={education.classOrYear}
                    onChange={(e) => setEducation({ ...education, classOrYear: e.target.value })}
                    placeholder="e.g., Semester 3 / Class 12"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-percentage" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Percentage (%) (optional)
                  </label>
                  <input
                    id="setup-percentage"
                    type="text"
                    value={education.percentage}
                    onChange={(e) => setEducation({ ...education, percentage: e.target.value })}
                    placeholder="e.g., 87.5"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-cgpa" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    CGPA (optional)
                  </label>
                  <input
                    id="setup-cgpa"
                    type="text"
                    value={education.cgpa}
                    onChange={(e) => setEducation({ ...education, cgpa: e.target.value })}
                    placeholder="e.g., 8.8 / 10"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-income" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Family income (optional, numeric INR)
                  </label>
                  <input
                    id="setup-income"
                    type="text"
                    value={eligibility.annualFamilyIncome}
                    onChange={(e) =>
                      setEligibility({ ...eligibility, annualFamilyIncome: e.target.value })
                    }
                    placeholder="e.g., 350000"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label htmlFor="setup-category" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Category (optional)
                  </label>
                  <select
                    id="setup-category"
                    value={eligibility.category}
                    onChange={(e) => setEligibility({ ...eligibility, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="">Not specified</option>
                    <option value="General">General</option>
                    <option value="EWS">EWS</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="VJNT / SBC">VJNT / SBC</option>
                    <option value="Minority">Minority</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-sm font-medium border border-zinc-300 text-zinc-800 rounded-lg hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>Save &amp; Continue to Dashboard</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
