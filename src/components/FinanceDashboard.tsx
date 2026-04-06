import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

interface RecentClaim {
  id: string;
  merchantName: string;
  date: string;
  amount: number;
  category: string;
  riskLevel: string;
}

const EmployeePortal: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [businessPurpose, setBusinessPurpose] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState<boolean>(true);
  const { addNotification } = useNotifications();

  // Fetch recent claims from the API on mount
  const fetchRecentClaims = async () => {
    try {
      setClaimsLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/expenses');
      if (!response.ok) throw new Error('Failed to fetch');
      const jsonData = await response.json();
      // Show only the 5 most recently added (last in array = most recent insert order)
      const claims: RecentClaim[] = (jsonData.data || [])
        .slice(-5)
        .reverse()
        .map((e: any) => ({
          id: e.id,
          merchantName: e.merchantName || e.category || 'Unknown',
          date: e.date,
          amount: e.amount,
          category: e.category,
          riskLevel: e.riskLevel || 'Flagged',
        }));
      setRecentClaims(claims);
    } catch {
      // silently fail — the section just won't show
    } finally {
      setClaimsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentClaims();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setHasError(false);
      setErrorMessage('');
    }
  };

  const handlePurposeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBusinessPurpose(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedFile) return;

    setIsSubmitting(true);
    setShowSuccessBanner(false);
    setHasError(false);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('expenseDate', expenseDate);
      formData.append('businessPurpose', businessPurpose);

      const response = await fetch('http://127.0.0.1:8000/api/v1/expenses', {
        method: 'POST',
        body: formData,
      });

      let data: any;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Upload failed');
      }

      if (data?.status === 'error') {
        throw new Error(data.message || 'Validation failed');
      }

      // Add a dashboard notification for the submission result
      const riskLevel = data?.data?.riskLevel || 'Flagged';
      if (riskLevel === 'Approved') {
        addNotification('success', 'Expense Auto-Approved', `Your receipt was automatically approved by the AI auditor.`);
      } else if (riskLevel === 'Rejected') {
        addNotification('error', 'Expense Rejected', `Your receipt was rejected. Reason: ${data?.data?.aiReasoning || 'See audit detail.'}`);
      } else {
        addNotification('info', 'Expense Under Review', 'Your receipt has been submitted and is pending manual review by the Finance team.');
      }

      setSelectedFile(null);
      setExpenseDate('');
      setBusinessPurpose('');
      setIsSubmitting(false);
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 4000);

      // Refresh the recent claims list
      fetchRecentClaims();
    } catch (error: any) {
      console.error('Error submitting expense:', error);
      setHasError(true);
      setErrorMessage(error.message || 'Validation failed');
      setIsSubmitting(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'approved': return 'px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full';
      case 'rejected': return 'px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full';
      default: return 'px-2.5 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full';
    }
  };

  const isSubmitDisabled = !selectedFile || !expenseDate || !businessPurpose.trim() || isSubmitting;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Success Banner */}
        {showSuccessBanner && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl shadow-sm" role="alert">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-sm">Receipt submitted! Check the notification bell for your audit result.</span>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Submit New Expense
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Dropzone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt (JPG, PNG, or PDF)
            </label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md relative cursor-pointer transition-colors ${
              hasError 
                ? 'border-red-500 hover:border-red-600 bg-red-50' 
                : 'border-gray-300 hover:border-blue-500'
            }`}>
              <div className="space-y-1 text-center">
                {selectedFile ? (
                  <div className="text-sm text-gray-900 font-medium break-all">
                    ✓ {selectedFile.name}
                  </div>
                ) : (
                  <>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center mt-2">
                      <span className="relative font-medium text-blue-600">
                        Upload a file
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.pdf"
              />
            </div>
          </div>

          {/* Claimed Expense Date */}
          <div>
            <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-2">
              Claimed Expense Date
            </label>
            <input
              type="date"
              id="expenseDate"
              value={expenseDate}
              onChange={(e) => {
                setExpenseDate(e.target.value);
                setHasError(false);
                setErrorMessage('');
              }}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
            />
          </div>

          {/* Business Purpose textarea */}
          <div>
            <label htmlFor="businessPurpose" className="block text-sm font-medium text-gray-700 mb-2">
              Business Purpose
            </label>
            <textarea
              id="businessPurpose"
              rows={3}
              value={businessPurpose}
              onChange={handlePurposeChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
              placeholder="What was the purpose of this expense?"
            />
          </div>

          {hasError && (
            <div className="text-sm font-semibold text-red-600 mt-2 bg-red-50 p-3 rounded border border-red-200 flex items-start gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              isSubmitDisabled
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Analyzing Policy...
              </span>
            ) : 'Submit Expense'}
          </button>
        </form>
        </div>

        {/* Recent Claims Section — LIVE from API */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Claims
          </h2>
          {claimsLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading claims...</p>
          ) : recentClaims.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No claims submitted yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentClaims.map((claim) => (
                <li key={claim.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{claim.merchantName}</span>
                    <span className="text-xs text-gray-400">{claim.date} · {claim.category}</span>
                    <span className="text-sm text-gray-500">${Number(claim.amount).toFixed(2)}</span>
                  </div>
                  <span className={getRiskBadge(claim.riskLevel)}>
                    {claim.riskLevel || 'Pending'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;