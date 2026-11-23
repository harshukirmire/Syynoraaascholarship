import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import { AppLayout } from '../components/AppLayout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const STARTER_PROMPTS = [
  'What documents are required?',
  'What exam is required?',
  'Does this scholarship require IELTS?',
  'What is the application procedure?',
  'What are my upcoming deadlines?',
  'Which applications are still in progress?',
];

export function GuidePage() {
  const { user, profile, examResults, savedScholarships, applications, scholarships } = useAuth();
  const [searchParams] = useSearchParams();
  const initialScholarshipId = searchParams.get('scholarshipId') || '';

  const [selectedScholarshipId, setSelectedScholarshipId] = useState(initialScholarshipId);
  const [includePersonalContext, setIncludePersonalContext] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedScholarship = useMemo(
    () => scholarships.find((s) => s.id === selectedScholarshipId) || null,
    [scholarships, selectedScholarshipId]
  );

  async function sendQuestion(questionText: string) {
    const clean = questionText.trim();
    if (!clean || loading || !user) return;

    setErrorMsg('');
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: clean }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const idToken = await user.getIdToken();

      const scholarshipContext = selectedScholarship
        ? selectedScholarship
        : scholarships.map((s) => ({
            id: s.id,
            name: s.name,
            provider: s.provider,
            country: s.country,
            studyLevels: s.studyLevels,
            fundingType: s.fundingType,
            deadline: s.deadline,
            examRequirement: s.examRequirement,
            requiredDocuments: s.requiredDocuments,
            applicationProcedure: s.applicationProcedure,
            officialWebsite: s.officialWebsite,
            officialPortal: s.officialPortal,
            verificationStatus: s.verificationStatus,
            lastVerifiedDate: s.lastVerifiedDate,
          }));

      const studentContext = includePersonalContext
        ? {
            educationLevel: profile?.education?.level,
            country: profile?.personal?.country,
            state: profile?.personal?.state,
            examsRecorded: examResults.map((e) => ({
              examName: e.examName,
              attemptLabel: e.attemptLabel,
              year: e.year,
              fields: e.fields,
            })),
            savedScholarships: savedScholarships.map((s) => ({
              name: s.scholarshipName,
              deadline: s.deadline,
            })),
            applications: applications.map((a) => ({
              name: a.scholarshipName,
              status: a.status,
              deadline: a.deadline,
            })),
          }
        : undefined;

      const response = await fetch('/api/guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: clean,
          history: messages,
          scholarshipContext,
          studentContext,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        setErrorMsg(data.error || 'Unable to get a response from Synora Guide AI.');
        return;
      }

      setMessages([...nextMessages, { role: 'model', text: data.reply }]);
    } catch {
      setErrorMsg('Network error reaching Synora Guide AI. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendQuestion(input);
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div className="border-b border-zinc-200 pb-6">
          <h1 className="font-display text-2xl font-semibold text-zinc-900">
            Synora Guide AI
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Ask verified questions about scholarship documents, exam classifications, application procedures, and your own deadlines. Unverified details are never fabricated.
          </p>
        </div>

        {/* Context Selector Bar */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="guide-scholarship" className="block text-xs font-medium text-zinc-700 mb-1">
              Scholarship Context
            </label>
            <select
              id="guide-scholarship"
              value={selectedScholarshipId}
              onChange={(e) => setSelectedScholarshipId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg bg-white"
            >
              <option value="">All Verified Scholarships in Catalog ({scholarships.length})</option>
              {scholarships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.country})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer shrink-0 sm:pt-4">
            <input
              type="checkbox"
              checked={includePersonalContext}
              onChange={(e) => setIncludePersonalContext(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <span>Include my deadlines &amp; tracker summary</span>
          </label>
        </div>

        {/* Starter Questions */}
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendQuestion(prompt)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-zinc-200 text-zinc-800 rounded-lg hover:border-zinc-400 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Conversation Panel */}
        <div className="bg-white border border-zinc-200 rounded-xl flex flex-col min-h-[420px]">
          <div className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[540px]">
            {messages.length === 0 ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <p className="text-sm font-medium text-zinc-900">
                  Ready to answer scholarship questions
                </p>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  Select a specific scholarship above or ask about your saved deadlines, application progress, required documents, or language/entrance exam requirements.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-900'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Checking verified scholarship records...</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mx-6 mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-zinc-200 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about eligibility, exams, documents, or deadlines..."
              aria-label="Ask Synora Guide AI"
              className="flex-1 px-4 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
