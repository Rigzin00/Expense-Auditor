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
    <div className="w-full max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-black text-white p-1.5 rounded-md flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Finance Auditor</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-medium text-gray-900 font-serif tracking-tight leading-[1.1]">
              The finance ledger,<br/>
              <span className="italic text-gray-500 font-normal">always audited.</span>
            </h1>
            <p className="text-gray-500 mt-6 text-sm max-w-lg">
              Review AI-audited expense claims, track regional progress, and manage policy violations — all in one clean dashboard.
            </p>
          </div>
          
          <div className="sm:w-64 max-w-full bg-white border border-gray-100 rounded-2xl overflow-hidden self-stretch sm:self-auto flex flex-col justify-center divide-y divide-gray-100">
             <div className="p-4 flex items-baseline justify-between gap-4">
               <div>
                 <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Total Spend</p>
                 <p className="text-2xl font-serif text-gray-900">${totalAmount.toFixed(0)}</p>
               </div>
             </div>
             <div className="p-4 flex items-baseline justify-between gap-4">
               <div>
                 <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Flagged / Rejected</p>
                 <p className="text-xl font-serif text-gray-900">{counts.Flagged} <span className="text-gray-300 font-sans text-sm mx-1">/</span> {counts.Rejected}</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      <main className="w-full">


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