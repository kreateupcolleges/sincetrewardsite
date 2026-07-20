
import React from 'react';
import { SubjectMark } from '../types';
import { THEME } from '../theme';

interface Props {
  subjects: SubjectMark[];
  loading: boolean;
  error?: string;
  totalRP: number;
  title?: string;
}

const InternalMarks: React.FC<Props> = ({ subjects, loading, error, totalRP, title }) => {
  if (loading) {
    return <div className={`mt-8 ${THEME.card.base} ${THEME.card.body} text-center text-gray-500 animate-pulse`}>Loading marks details...</div>;
  }

  if (error) {
    return <div className={`mt-8 ${THEME.card.base} ${THEME.card.body} text-center ${THEME.status.bgError}`}>{error}</div>;
  }

  // Calculate totals - default to 0 if subjects is empty
  const totalInternal = subjects.reduce((sum, s) => sum + s.marks, 0);
  const totalMax = subjects.reduce((sum, s) => sum + s.max, 0);
  const totalSubRP = subjects.reduce((sum, s) => sum + s.rp, 0);

  // Helper to calculate balance - heuristic
  const allocatedRP = totalSubRP;
  const balanceRP = Math.max(0, totalRP - allocatedRP); 

  return (
    <div className={"mt-8 " + THEME.card.base + " " + THEME.card.body}>
      <h4 className={"text-lg font-semibold mb-4 " + THEME.primaryText}>{title || "Subject-wise Internal Marks"}</h4>
      
      {subjects.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-200 divide-y divide-gray-200 rounded-xl shadow-sm">
            <thead className={THEME.table.header}>
              <tr>
                <th className="px-4 py-3 text-left">S.No</th>
                <th className="px-4 py-3 text-left">Subject Code</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-center">Marks Allotted</th>
                <th className="px-4 py-3 text-center">Reward Points Allotted</th>
                <th className="px-4 py-3 text-center">Max Internal Mark</th>
              </tr>
            </thead>
            <tbody className="bg-white text-sm divide-y divide-gray-200">
              {subjects.map((sub, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium">{sub.code}</td>
                  <td className="px-4 py-3 text-gray-600">{sub.type}</td>
                  <td className="px-4 py-3 text-center">{sub.marks}</td>
                  <td className={"px-4 py-3 text-center font-medium " + THEME.status.success}>{sub.rp}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{sub.max}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-indigo-50 font-bold">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right">Totals:</td>
                <td className="px-4 py-3 text-center">{totalInternal}</td>
                <td className={"px-4 py-3 text-center " + THEME.status.success}>{totalSubRP}</td>
                <td className="px-4 py-3 text-center">{totalMax}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 mb-6">
           <p className="text-gray-500 dark:text-gray-400">No internal marks record found for this scope.</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700 dark:text-gray-200">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-500 dark:border-blue-700 rounded p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Reward Points</div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">{totalRP}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 dark:border-yellow-700 rounded p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Allocated RP</div>
          <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400 mt-1">{allocatedRP}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-500 dark:border-green-700 rounded p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Balance RP</div>
          <div className="text-xl font-bold text-green-700 dark:text-green-400 mt-1">{balanceRP}</div>
        </div>
        <div className="bg-indigo-800 dark:bg-indigo-900 border border-indigo-500 rounded p-4 text-white">
          <div className="text-xs text-indigo-200 uppercase font-semibold">Internal Mark (Obtained/Max)</div>
          <div className="text-xl font-bold mt-1">{totalInternal} / {totalMax}</div>
        </div>
      </div>
    </div>
  );
};

export default InternalMarks;
