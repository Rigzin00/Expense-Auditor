import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import EmployeePortal from './components/EmployeePortal';
import FinanceDashboard from './components/FinanceDashboard';
import AuditDetailView from './components/AuditDetailView';

function App() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Global Top Navigation Bar */}
        <nav className="bg-blue-800 text-white shadow-md z-10 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center space-x-8">
                <span className="font-bold text-xl tracking-tight">Policy-First Auditor</span>
                
                <div className="hidden sm:flex space-x-4">
                  <Link 
                    to="/employee" 
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Employee Portal
                  </Link>
                  <Link 
                    to="/finance" 
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Finance Dashboard
                  </Link>
                </div>
              </div>
              
              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white transition"
                  aria-label="Notifications"
                >
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* Notification Dot */}
                  <span className="absolute top-1 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-blue-800"></span>
                </button>

                {/* Dropdown Menu */}
                {isNotificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">Notifications</p>
                    </div>
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 cursor-pointer">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 mt-1"></span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">Action Required</p>
                            <p className="text-sm text-gray-600 mt-0.5">Uber receipt is too blurry. Please re-upload.</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 mt-1"></span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">Success</p>
                            <p className="text-sm text-gray-600 mt-0.5">Team Lunch expense has been approved.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Global App Layout for Routes */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/employee" replace />} />
            <Route path="/employee" element={<EmployeePortal />} />
            <Route path="/finance" element={<FinanceDashboard />} />
            <Route path="/audit/:id" element={<AuditDetailView />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
