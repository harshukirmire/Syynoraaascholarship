import React, { useEffect, useState } from 'react';
import { Check, CopyPlus, Edit3, Loader2, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '../components/AppLayout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { EXAM_TEMPLATES } from '../data/verifiedCatalog.ts';
import {
  SCHOLARSHIP_SEARCH_CATEGORIES,
  type EducationInfo,
  type EducationLevel,
  type EligibilityInfo,
  type ExamCategory,
  type ExamResult,
  type PersonalInfo,
} from '../types/synora.ts';
import { calculateProfileCompletion } from '../utils/validation.ts';

const EDUCATION_LEVELS: EducationLevel[] = [
  'Class 10',
  'Class 12',
  'Diploma',
  'Undergraduate',
  'Postgraduate',
  'PhD',
  'Other',
];

export function ProfilePage() {
  const {
    user,
    profile,
    examResults,
    saveProfile,
    addExamResult,
    updateExamResult,
    deleteExamResult,
  } = useAuth();

  const [personal, setPersonal] = useState<PersonalInfo>({
    fullName: '',
    dob: '',
    gender: '',
    nationality: '',
    country: '',
    state: '',
    city: '',
  });
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
  const [searchPreferences, setSearchPreferences] = useState<string[]>([]);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // Dynamic Examination Form State
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('JEE Main');
  const [customExamName, setCustomExamName] = useState('');
  const [examCategory, setExamCategory] = useState<ExamCategory>('National');
  const [attemptLabel, setAttemptLabel] = useState('Attempt 1');
  const [examYear, setExamYear] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examFields, setExamFields] = useState<Record<string, string>>({});
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldVal, setCustomFieldVal] = useState('');
  const [savingExam, setSavingExam] = useState(false);
  const [examError, setExamError] = useState('');
  const [examDeleteError, setExamDeleteError] = useState('');

  useEffect(() => {
    if (profile) {
      setPersonal(profile.personal);
      setEligibility(profile.eligibility);
      setEducation(profile.education);
      setSearchPreferences(profile.searchPreferences || []);
    }
  }, [profile]);

  const { percentage } = calculateProfileCompletion(profile);

  function toggleSearchPreference(category: string) {
    setSearchPreferences((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');
    setProfileError('');
    try {
      await saveProfile({
        personal,
        eligibility,
        education,
        searchPreferences,
        profileCompleted: true,
      });
      setProfileMessage('Profile and search preferences saved to your account.');
    } catch {
      setProfileError('Unable to save profile changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  function openNewExamModal(presetExamName?: string, nextAttemptNumber = 1) {
    setEditingExamId(null);
    setExamError('');
    const template = EXAM_TEMPLATES.find((t) => t.name === presetExamName);
    if (template) {
      setSelectedTemplateName(template.name);
      setExamCategory(template.category);
      setCustomExamName('');
    } else if (presetExamName) {
      setSelectedTemplateName('Custom');
      setCustomExamName(presetExamName);
      setExamCategory('Custom');
    } else {
      setSelectedTemplateName(EXAM_TEMPLATES[0].name);
      setExamCategory(EXAM_TEMPLATES[0].category);
      setCustomExamName('');
    }
    setAttemptLabel(`Attempt ${nextAttemptNumber}`);
    setExamYear('');
    setExamDate('');
    setExamFields({});
    setCustomFieldKey('');
    setCustomFieldVal('');
    setExamModalOpen(true);
  }

  function openEditExamModal(record: ExamResult) {
    setEditingExamId(record.id);
    setExamError('');
    const template = EXAM_TEMPLATES.find((t) => t.name === record.examName);
    if (template) {
      setSelectedTemplateName(template.name);
      setCustomExamName('');
    } else {
      setSelectedTemplateName('Custom');
      setCustomExamName(record.examName);
    }
    setExamCategory(record.examCategory);
    setAttemptLabel(record.attemptLabel);
    setExamYear(record.year || '');
    setExamDate(record.testDate || '');
    setExamFields(record.fields || {});
    setExamModalOpen(true);
  }

  function handleTemplateChange(name: string) {
    setSelectedTemplateName(name);
    if (name === 'Custom') {
      setExamCategory('Custom');
      setExamFields({});
      return;
    }
    const tpl = EXAM_TEMPLATES.find((t) => t.name === name);
    if (tpl) {
      setExamCategory(tpl.category);
      setExamFields({});
    }
  }

  function addCustomExamField() {
    const k = customFieldKey.trim();
    const v = customFieldVal.trim();
    if (!k || !v) return;
    setExamFields((prev) => ({ ...prev, [k]: v }));
    setCustomFieldKey('');
    setCustomFieldVal('');
  }

  async function handleSaveExam(e: React.FormEvent) {
    e.preventDefault();
    setExamError('');
    const finalName =
      selectedTemplateName === 'Custom' ? customExamName.trim() : selectedTemplateName;

    if (!finalName) {
      setExamError('Please provide an examination name.');
      return;
    }

    setSavingExam(true);
    try {
      const payload = {
        examName: finalName,
        examCategory,
        attemptLabel: attemptLabel.trim() || 'Attempt 1',
        year: examYear.trim(),
        testDate: examDate.trim(),
        fields: examFields,
      };
      if (editingExamId) {
        await updateExamResult(editingExamId, payload);
      } else {
        await addExamResult(payload);
      }
      setExamModalOpen(false);
    } catch {
      setExamError('Unable to save examination record. Please try again.');
    } finally {
      setSavingExam(false);
    }
  }

  async function handleDeleteExam(id: string) {
    setExamDeleteError('');
    try {
      await deleteExamResult(id);
    } catch {
      setExamDeleteError('Unable to remove examination record. Please try again.');
    }
  }

  const activeTemplate = EXAM_TEMPLATES.find((t) => t.name === selectedTemplateName);

  // Group attempts by exam name for clear history view
  const attemptsByExam = examResults.reduce<Record<string, ExamResult[]>>((acc, item) => {
    if (!acc[item.examName]) acc[item.examName] = [];
    acc[item.examName].push(item);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-zinc-900">
              Student Profile &amp; Examinations
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              Account UID: <span className="font-mono-tabular text-xs text-zinc-500">{user?.uid}</span> · Email: {user?.email}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-zinc-500">Profile Completion</p>
            <p className="font-mono-tabular text-2xl font-semibold text-zinc-900">{percentage}%</p>
          </div>
        </div>

        {/* Dynamic Examination Profile Section */}
        <section aria-labelledby="exams-heading" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 id="exams-heading" className="font-display text-xl font-semibold text-zinc-900">
                Dynamic Examination Profile
              </h2>
              <p className="text-sm text-zinc-600 mt-0.5">
                Record national, state, board, international/language, or custom examinations. Add multiple attempts without overwriting previous records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openNewExamModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Examination</span>
            </button>
          </div>

          {examDeleteError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800"
            >
              {examDeleteError}
            </div>
          )}

          {examResults.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
              <p className="text-sm font-medium text-zinc-900">No examination records added yet</p>
              <p className="text-xs text-zinc-500 mt-1 mb-5">
                Add JEE Main, JEE Advanced, MHT-CET, NEET, CUET, GATE, CAT, IELTS, TOEFL, SAT, or any other exam to unlock exam-based matching.
              </p>
              <button
                type="button"
                onClick={() => openNewExamModal()}
                className="px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
              >
                Add First Examination
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(attemptsByExam).map(([examName, attempts]) => (
                <div key={examName} className="bg-white border border-zinc-200 rounded-xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                    <div>
                      <h3 className="font-display text-base font-semibold text-zinc-900">
                        {examName}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {attempts[0].examCategory} · {attempts.length}{' '}
                        {attempts.length === 1 ? 'attempt' : 'attempts'} recorded
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openNewExamModal(examName, attempts.length + 1)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-zinc-300 text-zinc-800 rounded-lg hover:bg-zinc-50 whitespace-nowrap shrink-0"
                    >
                      <CopyPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Another Attempt</span>
                    </button>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {attempts.map((record) => (
                      <div
                        key={record.id}
                        className="py-4 first:pt-4 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-zinc-900">
                              {record.attemptLabel}
                            </span>
                            {record.year && (
                              <>
                                <span className="text-zinc-300" aria-hidden="true">·</span>
                                <span className="font-mono-tabular text-zinc-600">
                                  Year: {record.year}
                                </span>
                              </>
                            )}
                            {record.testDate && (
                              <>
                                <span className="text-zinc-300" aria-hidden="true">·</span>
                                <span className="font-mono-tabular text-zinc-600">
                                  Date: {record.testDate}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-700">
                            {Object.entries(record.fields || {}).map(([k, v]) =>
                              v ? (
                                <span key={k}>
                                  <span className="text-zinc-400 capitalize">{k}: </span>
                                  <span className="font-mono-tabular font-medium text-zinc-900">
                                    {v}
                                  </span>
                                </span>
                              ) : null
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditExamModal(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteExam(record.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-zinc-200 text-red-700 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Personal, Eligibility & Education Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-8">
          {profileMessage && (
            <div
              role="status"
              className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-800"
            >
              {profileMessage}
            </div>
          )}
          {profileError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800"
            >
              {profileError}
            </div>
          )}

          {/* Scholarship Search Preferences */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-zinc-900">
                Scholarship Search Preferences
              </h2>
              <p className="text-xs text-zinc-600 mt-1">
                Select one or more scholarship categories to guide Find For Me recommendations.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
          </div>

          {/* Basic Information */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="prof-fullName" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Full name
                </label>
                <input
                  id="prof-fullName"
                  type="text"
                  value={personal.fullName}
                  onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-country" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Country
                </label>
                <input
                  id="prof-country"
                  type="text"
                  value={personal.country}
                  onChange={(e) => setPersonal({ ...personal, country: e.target.value })}
                  placeholder="e.g., India"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-state" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  State
                </label>
                <input
                  id="prof-state"
                  type="text"
                  value={personal.state}
                  onChange={(e) => setPersonal({ ...personal, state: e.target.value })}
                  placeholder="e.g., Maharashtra"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-level" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Current education level (optional)
                </label>
                <select
                  id="prof-level"
                  value={education.level}
                  onChange={(e) =>
                    setEducation({ ...education, level: e.target.value as EducationLevel | '' })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
                <label htmlFor="prof-nationality" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Nationality (optional)
                </label>
                <input
                  id="prof-nationality"
                  type="text"
                  value={personal.nationality}
                  onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-city" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  City (optional)
                </label>
                <input
                  id="prof-city"
                  type="text"
                  value={personal.city}
                  onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-dob" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Date of birth (optional)
                </label>
                <input
                  id="prof-dob"
                  type="date"
                  value={personal.dob}
                  onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-gender" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Gender (optional)
                </label>
                <select
                  id="prof-gender"
                  value={personal.gender}
                  onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Prefer not to specify</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary / Other">Non-binary / Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Optional Academic & Eligibility Information */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-zinc-900">
                Optional Academic &amp; Eligibility Information
              </h2>
              <p className="text-xs text-zinc-600 mt-1">
                All fields below are optional. Leave degree, college, branch, or CGPA blank if you are not currently enrolled in a college or university.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="prof-degree" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Degree or course (optional)
                </label>
                <input
                  id="prof-degree"
                  type="text"
                  value={education.degree}
                  onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                  placeholder="e.g., B.Tech / Diploma / Class 12"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-institution" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  College or institution (optional)
                </label>
                <input
                  id="prof-institution"
                  type="text"
                  value={education.institution}
                  onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                  placeholder="If currently enrolled"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-branch" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Branch or specialization (optional)
                </label>
                <input
                  id="prof-branch"
                  type="text"
                  value={education.branch}
                  onChange={(e) => setEducation({ ...education, branch: e.target.value })}
                  placeholder="e.g., Computer Science / Science"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-classYear" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Current year or semester (optional)
                </label>
                <input
                  id="prof-classYear"
                  type="text"
                  value={education.classOrYear}
                  onChange={(e) => setEducation({ ...education, classOrYear: e.target.value })}
                  placeholder="e.g., Semester 3 / Class 12"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-percentage" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Percentage (%) (optional)
                </label>
                <input
                  id="prof-percentage"
                  type="text"
                  value={education.percentage}
                  onChange={(e) => setEducation({ ...education, percentage: e.target.value })}
                  placeholder="e.g., 87.5"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-cgpa" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  CGPA (optional)
                </label>
                <input
                  id="prof-cgpa"
                  type="text"
                  value={education.cgpa}
                  onChange={(e) => setEducation({ ...education, cgpa: e.target.value })}
                  placeholder="e.g., 8.8"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-income" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Family income (optional)
                </label>
                <input
                  id="prof-income"
                  type="text"
                  value={eligibility.annualFamilyIncome}
                  onChange={(e) =>
                    setEligibility({ ...eligibility, annualFamilyIncome: e.target.value })
                  }
                  placeholder="Numeric INR (e.g. 350000)"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-category" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Category (optional)
                </label>
                <select
                  id="prof-category"
                  value={eligibility.category}
                  onChange={(e) => setEligibility({ ...eligibility, category: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
              <div>
                <label htmlFor="prof-domicile" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Domicile state / region (optional)
                </label>
                <input
                  id="prof-domicile"
                  type="text"
                  value={eligibility.domicile}
                  onChange={(e) => setEligibility({ ...eligibility, domicile: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label htmlFor="prof-incomeCat" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Income bracket (optional)
                </label>
                <select
                  id="prof-incomeCat"
                  value={eligibility.incomeCategory}
                  onChange={(e) =>
                    setEligibility({ ...eligibility, incomeCategory: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Select if applicable</option>
                  <option value="Below INR 2.5 Lakh">Below INR 2.5 Lakh</option>
                  <option value="INR 2.5 - 4.5 Lakh">INR 2.5 - 4.5 Lakh</option>
                  <option value="INR 4.5 - 8.0 Lakh">INR 4.5 - 8.0 Lakh</option>
                  <option value="Above INR 8.0 Lakh">Above INR 8.0 Lakh</option>
                </select>
              </div>
              <div>
                <label htmlFor="prof-disability" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Disability status (optional)
                </label>
                <select
                  id="prof-disability"
                  value={eligibility.disabilityStatus}
                  onChange={(e) =>
                    setEligibility({ ...eligibility, disabilityStatus: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="No">No</option>
                  <option value="Yes (PwD)">Yes (PwD)</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label htmlFor="prof-notes" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Other eligibility notes (optional)
                </label>
                <input
                  id="prof-notes"
                  type="text"
                  value={eligibility.additionalNotes}
                  onChange={(e) =>
                    setEligibility({ ...eligibility, additionalNotes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-60"
            >
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Add / Edit Examination Modal */}
      {examModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exam-modal-title"
        >
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-5">
              <h3 id="exam-modal-title" className="font-display text-lg font-semibold text-zinc-900">
                {editingExamId ? 'Edit Examination Record' : 'Add Examination Record'}
              </h3>
              <button
                type="button"
                onClick={() => setExamModalOpen(false)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Close
              </button>
            </div>

            {examError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {examError}
              </div>
            )}

            <form onSubmit={handleSaveExam} className="space-y-4">
              <div>
                <label htmlFor="exam-select" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Examination
                </label>
                <select
                  id="exam-select"
                  value={selectedTemplateName}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {['National', 'State', 'Board', 'International / Language'].map((cat) => (
                    <optgroup key={cat} label={cat}>
                      {EXAM_TEMPLATES.filter((t) => t.category === cat).map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="Custom">Other / Custom exam</option>
                </select>
              </div>

              {selectedTemplateName === 'Custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="custom-exam-name" className="block text-xs font-medium text-zinc-700 mb-1.5">
                      Exam name *
                    </label>
                    <input
                      id="custom-exam-name"
                      type="text"
                      required
                      value={customExamName}
                      onChange={(e) => setCustomExamName(e.target.value)}
                      placeholder="e.g., BITSAT / TestAS / Olympiad"
                      className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-exam-cat" className="block text-xs font-medium text-zinc-700 mb-1.5">
                      Category
                    </label>
                    <select
                      id="custom-exam-cat"
                      value={examCategory}
                      onChange={(e) => setExamCategory(e.target.value as ExamCategory)}
                      className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
                    >
                      <option value="Custom">Other / Custom</option>
                      <option value="National">National</option>
                      <option value="State">State</option>
                      <option value="Board">Board</option>
                      <option value="International / Language">International / Language</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="exam-attempt" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Attempt number / label
                  </label>
                  <input
                    id="exam-attempt"
                    type="text"
                    value={attemptLabel}
                    onChange={(e) => setAttemptLabel(e.target.value)}
                    placeholder="Attempt 1"
                    className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="exam-year" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Year
                  </label>
                  <input
                    id="exam-year"
                    type="text"
                    value={examYear}
                    onChange={(e) => setExamYear(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="exam-date" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Test date (optional)
                  </label>
                  <input
                    id="exam-date"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Relevant Fields for Selected Exam */}
              {activeTemplate ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                  {activeTemplate.fields.map((field) => (
                    <div key={field.key}>
                      <label
                        htmlFor={`field-${field.key}`}
                        className="block text-xs font-medium text-zinc-700 mb-1.5"
                      >
                        {field.label}
                      </label>
                      {field.type === 'select' && field.options ? (
                        <select
                          id={`field-${field.key}`}
                          value={examFields[field.key] || field.options[0]}
                          onChange={(e) =>
                            setExamFields({ ...examFields, [field.key]: e.target.value })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
                        >
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`field-${field.key}`}
                          type="text"
                          value={examFields[field.key] || ''}
                          onChange={(e) =>
                            setExamFields({ ...examFields, [field.key]: e.target.value })
                          }
                          placeholder={field.placeholder}
                          className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 border-t border-zinc-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="custom-score" className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Score or percentile
                      </label>
                      <input
                        id="custom-score"
                        type="text"
                        value={examFields.scoreOrPercentile || ''}
                        onChange={(e) =>
                          setExamFields({ ...examFields, scoreOrPercentile: e.target.value })
                        }
                        placeholder="e.g., 94.5 percentile or 290/390"
                        className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label htmlFor="custom-rank" className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Rank (if applicable)
                      </label>
                      <input
                        id="custom-rank"
                        type="text"
                        value={examFields.rank || ''}
                        onChange={(e) =>
                          setExamFields({ ...examFields, rank: e.target.value })
                        }
                        placeholder="e.g., 4250 (optional)"
                        className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-zinc-700">Additional Custom Fields (optional)</p>
                  {Object.entries(examFields)
                    .filter(([k]) => k !== 'scoreOrPercentile' && k !== 'rank')
                    .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-xs bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200">
                      <span>
                        <strong>{k}:</strong> {v}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...examFields };
                          delete next[k];
                          setExamFields(next);
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="grid grid-cols-5 gap-2">
                    <input
                      type="text"
                      value={customFieldKey}
                      onChange={(e) => setCustomFieldKey(e.target.value)}
                      placeholder="Field (e.g., Section)"
                      className="col-span-2 px-3 py-2 text-xs border border-zinc-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={customFieldVal}
                      onChange={(e) => setCustomFieldVal(e.target.value)}
                      placeholder="Value"
                      className="col-span-2 px-3 py-2 text-xs border border-zinc-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={addCustomExamField}
                      className="px-2 py-2 text-xs font-medium border border-zinc-300 rounded-lg hover:bg-zinc-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setExamModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium border border-zinc-300 text-zinc-800 rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExam}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-60"
                >
                  {savingExam && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>{editingExamId ? 'Update Record' : 'Save Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
