import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface ExpenseDetails {
  id: string;
  receiptImageUrl: string;
  extractedData: {
    merchantName: string;
    date: string;
    totalAmount: number;
    currency: string;
  };
  aiAudit: {
    status: string;
    reasoning: string;
  };
  businessPurpose: string;
}

const AuditDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<ExpenseDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [auditorComments, setAuditorComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/expenses/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch expense details');
        }
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
      const response = await fetch(`http://127.0.0.1:8000/api/v1/expenses/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, auditorComments }),
      });
      if (!response.ok) throw new Error('Failed to update decision');
      const result = await response.json();
      
      // Update local state with the new risk level from backend
      if (result.status === 'success' && expense) {
        setExpense({
          ...expense,
          aiAudit: { ...expense.aiAudit, status: result.data.riskLevel }
        });
        setAuditorComments('');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center bg-gray-100 min-h-screen">Loading expense details...</div>;
  }

  if (error || !expense) {
    return <div className="p-8 text-center text-red-600 bg-gray-100 min-h-screen">Error: {error || 'Expense not found'}</div>;
  }

  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'rejected':
        return {
          banner: 'bg-red-50 border-red-400',
          icon: 'text-red-400',
          title: 'text-red-800',
          text: 'text-red-700'
        };
      case 'approved':
        return {
          banner: 'bg-green-50 border-green-400',
          icon: 'text-green-400',
          title: 'text-green-800',
          text: 'text-green-700'
        };
      case 'flagged':
      default:
        return {
          banner: 'bg-yellow-50 border-yellow-400',
          icon: 'text-yellow-400',
          title: 'text-yellow-800',
          text: 'text-yellow-700'
        };
    }
  };

  const statusStyles = getStatusStyles(expense.aiAudit.status);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Top Bar with Back Button */}
      <div className="max-w-7xl mx-auto mb-6">
        <button 
          onClick={() => navigate('/finance')}
          className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors focus:outline-none"
        >
          <span className="mr-2">←</span> Back to Dashboard
        </button>
      </div>

      {/* Two-Column Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Receipt & Extraction */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-4">
            Receipt & Extraction
          </h2>
          <div className="space-y-6">
            {/* Receipt Image Placeholder */}
            <div className="w-full h-64 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {expense.receiptImageUrl ? (
                <img src={expense.receiptImageUrl} alt="Receipt" className="object-contain h-full w-full" />
              ) : (
                <span className="text-gray-500 font-medium">Receipt Image Placeholder</span>
              )}
            </div>

            {/* Extracted Data List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Extracted Data</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Merchant Name</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">{expense.extractedData.merchantName}</dd>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">{expense.extractedData.date}</dd>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">${expense.extractedData.totalAmount}</dd>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Business Purpose</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">{expense.businessPurpose || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Right Column: AI Policy Audit */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-4">
            AI Policy Audit
          </h2>
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`${statusStyles.banner} border-l-4 p-4 rounded-r-md`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className={`h-5 w-5 ${statusStyles.icon}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-bold ${statusStyles.title}`}>Status: {expense.aiAudit.status}</h3>
                  <p className={`mt-1 text-sm ${statusStyles.text}`}>
                    {expense.aiAudit.status === 'Flagged' ? 'This expense requires manual review by an auditor.' : `This expense was ${expense.aiAudit.status.toLowerCase()}.`}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Auditor Insights</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-gray-700 text-sm leading-relaxed">
                <span className="font-semibold text-gray-900">{expense.aiAudit.status}:</span> {expense.aiAudit.reasoning}
              </div>
            </div>

            {/* Human-in-the-Loop Override */}
            {expense.aiAudit.status === 'Flagged' && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Human-in-the-Loop Override</h3>
                <div className="mb-4">
                  <label htmlFor="auditorComments" className="sr-only">Auditor Comments</label>
                  <textarea
                    id="auditorComments"
                    value={auditorComments}
                    onChange={(e) => setAuditorComments(e.target.value)}
                    disabled={isSubmitting}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="Enter your override or rejection justification here..."
                  ></textarea>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => handleDecision('APPROVE')}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Approve Override'}
                  </button>
                  <button 
                    onClick={() => handleDecision('REJECT')}
                    disabled={isSubmitting || !auditorComments.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuditDetailView;
