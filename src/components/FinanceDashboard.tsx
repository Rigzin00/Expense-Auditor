import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Expense {
  id: string;
  employeeName: string;
  merchantName: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  riskLevel: string;
  aiReasoning: string;
}

type FilterTab = 'All' | 'Flagged' | 'Rejected' | 'Approved';

const FinanceDashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const navigate = useNavigate();

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/expenses');
      if (!response.ok) throw new Error('Network response was not ok');
      const jsonData = await response.json();

      // Sort by risk: Flagged first, then Rejected, then Approved
      const riskOrder: Record<string, number> = { flagged: 1, rejected: 2, approved: 3 };
      const sorted = (jsonData.data as Expense[]).sort((a, b) => {
        const aR = riskOrder[a.riskLevel?.toLowerCase() || 'flagged'] || 4;
        const bR = riskOrder[b.riskLevel?.toLowerCase() || 'flagged'] || 4;
        return aR - bR;
      });
      setExpenses(sorted);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchExpenses, 30000);
    return () => clearInterval(interval);
  }, [fetchExpenses]);

  // Counts
  const counts = {
    All: expenses.length,
    Flagged: expenses.filter(e => e.riskLevel?.toLowerCase() === 'flagged').length,
    Rejected: expenses.filter(e => e.riskLevel?.toLowerCase() === 'rejected').length,
    Approved: expenses.filter(e => e.riskLevel?.toLowerCase() === 'approved').length,
  };

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const filteredExpenses = activeFilter === 'All'
    ? expenses
    : expenses.filter(e => e.riskLevel?.toLowerCase() === activeFilter.toLowerCase());

  const getRiskStyles = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getRiskDot = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'rejected': return 'bg-red-500';
      case 'approved': return 'bg-green-500';
      case 'flagged': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const filterTabStyle = (tab: FilterTab) => {
    const base = 'px-4 py-1.5 rounded-full text-sm font-medium transition-all ';
    if (activeFilter === tab) {
      switch (tab) {
        case 'Flagged':  return base + 'bg-yellow-100 text-yellow-800 border border-yellow-300';
        case 'Rejected': return base + 'bg-red-100 text-red-800 border border-red-300';
        case 'Approved': return base + 'bg-green-100 text-green-800 border border-green-300';
        default:         return base + 'bg-blue-100 text-blue-800 border border-blue-300';
      }
    }
    return base + 'text-gray-500 hover:bg-gray-100 border border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finance Auditor Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">Review AI-audited expense claims sorted by risk level.</p>
            </div>
            <button
              onClick={fetchExpenses}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {/* Total Claims */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Claims</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{counts.All}</p>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </div>
          {/* Flagged */}
          <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-5">
            <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">⚠ Needs Review</p>
            <p className="text-3xl font-bold text-yellow-700 mt-1">{counts.Flagged}</p>
            <p className="text-xs text-gray-400 mt-1">Flagged claims</p>
          </div>
          {/* Rejected */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-5">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">✗ Rejected</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{counts.Rejected}</p>
            <p className="text-xs text-gray-400 mt-1">Policy violations</p>
          </div>
          {/* Total Amount */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">$ Total Spend</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{totalAmount.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1">Across all claims</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-sm text-gray-500 mr-1">Filter:</span>
          {(['All', 'Flagged', 'Rejected', 'Approved'] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={filterTabStyle(tab)}
            >
              {tab}
              <span className="ml-1.5 text-xs opacity-75">({counts[tab]})</span>
            </button>
          ))}
        </div>

        {/* Claims Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              {activeFilter === 'All' ? 'All Claims' : `${activeFilter} Claims`}
              <span className="ml-2 text-sm font-normal text-gray-400">({filteredExpenses.length})</span>
            </h2>
            <p className="text-xs text-gray-400">Click a row to view audit details</p>
          </div>

          {loading ? (
            <div className="p-8">
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 font-medium">No {activeFilter !== 'All' ? activeFilter.toLowerCase() + ' ' : ''}claims found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Merchant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Reasoning</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      onClick={() => navigate(`/audit/${expense.id}`)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      {/* Risk indicator */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${getRiskDot(expense.riskLevel)}`} />
                          <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${getRiskStyles(expense.riskLevel)}`}>
                            {expense.riskLevel || 'Flagged'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.employeeName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        {expense.merchantName || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                        {expense.currency || 'USD'} {Number(expense.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <p className="truncate">{expense.aiReasoning || '—'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition">
                          View →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default FinanceDashboard;