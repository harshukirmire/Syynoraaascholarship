import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Loader2, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '../components/AppLayout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { ApplicationRecord, ApplicationStatus } from '../types/synora.ts';
import { sanitizeId } from '../utils/validation.ts';

const STATUSES: ApplicationStatus[] = [
  'Saved',
  'Planning',
  'In Progress',
  'Submitted',
  'Under Review',
  'Accepted',
  'Rejected',
  'Withdrawn',
];

export function TrackerPage() {
  const { applications, scholarships, upsertApplication, deleteApplication } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [provider, setProvider] = useState('');
  const [deadline, setDeadline] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Planning');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  function openNewModal() {
    setEditingId(null);
    setFormError('');
    const first = scholarships[0];
    setSelectedScholarshipId(first?.id || 'custom');
    setCustomName(first?.name || '');
    setProvider(first?.provider || '');
    setDeadline(first?.deadline || '');
    setApplicationDate(new Date().toISOString().slice(0, 10));
    setStatus('Planning');
    setReferenceNumber('');
    setNotes('');
    setModalOpen(true);
  }

  function openEditModal(record: ApplicationRecord) {
    setEditingId(record.id);
    setFormError('');
    setSelectedScholarshipId(record.scholarshipId);
    setCustomName(record.scholarshipName);
    setProvider(record.provider);
    setDeadline(record.deadline);
    setApplicationDate(record.applicationDate || '');
    setStatus(record.status);
    setReferenceNumber(record.referenceNumber || '');
    setNotes(record.notes || '');
    setModalOpen(true);
  }

  function handleSelectScholarship(schId: string) {
    setSelectedScholarshipId(schId);
    if (schId === 'custom') {
      setCustomName('');
      setProvider('');
      setDeadline('Not verified');
      return;
    }
    const found = scholarships.find((s) => s.id === schId);
    if (found) {
      setCustomName(found.name);
      setProvider(found.provider);
      setDeadline(found.deadline);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!customName.trim()) {
      setFormError('Please provide the scholarship name.');
      return;
    }

    setSaving(true);
    try {
      const schId =
        selectedScholarshipId && selectedScholarshipId !== 'custom'
          ? selectedScholarshipId
          : sanitizeId(`custom_${customName}`) || `custom_${Date.now()}`;

      await upsertApplication({
        id: editingId || sanitizeId(`app_${schId}_${Date.now()}`),
        scholarshipId: schId,
        scholarshipName: customName.trim(),
        provider: provider.trim() || 'Independent / External',
        deadline: deadline.trim() || 'Not verified',
        applicationDate: applicationDate.trim(),
        status,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim(),
      });
      setModalOpen(false);
    } catch {
      setFormError('Unable to save application record. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(applicationId: string) {
    setActionError('');
    try {
      await deleteApplication(applicationId);
    } catch {
      setActionError('Unable to delete tracked application. Please try again.');
    }
  }

  const filtered =
    statusFilter === 'All'
      ? applications
      : applications.filter((a) => a.status === statusFilter);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-zinc-900">
              Application Tracker
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              Manage reference numbers, submission dates, statuses, and application notes under your private account.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Tracked Application</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {['All', ...STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {actionError && (
          <div
            role="alert"
            className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800"
          >
            {actionError}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
            <p className="text-sm font-medium text-zinc-900">No applications tracked in this view</p>
            <p className="text-xs text-zinc-500 mt-1 mb-5">
              Start tracking an application from any scholarship page or add one manually here.
            </p>
            <button
              type="button"
              onClick={openNewModal}
              className="px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
            >
              Add First Application
            </button>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                    <th className="py-3 px-4 font-medium">Scholarship</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Application Date</th>
                    <th className="py-3 px-4 font-medium">Deadline</th>
                    <th className="py-3 px-4 font-medium">Reference No.</th>
                    <th className="py-3 px-4 font-medium">Notes</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map((app) => {
                    const isCatalogItem = scholarships.some((s) => s.id === app.scholarshipId);
                    return (
                      <tr key={app.id} className="hover:bg-zinc-50/70">
                        <td className="py-3.5 px-4 max-w-[260px]">
                          {isCatalogItem ? (
                            <Link
                              to={`/scholarships/${app.scholarshipId}`}
                              className="font-medium text-zinc-900 hover:underline block truncate"
                            >
                              {app.scholarshipName}
                            </Link>
                          ) : (
                            <span className="font-medium text-zinc-900 block truncate">
                              {app.scholarshipName}
                            </span>
                          )}
                          <span className="text-zinc-500 block truncate mt-0.5">{app.provider}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-zinc-900">
                          {app.status}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono-tabular text-zinc-700">
                          {app.applicationDate || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular text-zinc-700 max-w-[180px] truncate">
                          {app.deadline}
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular text-zinc-700 whitespace-nowrap">
                          {app.referenceNumber || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600 max-w-[220px] truncate">
                          {app.notes || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(app)}
                              aria-label={`Edit ${app.scholarshipName}`}
                              className="p-1.5 border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-100"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(app.id)}
                              aria-label={`Delete ${app.scholarshipName}`}
                              className="p-1.5 border border-zinc-200 rounded-md text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tracker-modal-title"
        >
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-5">
              <h2 id="tracker-modal-title" className="font-display text-lg font-semibold text-zinc-900">
                {editingId ? 'Update Tracked Application' : 'Add Tracked Application'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Close
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {!editingId && (
                <div>
                  <label htmlFor="tr-select" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Select scholarship from catalog
                  </label>
                  <select
                    id="tr-select"
                    value={selectedScholarshipId}
                    onChange={(e) => handleSelectScholarship(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
                  >
                    {scholarships.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.country})
                      </option>
                    ))}
                    <option value="custom">Other / Custom Scholarship</option>
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="tr-name" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Scholarship name *
                </label>
                <input
                  id="tr-name"
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tr-provider" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Provider
                  </label>
                  <input
                    id="tr-provider"
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="tr-status" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Application status
                  </label>
                  <select
                    id="tr-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                    className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="tr-date" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Application date
                  </label>
                  <input
                    id="tr-date"
                    type="date"
                    value={applicationDate}
                    onChange={(e) => setApplicationDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="tr-deadline" className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Deadline
                  </label>
                  <input
                    id="tr-deadline"
                    type="text"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tr-ref" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Reference / Application number
                </label>
                <input
                  id="tr-ref"
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Optional reference ID"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="tr-notes" className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  id="tr-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Document status, LOR reminders, or portal notes..."
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium border border-zinc-300 text-zinc-800 rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>Save Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
