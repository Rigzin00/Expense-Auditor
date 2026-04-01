import React from 'react';

const FinanceDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold">Finance Auditor Home</h1>
            </div>
            <div className="flex items-center">
              {/* Mock User Profile Icon */}
              <button
                type="button"
                className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
              >
                <span className="sr-only">Open user menu</span>
                <svg 
                  className="h-5 w-5 text-gray-300" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Claims Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Pending Claims</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Row 1: Rejected */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">John Doe</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Oct 24, 2026</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$450.00</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Lodging</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Rejected
                    </span>
                  </td>
                </tr>

                {/* Row 2: Flagged */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Jane Smith</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Oct 25, 2026</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$120.50</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Meals</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Flagged
                    </span>
                  </td>
                </tr>

                {/* Row 3: Approved */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Alice Johnson</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Oct 26, 2026</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$45.00</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Transport</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Approved
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinanceDashboard;