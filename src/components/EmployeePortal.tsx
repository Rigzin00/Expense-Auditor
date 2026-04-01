import React from 'react';

const EmployeePortal: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Submit New Expense
        </h1>
        
        {/* Empty body for future portal features (upload, form, etc.) */}
        <div className="w-full min-h-[200px]"></div>
      </div>
    </div>
  );
};

export default EmployeePortal;
