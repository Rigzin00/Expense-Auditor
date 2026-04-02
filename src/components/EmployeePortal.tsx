import React, { useState } from 'react';

const EmployeePortal: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [businessPurpose, setBusinessPurpose] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setHasError(false); // Clear error on new file
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

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('businessPurpose', businessPurpose);

      const response = await fetch('http://127.0.0.1:8000/api/v1/expenses', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Handle the JSON response
      const data = await response.json();
      if (data.status === 'error') {
        throw new Error(data.message || 'Validation failed');
      }

      setSelectedFile(null);
      setBusinessPurpose('');
      setIsSubmitting(false);
      setShowSuccessBanner(true);
      
      // Hide banner after 3 seconds
      setTimeout(() => setShowSuccessBanner(false), 3000);
    } catch (error) {
      console.error('Error submitting expense:', error);
      setHasError(true);
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = !selectedFile || !businessPurpose.trim() || isSubmitting || hasError;

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
              <span className="font-medium text-sm">Receipt securely sent to AI Auditor</span>
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
              Receipt
            </label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md relative cursor-pointer transition-colors ${
              hasError 
                ? 'border-red-500 hover:border-red-600 bg-red-50' 
                : 'border-gray-300 hover:border-blue-500'
            }`}>
              <div className="space-y-1 text-center">
                {selectedFile ? (
                  <div className="text-sm text-gray-900 font-medium break-all">
                    {selectedFile.name}
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
            <div className="text-sm font-semibold text-red-600 mt-2">
              Validation Failed: The date on the receipt does not match the claimed expense date. Please review.
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              isSubmitDisabled
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? 'Analyzing Policy...' : 'Submit Expense'}
          </button>

          {/* Toggle Mock Error Link */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setHasError(!hasError)}
              className="text-xs text-gray-400 hover:text-gray-600 underline focus:outline-none"
            >
              Toggle Mock Error
            </button>
          </div>
        </form>
        </div>

        {/* Recent Claims Section */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Claims
          </h2>
          <ul className="space-y-3">
            <li className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-col">
                <span className="font-medium text-gray-800">Uber to Client Meeting</span>
                <span className="text-sm text-gray-500">$45.00</span>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                Approved
              </span>
            </li>
            
            <li className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-col">
                <span className="font-medium text-gray-800">Team Lunch</span>
                <span className="text-sm text-gray-500">$120.00</span>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">
                Pending Audit
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
