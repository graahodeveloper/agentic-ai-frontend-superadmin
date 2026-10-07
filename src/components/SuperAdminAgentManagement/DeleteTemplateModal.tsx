import React, { useEffect, useState } from 'react';
import {
  AgentTemplate,
  TemplateDeletionImpact,
  useDeleteAgentTemplateMutation,
  useGetTemplateDeletionImpactQuery,
} from '@/features/agentTemplateApi/agentTemplateApi';

interface DeleteTemplateModalProps {
  template: AgentTemplate;
  adminId: string;
  onClose: () => void;
  onDeleted: (message: string) => void;
}

type ApiError = { status?: number; data?: { message?: string; error?: string; detail?: string; impact?: TemplateDeletionImpact } };

const errorMessage = (error: unknown, fallback: string) => {
  const data = (error as ApiError)?.data;
  return data?.message || data?.error || data?.detail || fallback;
};

const DeleteTemplateModal: React.FC<DeleteTemplateModalProps> = ({ template, adminId, onClose, onDeleted }) => {
  const {
    data: previewImpact,
    isFetching: isLoadingImpact,
    error: impactError,
    refetch: refetchImpact,
  } = useGetTemplateDeletionImpactQuery({ id: template.id, admin_id: adminId }, { refetchOnMountOrArgChange: true });
  const [deleteAgentTemplate, { isLoading: isDeleting }] = useDeleteAgentTemplateMutation();

  const [confirmName, setConfirmName] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // A 409 on submit carries a fresher impact than the preview (e.g. a subscription was added meanwhile).
  const [blockedImpact, setBlockedImpact] = useState<TemplateDeletionImpact | null>(null);

  const impact = blockedImpact ?? previewImpact;
  const isBlocked = impact ? !impact.can_delete : false;
  const requiresCascade = impact?.requires_cascade ?? false;
  const nameMatches = confirmName.trim() === template.name.trim();
  const canSubmit = !!impact && !isBlocked && !isDeleting && !isLoadingImpact
    && (!requiresCascade || (nameMatches && acknowledged));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isDeleting]);

  const handleDelete = async () => {
    if (!canSubmit) return;
    setSubmitError(null);
    try {
      const result = await deleteAgentTemplate({ id: template.id, admin_id: adminId, cascade: requiresCascade }).unwrap();
      onDeleted(
        result.deleted_total > 0
          ? `Template "${template.name}" and ${result.deleted_total} related record(s) were permanently deleted.`
          : `Template "${template.name}" was permanently deleted.`
      );
    } catch (error) {
      const data = (error as ApiError)?.data;
      if (data?.impact) setBlockedImpact(data.impact);
      setSubmitError(errorMessage(error, 'Failed to delete template. Nothing was deleted.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isDeleting && onClose()} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-template-title"
        className="relative w-full max-w-lg max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-white/15 rounded-xl">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="delete-template-title" className="text-lg font-bold text-white">Delete Agent Template</h2>
              <p className="text-sm text-white/85 truncate" title={template.name}>
                <span className="font-semibold text-white">{template.name}</span>
                <span className="text-white/70"> · {template.agent_id}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoadingImpact && !impact && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
              Checking everything that depends on this template…
            </div>
          )}

          {impactError && !impact && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <p className="font-semibold">Could not load the deletion preview.</p>
              <p className="mt-1">
                {(impactError as ApiError)?.status === 404
                  ? 'The server does not support template deletion yet (backend update not deployed), or this template no longer exists.'
                  : errorMessage(impactError, 'Please try again.')}
              </p>
              <button onClick={() => refetchImpact()} className="mt-2 text-xs font-semibold underline">
                Retry
              </button>
            </div>
          )}

          {impact && isBlocked && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm font-bold text-amber-800">This template cannot be deleted right now.</p>
              <p className="mt-1 text-sm text-amber-800">
                Protected records still depend on it. Resolve these first — nothing has been deleted.
              </p>
              <ul className="mt-3 space-y-1.5">
                {impact.blockers.map((b) => (
                  <li key={b.model} className="text-sm text-amber-900">
                    <span className="font-semibold">{b.count} × {b.label}</span>
                    <span className="block text-xs text-amber-700">{b.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {impact && !isBlocked && !requiresCascade && (
            <p className="text-sm text-gray-700">
              This template has no instances, activations, or other dependent data. It will be
              <span className="font-semibold text-red-600"> permanently deleted</span> and removed from the Agent Templates list.
              This cannot be undone.
            </p>
          )}

          {impact && !isBlocked && requiresCascade && (
            <>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm font-bold text-red-800">
                  This permanently deletes the template and ALL data built on it.
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Every agent instance created from this template
                  {impact.active_instances_count > 0 && (
                    <> — including <span className="font-semibold">{impact.active_instances_count} active</span> ones customers may be using right now —</>
                  )}{' '}
                  will stop working and be removed together with its related records. This cannot be undone.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Will be permanently deleted ({impact.will_delete_total} records)
                </p>
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {impact.will_delete.map((row) => (
                    <li key={row.model} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-gray-700">{row.label}</span>
                      <span className="font-bold text-red-600">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {impact.retained.length > 0 && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Kept for billing history</p>
                  {impact.retained.map((row) => (
                    <p key={row.model} className="text-sm text-gray-700">
                      {row.count} × {row.label} <span className="text-xs text-gray-500">— {row.note}</span>
                    </p>
                  ))}
                </div>
              )}

              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                I understand that all instances and related data listed above will be permanently deleted.
              </label>

              <div>
                <label htmlFor="confirm-template-name" className="block text-sm text-gray-700 mb-1.5">
                  Type <span className="font-mono font-semibold text-gray-900 select-all">{template.name}</span> to confirm
                </label>
                <input
                  id="confirm-template-name"
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder={template.name}
                />
              </div>
            </>
          )}

          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{submitError}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            {isBlocked ? 'Close' : 'Cancel'}
          </button>
          {impact && !isBlocked && (
            <button
              onClick={handleDelete}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {isDeleting ? 'Deleting…' : requiresCascade ? 'Delete template and all data' : 'Delete template'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteTemplateModal;
