import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface ExpenseDetails {
  id: string;
  receiptImageUrl: string;
  extractedData: {
    merchantName: string;
    date: string;
    totalAmount: number;
    currency: string;
    category: string;
  };
  aiAudit: {
    status: string;
    reasoning: string;
    policySnippet?: string;
  };
  businessPurpose: string;
  employeeName: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const lower = status?.toLowerCase();
  if (lower === 'approved') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
      <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Approved
    </span>
  );
  if (lower === 'rejected') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
      <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
      <svg className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      Flagged
    </span>
  );
};

const AuditDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<ExpenseDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const [auditorComments, setAuditorComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageZoomed, setImageZoomed] = useState<boolean>(false);
  const [decisionResult, setDecisionResult] = useState<{ action: string; comment: string } | null>(null);

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/expenses/${id}`);
        if (!response.ok) throw new Error('Failed to fetch expense details');
        const data = await response.json();
        setExpense(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchExpenseDetails();
  }, [id]);

  const handleDecision = async (action: 'APPROVE' | 'REJECT') => {
    if (!id || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/expenses/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, auditorComments }),
      });
      if (!response.ok) throw new Error('Failed to update decision');
      const result = await response.json();

      if (result.status === 'success' && expense) {
        setExpense({
          ...expense,
          aiAudit: { ...expense.aiAudit, status: result.data.riskLevel }
        });
        setDecisionResult({ action, comment: auditorComments });
        setAuditorComments('');
        const type = action === 'APPROVE' ? 'success' : 'error';
        const title = action === 'APPROVE' ? 'Claim Approved ✓' : 'Claim Rejected';
        addNotification(type, title, `The auditor has ${action === 'APPROVE' ? 'approved' : 'rejected'} the claim for ${expense.extractedData.merchantName}.`);
        setTimeout(() => navigate('/finance'), 1500);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating decision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p className="text-gray-500">Loading audit details...</p>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error: {error || 'Expense not found'}</p>
          <button onClick={() => navigate('/finance')} className="mt-3 text-blue-600 hover:underline text-sm">← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const getStatusBanner = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'rejected': return { bg: 'bg-red-50 border-red-400', title: 'text-red-800', body: 'text-red-700' };
      case 'approved': return { bg: 'bg-green-50 border-green-400', title: 'text-green-800', body: 'text-green-700' };
      default:         return { bg: 'bg-yellow-50 border-yellow-400', title: 'text-yellow-800', body: 'text-yellow-700' };
    }
  };

  const statusStyle = getStatusBanner(expense.aiAudit.status);
  const currentStatus = expense.aiAudit.status?.toLowerCase();

  // Traffic light colors
  const trafficLights = [
    { key: 'approved', color: 'bg-green-400', label: 'Approved' },
    { key: 'flagged',  color: 'bg-yellow-400', label: 'Flagged' },
    { key: 'rejected', color: 'bg-red-500',   label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Back button + title */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/finance')}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition font-sans"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <StatusBadge status={expense.aiAudit.status} />
          <span className="text-xs text-gray-400 font-mono">#{expense.id}</span>
        </div>
      </div>

      {/* Decision success flash */}
      {decisionResult && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className={`px-4 py-3 rounded-lg border text-sm font-medium flex items-center gap-2 ${
            decisionResult.action === 'APPROVE'
              ? 'bg-green-50 border-green-300 text-green-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Decision recorded! Redirecting to dashboard...
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: Receipt & Extracted Data ── */}
        <div className="space-y-6">
          {/* Receipt Image Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2 font-serif">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Receipt Image
            </h2>

            <div
              className={`relative w-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer transition-all ${
                imageZoomed ? 'h-auto' : 'h-56'
              }`}
              onClick={() => !imageError && setImageZoomed(!imageZoomed)}
              title={imageError ? '' : 'Click to zoom'}
            >
              {expense.receiptImageUrl && !imageError ? (
                <>
                  <img
                    src={expense.receiptImageUrl}
                    alt="Receipt"
                    className={`object-contain rounded-lg transition-all ${imageZoomed ? 'w-full' : 'h-56 w-full'}`}
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded">
                    {imageZoomed ? 'Click to shrink' : 'Click to zoom'}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 px-4">
                  <svg className="mx-auto h-12 w-12 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Receipt image unavailable</p>
                </div>
              )}
            </div>

            {expense.receiptImageUrl && !imageError && (
              <a
                href={expense.receiptImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open full image in new tab
              </a>
            )}
          </div>

          {/* Extracted Data Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              OCR Extracted Data
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              {[
                { label: 'Employee', value: expense.employeeName || 'N/A' },
                { label: 'Merchant Name', value: expense.extractedData.merchantName },
                { label: 'Date', value: expense.extractedData.date },
                { label: 'Amount', value: `${expense.extractedData.currency} ${Number(expense.extractedData.totalAmount).toFixed(2)}` },
                { label: 'Category', value: expense.extractedData.category },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <dt className="text-xs font-medium text-gray-500">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">{value}</dd>
                </div>
              ))}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 col-span-2">
                <dt className="text-xs font-medium text-gray-500">Business Purpose</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{expense.businessPurpose || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* ── RIGHT: AI Audit & Override ── */}
        <div className="space-y-6">
          {/* AI Audit Result Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Policy Audit
            </h2>

            {/* Traffic Light System */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Traffic Light:</span>
              <div className="flex items-center gap-2">
                {trafficLights.map(({ key, color, label }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className={`inline-block h-4 w-4 rounded-full ${color} ${currentStatus === key ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'opacity-30'} transition-all`} />
                    <span className={`text-xs ${currentStatus === key ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Banner */}
            <div className={`${statusStyle.bg} border-l-4 p-4 rounded-r-lg mb-5`}>
              <div className="flex items-start gap-3">
                <div>
                  <h3 className={`text-sm font-bold ${statusStyle.title}`}>Status: {expense.aiAudit.status}</h3>
                  <p className={`mt-1 text-sm ${statusStyle.body}`}>
                    {currentStatus === 'flagged'
                      ? 'This expense requires manual review. The AI detected a potential policy discrepancy.'
                      : `This expense was ${expense.aiAudit.status?.toLowerCase()} by the AI policy auditor.`}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI Reasoning
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">{expense.aiAudit.status}:</span> {expense.aiAudit.reasoning}
              </div>
            </div>

            {/* Policy Snippet */}
            {expense.aiAudit.policySnippet && expense.aiAudit.policySnippet.trim() !== '' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Policy Reference Used by AI
                </h3>
                <div className="bg-gray-900 text-gray-300 rounded-lg p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto border border-gray-700 shadow-inner">
                  {expense.aiAudit.policySnippet}
                </div>
                <p className="mt-1.5 text-xs text-gray-400">↑ This is the exact policy section the AI referenced to make its decision.</p>
              </div>
            )}
          </div>

          {/* Human-in-the-Loop Override Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Human-in-the-Loop Override
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {currentStatus === 'flagged'
                ? 'Review the AI decision and choose to approve or reject this claim.'
                : 'As a Finance auditor, you can override the AI decision. Provide a justification below.'}
            </p>

            <div className="mb-4">
              <label htmlFor="auditorComments" className="block text-sm font-medium text-gray-700 mb-1">
                Auditor Comments
                {currentStatus !== 'flagged' && <span className="text-gray-400 font-normal ml-1">(required to override)</span>}
              </label>
              <textarea
                id="auditorComments"
                value={auditorComments}
                onChange={(e) => setAuditorComments(e.target.value)}
                disabled={isSubmitting}
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Enter your justification or override reason here..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDecision('APPROVE')}
                disabled={isSubmitting || currentStatus === 'approved'}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {isSubmitting ? 'Updating...' : currentStatus === 'approved' ? '✓ Already Approved' : 'Approve Claim'}
              </button>
              <button
                onClick={() => handleDecision('REJECT')}
                disabled={isSubmitting || currentStatus === 'rejected' || !auditorComments.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {isSubmitting ? 'Updating...' : currentStatus === 'rejected' ? '✗ Already Rejected' : 'Reject Claim'}
              </button>
            </div>
            {currentStatus !== 'flagged' && !auditorComments.trim() && (
              <p className="mt-2 text-xs text-gray-400 text-center">Add a comment to enable the Reject button.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuditDetailView;