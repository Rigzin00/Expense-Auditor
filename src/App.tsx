import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import EmployeePortal from './components/EmployeePortal';
import FinanceDashboard from './components/FinanceDashboard';
import AuditDetailView from './components/AuditDetailView';
import { NotificationProvider, useNotifications } from './context/NotificationContext';

function NotificationDropdown({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const { notifications, markAllAsRead, syncBackendNotifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const ref = useRef<HTMLDivElement>(null);

  // Poll backend for new notifications every 10 seconds
  useEffect(() => {
    syncBackendNotifications();
    const interval = setInterval(syncBackendNotifications, 10000);
    return () => clearInterval(interval);
  }, [syncBackendNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (!next && unreadCount > 0) markAllAsRead();
        }}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>
            )}
          </div>
          <div className="py-1 max-h-80 overflow-y-auto" role="menu">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-gray-400">No recent notifications.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-gray-50 ${!notif.isRead ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${notif.type === 'success' ? 'bg-green-500' :
                        notif.type === 'error' ? 'bg-red-500' : 'bg-yellow-400'
                      }`}></span>
                    <div>
                      <p className={`text-sm font-semibold ${notif.type === 'success' ? 'text-green-800' :
                          notif.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                        }`}>{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5 leading-snug">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const navLinks = [
    { to: '/employee', label: 'Employee Portal' },
    { to: '/finance', label: 'Finance Dashboard' },
  ];

  return (
    <NotificationProvider>
      <Router>
        <div className="min-h-screen bg-[#f4f7f6] flex flex-col font-sans">
          {/* Global Top Navigation Bar */}
          <nav className="bg-white/80 backdrop-blur-md text-gray-900 border-b border-gray-200 z-10 sticky top-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-4 sm:gap-8 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="bg-black text-white w-6 h-6 flex items-center justify-center rounded pl-[1px]">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <span className="font-semibold text-xs tracking-widest uppercase text-gray-900 whitespace-nowrap">Expense Auditor</span>
                  </div>

                  <div className="hidden sm:flex space-x-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <NotificationDropdown isOpen={isNotificationsOpen} setIsOpen={setIsNotificationsOpen} />
              </div>

              <div className="sm:hidden pb-3 -mt-1">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Global App Layout for Routes */}
          <div className="flex-1 px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/employee" replace />} />
              <Route path="/employee" element={<EmployeePortal />} />
              <Route path="/finance" element={<FinanceDashboard />} />
              <Route path="/audit/:id" element={<AuditDetailView />} />
            </Routes>
          </div>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;