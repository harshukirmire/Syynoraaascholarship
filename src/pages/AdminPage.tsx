import React, { useState } from 'react';
import { CheckCircle2, Edit3, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { AppLayout } from '../components/AppLayout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import type {
  ExamInfo,
  ExamRequirementCategory,
  ExamRequirementStatus,
  Scholarship,
  VerificationStatus,
} from '../types/synora.ts';
import { sanitizeId } from '../utils/validation.ts';

const EMPTY_SCHOLARSHIP: Scholarship = {
  id: '',
  name: '',
  provider: '',
  country: '',
  state: '',
  university: '',
  scope: 'International',
  providerType: 'Government',
  studyLevels: ['Undergraduate'],
  degrees: ['Bachelor'],
  fields: ['Engineering & Technology'],
  fundingType: 'Full Funding',
  fundingDetails: '',
  duration: '',
  deadline: 'Depends on university/program',
  deadlineStatus: 'Varies by cycle',
  eligibility: {
    incomeDetails: 'Not specified',
    categories: ['All'],
    domicile: 'Not verified',
    nationalities: ['India'],
    academicRequirements: 'Not verified',
    summary: '',
  },
  examRequirement: {
    status: 'Requirement not verified',
    category: 'Conditional requirement',
    examName: 'Not verified',
    purpose: 'Not verified',
    minimumScore: 'Depends on university/program',
    examDeadline: 'Not verified',
    officialExamWebsite: '',
  },
  requiredDocuments: [],
  applicationProcedure: [],
  officialWebsite: '',
  officialPortal: '',
  officialSource: '',
  sourceUrl: '',
  verificationStatus: 'Needs Review',
  lastVerifiedDate: new Date().toISOString().slice(0, 10),
};

const EMPTY_EXAM: ExamInfo = {
  id: '',
  name: '',
  shortName: '',
  category: 'International / Language',
  countryOrRegion: '',
  purpose: '',
  whoTakesIt: '',
  relatedPrograms: [],
  officialWebsite: '',
  requirementsNote: '',
  verificationStatus: 'Needs Review',
  lastVerifiedDate: new Date().toISOString().slice(0, 10),
};

export function AdminPage() {
  const {
    scholarships,
    scholarshipsFromFirestore,
    exams,
    saveAdminScholarship,
    deleteAdminScholarship,
    saveAdminExam,
    deleteAdminExam,
    publishCatalogToFirestore,
  } = useAuth();

  const [tab, setTab] = useState<'scholarships' | 'exams'>('scholarships');
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Scholarship Form Modal
  const [schModalOpen, setSchModalOpen] = useState(false);
  const [isNewSch, setIsNewSch] = useState(true);
  const [schDraft, setSchDraft] = useState<Scholarship>(EMPTY_SCHOLARSHIP);
  const [docsText, setDocsText] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [levelsText, setLevelsText] = useState('');
  const [degreesText, setDegreesText] = useState('');
  const [fieldsText, setFieldsText] = useState('');
  const [savingSch, setSavingSch] = useState(false);

  // Exam Form Modal
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [isNewExam, setIsNewExam] = useState(true);
  const [examDraft, setExamDraft] = useState<ExamInfo>(EMPTY_EXAM);
  const [relatedText, setRelatedText] = useState('');
  const [savingExam, setSavingExam] = useState(false);

  async function handlePublishCatalog() {
    setSyncing(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      await publishCatalogToFirestore();
      setStatusMsg('Verified reference scholarships and exams published to Firestore.');
    } catch {
      setErrorMsg('Failed to publish catalog to Firestore. Verify admin permissions.');
    } finally {
      setSyncing(false);
    }
  }

  function openNewScholarship() {
    setIsNewSch(true);
    setSchDraft({
      ...EMPTY_SCHOLARSHIP,
      lastVerifiedDate: new Date().toISOString().slice(0, 10),
    });
    setDocsText('');
    setStepsText('');
    setLevelsText('Undergraduate');
    setDegreesText('Bachelor');
    setFieldsText('Engineering & Technology');
    setSchModalOpen(true);
  }

  function openEditScholarship(s: Scholarship) {
    setIsNewSch(false);
    setSchDraft(s);
    setDocsText((s.requiredDocuments || []).join('\n'));
    setStepsText((s.applicationProcedure || []).join('\n'));
    setLevelsText((s.studyLevels || []).join(', '));
    setDegreesText((s.degrees || []).join(', '));
    setFieldsText((s.fields || []).join(', '));
    setSchModalOpen(true);
  }

  async function handleSaveScholarship(e: React.FormEvent) {
    e.preventDefault();
    setSavingSch(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const id = isNewSch
        ? sanitizeId(schDraft.id || schDraft.name) || `sch_${Date.now()}`
        : schDraft.id;

      const updated: Scholarship = {
        ...schDraft,
        id,
        studyLevels: levelsText
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        degrees: degreesText
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        fields: fieldsText
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        requiredDocuments: docsText
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean),
        applicationProcedure: stepsText
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean),
      };

      await saveAdminScholarship(updated, isNewSch);
      setSchModalOpen(false);
      setStatusMsg(`Saved scholarship "${updated.name}" to Firestore.`);
    } catch {
      setErrorMsg('Unable to save scholarship. Ensure all required fields are valid.');
    } finally {
      setSavingSch(false);
    }
  }

  async function handleVerifyNow(s: Scholarship) {
    setErrorMsg('');
    setStatusMsg('');
    try {
      await saveAdminScholarship(
        {
          ...s,
          verificationStatus: 'Verified',
          lastVerifiedDate: new Date().toISOString().slice(0, 10),
        },
        false
      );
      setStatusMsg(`Marked "${s.name}" as Verified.`);
    } catch {
      setErrorMsg('Failed to update verification status.');
    }
  }

  function openNewExam() {
    setIsNewExam(true);
    setExamDraft({
      ...EMPTY_EXAM,
      lastVerifiedDate: new Date().toISOString().slice(0, 10),
    });
    setRelatedText('');
    setExamModalOpen(true);
  }

  function openEditExam(ex: ExamInfo) {
    setIsNewExam(false);
    setExamDraft(ex);
    setRelatedText((ex.relatedPrograms || []).join(', '));
    setExamModalOpen(true);
  }

  async function handleSaveExam(e: React.FormEvent) {
    e.preventDefault();
    setSavingExam(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const id = isNewExam
        ? sanitizeId(examDraft.id || examDraft.shortName || examDraft.name) || `exam_${Date.now()}`
        : examDraft.id;
      const payload: ExamInfo = {
        ...examDraft,
        id,
        relatedPrograms: relatedText
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      };
      await saveAdminExam(payload, isNewExam);
      setExamModalOpen(false);
      setStatusMsg(`Saved exam "${payload.shortName}" to Firestore.`);
    } catch {
      setErrorMsg('Unable to save exam record.');
    } finally {
      setSavingExam(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-zinc-900">
              Admin Console — Scholarship &amp; Exam Verification
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              Manage official scholarship records, exam requirements, document checklists, official URLs, and verification dates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePublishCatalog}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-zinc-300 bg-white text-zinc-900 rounded-lg hover:bg-zinc-50 whitespace-nowrap"
            >
              {syncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>
                {scholarshipsFromFirestore
                  ? 'Re-Sync Reference Catalog'
                  : 'Publish Reference Catalog to Firestore'}
              </span>
            </button>

            {tab === 'scholarships' ? (
              <button
                type="button"
                onClick={openNewScholarship}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scholarship</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openNewExam}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Exam</span>
              </button>
            )}
          </div>
        </div>

        {statusMsg && (
          <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-800">
            {statusMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800">
            {errorMsg}
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setTab('scholarships')}
            className={`px-4 py-2 text-xs font-medium rounded-lg ${
              tab === 'scholarships'
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            Scholarships ({scholarships.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('exams')}
            className={`px-4 py-2 text-xs font-medium rounded-lg ${
              tab === 'exams'
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            Exam Directory ({exams.length})
          </button>
        </div>

        {tab === 'scholarships' ? (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                    <th className="py-3 px-4 font-medium">Scholarship</th>
                    <th className="py-3 px-4 font-medium">Country</th>
                    <th className="py-3 px-4 font-medium">Exam Requirement</th>
                    <th className="py-3 px-4 font-medium">Verification</th>
                    <th className="py-3 px-4 font-medium">Last Verified</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {scholarships.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/70">
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <p className="font-medium text-zinc-900 truncate">{s.name}</p>
                        <p className="text-zinc-500 truncate">{s.provider}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-700">{s.country}</td>
                      <td className="py-3.5 px-4 max-w-[220px] truncate text-zinc-700">
                        {s.examRequirement.category}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-zinc-900">
                        {s.verificationStatus}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono-tabular text-zinc-600">
                        {s.lastVerifiedDate}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleVerifyNow(s)}
                            title="Mark Verified Today"
                            className="p-1.5 border border-zinc-200 rounded-md text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditScholarship(s)}
                            title="Edit Scholarship"
                            className="p-1.5 border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-100"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteAdminScholarship(s.id)}
                            title="Delete Scholarship"
                            className="p-1.5 border border-zinc-200 rounded-md text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                    <th className="py-3 px-4 font-medium">Exam</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Region</th>
                    <th className="py-3 px-4 font-medium">Verification</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {exams.map((ex) => (
                    <tr key={ex.id} className="hover:bg-zinc-50/70">
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-zinc-900">
                          {ex.shortName} — {ex.name}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700">{ex.category}</td>
                      <td className="py-3.5 px-4 text-zinc-700">{ex.countryOrRegion}</td>
                      <td className="py-3.5 px-4 text-zinc-900 font-medium">
                        {ex.verificationStatus} · {ex.lastVerifiedDate}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditExam(ex)}
                            className="p-1.5 border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-100"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteAdminExam(ex.id)}
                            className="p-1.5 border border-zinc-200 rounded-md text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Scholarship Modal */}
      {schModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-5">
              <h2 className="font-display text-lg font-semibold text-zinc-900">
                {isNewSch ? 'Add Verified Scholarship' : 'Edit Scholarship'}
              </h2>
              <button
                type="button"
                onClick={() => setSchModalOpen(false)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveScholarship} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Scholarship Name *</label>
                  <input
                    type="text"
                    required
                    value={schDraft.name}
                    onChange={(e) => setSchDraft({ ...schDraft, name: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Provider *</label>
                  <input
                    type="text"
                    required
                    value={schDraft.provider}
                    onChange={(e) => setSchDraft({ ...schDraft, provider: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={schDraft.country}
                    onChange={(e) => setSchDraft({ ...schDraft, country: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Scope</label>
                  <select
                    value={schDraft.scope}
                    onChange={(e) =>
                      setSchDraft({ ...schDraft, scope: e.target.value as 'India' | 'International' })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
                  >
                    <option value="International">International</option>
                    <option value="India">India</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Funding Type</label>
                  <input
                    type="text"
                    value={schDraft.fundingType}
                    onChange={(e) => setSchDraft({ ...schDraft, fundingType: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Deadline</label>
                  <input
                    type="text"
                    value={schDraft.deadline}
                    onChange={(e) => setSchDraft({ ...schDraft, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Study Levels (comma separated)</label>
                  <input
                    type="text"
                    value={levelsText}
                    onChange={(e) => setLevelsText(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Degrees (comma separated)</label>
                  <input
                    type="text"
                    value={degreesText}
                    onChange={(e) => setDegreesText(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-zinc-700 mb-1">Fields (comma separated)</label>
                  <input
                    type="text"
                    value={fieldsText}
                    onChange={(e) => setFieldsText(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Exam Requirement Section */}
              <div className="border-t border-zinc-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Exam Requirement Status</label>
                  <select
                    value={schDraft.examRequirement.status}
                    onChange={(e) =>
                      setSchDraft({
                        ...schDraft,
                        examRequirement: {
                          ...schDraft.examRequirement,
                          status: e.target.value as ExamRequirementStatus,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
                  >
                    <option value="Scholarship-specific examination required">
                      Scholarship-specific examination required
                    </option>
                    <option value="University admission examination">
                      University admission examination
                    </option>
                    <option value="Language proficiency test">Language proficiency test</option>
                    <option value="Aptitude or selection test">Aptitude or selection test</option>
                    <option value="No separate scholarship examination required">
                      No separate scholarship examination required
                    </option>
                    <option value="Depends on university/program">Depends on university/program</option>
                    <option value="Requirement not verified">Requirement not verified</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Exam Classification</label>
                  <select
                    value={schDraft.examRequirement.category}
                    onChange={(e) =>
                      setSchDraft({
                        ...schDraft,
                        examRequirement: {
                          ...schDraft.examRequirement,
                          category: e.target.value as ExamRequirementCategory,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
                  >
                    <option value="Scholarship-specific examination">
                      Scholarship-specific examination
                    </option>
                    <option value="University admission examination">
                      University admission examination
                    </option>
                    <option value="Language proficiency test">Language proficiency test</option>
                    <option value="Course-specific examination">Course-specific examination</option>
                    <option value="Aptitude or selection test">Aptitude or selection test</option>
                    <option value="No separate scholarship examination">
                      No separate scholarship examination
                    </option>
                    <option value="Conditional requirement">Conditional requirement</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Exam Name</label>
                  <input
                    type="text"
                    value={schDraft.examRequirement.examName}
                    onChange={(e) =>
                      setSchDraft({
                        ...schDraft,
                        examRequirement: { ...schDraft.examRequirement, examName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Minimum Score</label>
                  <input
                    type="text"
                    value={schDraft.examRequirement.minimumScore}
                    onChange={(e) =>
                      setSchDraft({
                        ...schDraft,
                        examRequirement: {
                          ...schDraft.examRequirement,
                          minimumScore: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Official URLs & Verification */}
              <div className="border-t border-zinc-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Official Website URL *</label>
                  <input
                    type="url"
                    required
                    value={schDraft.officialWebsite}
                    onChange={(e) => setSchDraft({ ...schDraft, officialWebsite: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Official Portal URL *</label>
                  <input
                    type="url"
                    required
                    value={schDraft.officialPortal}
                    onChange={(e) => setSchDraft({ ...schDraft, officialPortal: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Official Source Name *</label>
                  <input
                    type="text"
                    required
                    value={schDraft.officialSource}
                    onChange={(e) => setSchDraft({ ...schDraft, officialSource: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">Verification Status</label>
                    <select
                      value={schDraft.verificationStatus}
                      onChange={(e) =>
                        setSchDraft({
                          ...schDraft,
                          verificationStatus: e.target.value as VerificationStatus,
                        })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
                    >
                      <option value="Verified">Verified</option>
                      <option value="Needs Review">Needs Review</option>
                      <option value="Requirement Not Verified">Requirement Not Verified</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">Last Verified Date</label>
                    <input
                      type="date"
                      value={schDraft.lastVerifiedDate}
                      onChange={(e) =>
                        setSchDraft({ ...schDraft, lastVerifiedDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Required Documents (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={docsText}
                    onChange={(e) => setDocsText(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Application Procedure (one step per line)
                  </label>
                  <textarea
                    rows={4}
                    value={stepsText}
                    onChange={(e) => setStepsText(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setSchModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium border border-zinc-300 rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSch}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-60"
                >
                  {savingSch && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Scholarship</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Exam Modal */}
      {examModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-5">
              <h2 className="font-display text-lg font-semibold text-zinc-900">
                {isNewExam ? 'Add Exam Entry' : 'Edit Exam Entry'}
              </h2>
              <button
                type="button"
                onClick={() => setExamModalOpen(false)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Short Name *</label>
                  <input
                    type="text"
                    required
                    value={examDraft.shortName}
                    onChange={(e) => setExamDraft({ ...examDraft, shortName: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={examDraft.category}
                    onChange={(e) => setExamDraft({ ...examDraft, category: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Full Exam Name *</label>
                <input
                  type="text"
                  required
                  value={examDraft.name}
                  onChange={(e) => setExamDraft({ ...examDraft, name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Country / Region</label>
                <input
                  type="text"
                  value={examDraft.countryOrRegion}
                  onChange={(e) => setExamDraft({ ...examDraft, countryOrRegion: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Purpose</label>
                <textarea
                  rows={2}
                  value={examDraft.purpose}
                  onChange={(e) => setExamDraft({ ...examDraft, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Who Generally Takes It</label>
                <input
                  type="text"
                  value={examDraft.whoTakesIt}
                  onChange={(e) => setExamDraft({ ...examDraft, whoTakesIt: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Related Programs (comma separated)</label>
                <input
                  type="text"
                  value={relatedText}
                  onChange={(e) => setRelatedText(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Official Exam Website *</label>
                <input
                  type="url"
                  required
                  value={examDraft.officialWebsite}
                  onChange={(e) => setExamDraft({ ...examDraft, officialWebsite: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Requirements Note</label>
                <textarea
                  rows={2}
                  value={examDraft.requirementsNote}
                  onChange={(e) => setExamDraft({ ...examDraft, requirementsNote: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setExamModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium border border-zinc-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExam}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg disabled:opacity-60"
                >
                  {savingExam && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Exam</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
