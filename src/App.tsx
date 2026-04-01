import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import EmployeePortal from './components/EmployeePortal';
import FinanceDashboard from './components/FinanceDashboard';
import AuditDetailView from './components/AuditDetailView';

function App() {
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
