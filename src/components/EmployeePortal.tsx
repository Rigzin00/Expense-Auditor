import React, { useState } from 'react';

const EmployeePortal: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [businessPurpose, setBusinessPurpose] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0].name);
    }
  };

  const handlePurposeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBusinessPurpose(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting expense:', { selectedFile, businessPurpose });
  };

  const isSubmitDisabled = !selectedFile || !businessPurpose.trim();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        
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
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative cursor-pointer hover:border-blue-500 transition-colors">
              <div className="space-y-1 text-center">
                {selectedFile ? (
                  <div className="text-sm text-gray-900 font-medium break-all">
                    {selectedFile}
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
            Submit Expense
          </button>
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
