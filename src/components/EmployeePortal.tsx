import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';

interface RecentClaim {
  id: string;
  merchantName: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  riskLevel: string;
}

const EmployeePortal: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [businessPurpose, setBusinessPurpose] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState<boolean>(true);
  const [lastSubmitResult, setLastSubmitResult] = useState<{ riskLevel: string; reasoning: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();

  // Fetch recent claims from API
  const fetchRecentClaims = useCallback(async () => {
    try {
      setClaimsLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/expenses');
      if (!response.ok) throw new Error('Failed to fetch');
      const jsonData = await response.json();
      const claims: RecentClaim[] = (jsonData.data || [])
        .slice(-5)
        .reverse()
        .map((e: any) => ({
          id: e.id,
          merchantName: e.merchantName || e.category || 'Unknown',
          date: e.date,
          amount: e.amount,
          currency: e.currency || 'USD',
          category: e.category,
          riskLevel: e.riskLevel || 'Flagged',
        }));
      setRecentClaims(claims);
    } catch {
      // silently fail
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentClaims();
  }, [fetchRecentClaims]);

  // File selection handler
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setHasError(false);
    setErrorMessage('');
    setLastSubmitResult(null);
    // Generate preview URL for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleFileSelect(file);
    } else {
      setHasError(true);
      setErrorMessage('Please upload a JPG, PNG, or PDF file only.');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
    setHasError(false);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedFile) return;

    setIsSubmitting(true);
    setShowSuccessBanner(false);
    setHasError(false);
    setErrorMessage('');
    setLastSubmitResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('expenseDate', expenseDate);
      formData.append('businessPurpose', businessPurpose);
      formData.append('employeeName', employeeName.trim() || 'Employee');

      const response = await fetch('http://127.0.0.1:8000/api/v1/expenses', {
        method: 'POST',
        body: formData,
      });

      let data: any;
      try { data = await response.json(); } catch { data = null; }

      if (!response.ok) throw new Error(data?.message || 'Upload failed');
      if (data?.status === 'error') throw new Error(data.message || 'Validation failed');

      const riskLevel = data?.data?.riskLevel || 'Flagged';
      const reasoning = data?.data?.aiReasoning || '';

      setLastSubmitResult({ riskLevel, reasoning });

      if (riskLevel === 'Approved') {
        addNotification('success', 'Expense Auto-Approved', `Your receipt was automatically approved by the AI auditor.`);
      } else if (riskLevel === 'Rejected') {
        addNotification('error', 'Expense Rejected', `Your receipt was rejected. Reason: ${reasoning || 'See audit detail.'}`);
      } else {
        addNotification('info', 'Expense Under Review', 'Your receipt has been submitted and is pending manual review by the Finance team.');
      }

      // Reset form
      clearFile();
      setExpenseDate('');
      setBusinessPurpose('');
      setIsSubmitting(false);
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 6000);
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

  const getRiskIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'approved': return '✓';
      case 'rejected': return '✗';
      default: return '⚠';
    }
  };

  const isSubmitDisabled = !selectedFile || !expenseDate || !businessPurpose.trim() || isSubmitting;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg space-y-6">

        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Submit an Expense</h1>
          <p className="mt-1 text-sm text-gray-500">Upload your receipt and it will be automatically audited against the company policy.</p>
        </div>

        {/* Success Banner */}
        {showSuccessBanner && lastSubmitResult && (
          <div
            className={`border px-4 py-4 rounded-xl shadow-sm transition-all ${
              lastSubmitResult.riskLevel === 'Approved'
                ? 'bg-green-50 border-green-400'
                : lastSubmitResult.riskLevel === 'Rejected'
                ? 'bg-red-50 border-red-400'
                : 'bg-yellow-50 border-yellow-400'
            }`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <span className={`text-xl font-bold mt-0.5 ${
                lastSubmitResult.riskLevel === 'Approved' ? 'text-green-600' :
                lastSubmitResult.riskLevel === 'Rejected' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {getRiskIcon(lastSubmitResult.riskLevel)}
              </span>
              <div>
                <p className={`font-semibold text-sm ${
                  lastSubmitResult.riskLevel === 'Approved' ? 'text-green-800' :
                  lastSubmitResult.riskLevel === 'Rejected' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  AI Audit Result: {lastSubmitResult.riskLevel}
                </p>
                {lastSubmitResult.reasoning && (
                  <p className="text-xs mt-1 text-gray-600">{lastSubmitResult.reasoning}</p>
                )}
                <p className="text-xs mt-1 text-gray-500">Check the notification bell for more details.</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Employee Name */}
            <div>
              <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="employeeName"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                placeholder="e.g. Alex Johnson"
              />
            </div>

            {/* File Dropzone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt <span className="text-gray-500 font-normal">(JPG, PNG, or PDF)</span>
              </label>

              {/* Image preview if file selected */}
              {filePreviewUrl && (
                <div className="mb-3 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={filePreviewUrl} alt="Receipt preview" className="w-full max-h-48 object-contain" />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-2 right-2 bg-white border border-gray-300 rounded-full p-1 shadow text-gray-500 hover:text-red-600 hover:border-red-300 transition"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* PDF indicator */}
              {selectedFile && !filePreviewUrl && (
                <div className="mb-3 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 16h8v1H8v-1zm0-3h8v1H8v-1zm0-3h5v1H8v-1z"/>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={clearFile} className="text-gray-400 hover:text-red-500 transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Dropzone (shown when no file) */}
              {!selectedFile && (
                <div
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md relative cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : hasError
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center mt-1">
                      <span className="font-medium text-blue-600">Click to upload</span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".png,.jpg,.jpeg,.pdf"
                  />
                </div>
              )}
            </div>

            {/* Claimed Expense Date */}
            <div>
              <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
              />
            </div>

            {/* Business Purpose */}
            <div>
              <label htmlFor="businessPurpose" className="block text-sm font-medium text-gray-700 mb-1">
                Business Purpose
              </label>
              <textarea
                id="businessPurpose"
                rows={3}
                value={businessPurpose}
                onChange={(e) => setBusinessPurpose(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                placeholder="Describe the business reason for this expense (e.g., 'Team lunch after Q2 planning meeting')"
              />
              <p className="mt-1 text-xs text-gray-400">Be specific — the AI uses this to verify compliance with company policy.</p>
            </div>

            {/* Error */}
            {hasError && (
              <div className="text-sm font-medium text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white transition-colors ${
                isSubmitDisabled
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Analyzing Receipt &amp; Policy...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit for AI Audit
                </>
              )}
            </button>
          </form>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">How It Works</h2>
          <ol className="space-y-3">
            {[
              { step: '1', title: 'Upload Receipt', desc: 'AI extracts merchant, date, amount, and currency via OCR.' },
              { step: '2', title: 'Policy Check', desc: 'The AI cross-references your expense against the 40-page company policy.' },
              { step: '3', title: 'Get a Verdict', desc: 'Your claim is Approved, Flagged, or Rejected with a clear reason.' },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">{step}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Recent Claims */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Recent Claims</h2>
            <button
              onClick={fetchRecentClaims}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
            >
              Refresh
            </button>
          </div>
          {claimsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentClaims.length === 0 ? (
            <div className="text-center py-6">
              <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-400">No claims submitted yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentClaims.map((claim) => (
                <li key={claim.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition">
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-gray-800 text-sm truncate">{claim.merchantName}</span>
                    <span className="text-xs text-gray-400 mt-0.5">{claim.date} · {claim.category}</span>
                    <span className="text-sm text-gray-600 font-medium">{claim.currency} {Number(claim.amount).toFixed(2)}</span>
                  </div>
                  <span className={getRiskBadge(claim.riskLevel)}>
                    {getRiskIcon(claim.riskLevel)} {claim.riskLevel || 'Pending'}
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