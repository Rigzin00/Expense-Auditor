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
          <div className="min-h-[300px] flex items-center justify-center text-gray-400">
            {/* Placeholder for receipt image and extracted data */}
            Receipt Image & OCR Data
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
