import React from 'react';
import { Student } from '../types';
import { THEME } from '../theme';

interface Props {
  student: Student;
  batchLabel: string;
}

const StudentDetails: React.FC<Props> = ({ student, batchLabel }) => {
  // Helper to find value case-insensitively to handle sheet variations
  const findValue = (search: string) => {
    const key = Object.keys(student).find(k => k.toLowerCase().includes(search.toLowerCase()));
    return key ? student[key] : '';
  };

  return (
    <div className={`mt-8 mb-8 ${THEME.card.base} overflow-hidden`}>
      <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
        <h3 className={`text-lg font-bold ${THEME.primaryText}`}>Student Details</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="font-bold text-gray-900 min-w-[100px]">Name:</span>
            <span className="text-gray-700 uppercase font-medium">{findValue('name')}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="font-bold text-gray-900 min-w-[100px]">Register No:</span>
            <span className="text-gray-700 uppercase font-medium">{findValue('register') || findValue('reg no') || findValue('roll')}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="font-bold text-gray-900 min-w-[100px]">Email:</span>
            <span className="text-gray-700 font-medium">{findValue('email')}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="font-bold text-gray-900 min-w-[100px]">Department:</span>
            <span className="text-gray-700 font-medium">{findValue('department')}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 md:col-span-2">
            <span className="font-bold text-gray-900 min-w-[100px]">Year:</span>
            <span className="text-gray-700 font-medium">{batchLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
