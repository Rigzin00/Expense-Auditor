import React from 'react';

const AuditDetailView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Top Bar with Back Button */}
      <div className="max-w-7xl mx-auto mb-6">
        <button className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors focus:outline-none">
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
            <div className="w-full h-64 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-gray-500 font-medium">Receipt Image Placeholder</span>
            </div>

            {/* Extracted Data List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Extracted Data</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Merchant Name</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">Starbucks</dd>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">Oct 24, 2025</dd>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">$15.50</dd>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Currency</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">USD</dd>
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
          <div className="min-h-[300px] flex items-center justify-center text-gray-400">
            {/* Placeholder for policy reasoning, snippets, and rule flags */}
            Policy Snippets & Audit Justification
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuditDetailView;
