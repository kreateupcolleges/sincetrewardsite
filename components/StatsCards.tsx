import React from 'react';
import { THEME } from '../theme';

interface Props {
  avg: number;
  yours: number;
  needed: number;
}

const StatsCards: React.FC<Props> = ({ avg, yours, needed }) => {
  return (
    <div className="flex flex-wrap gap-4 mt-6">
      <div className="flex-1 min-w-[220px] bg-white border border-indigo-200 shadow-md rounded-xl p-4 flex flex-col justify-center items-center transform transition hover:scale-105">
        <span className={THEME.textMuted + " text-sm font-medium"}>Average Reward Points</span>
        <span className={THEME.primaryText + " font-bold text-2xl mt-1"}>{avg.toFixed(2)}</span>
      </div>
      <div className="flex-1 min-w-[220px] bg-white border border-green-200 shadow-md rounded-xl p-4 flex flex-col justify-center items-center transform transition hover:scale-105">
        <span className={THEME.textMuted + " text-sm font-medium"}>Your Points</span>
        <span className={THEME.status.success + " font-bold text-2xl mt-1"}>{yours}</span>
      </div>
      <div className="flex-1 min-w-[220px] bg-white border border-red-200 shadow-md rounded-xl p-4 flex flex-col justify-center items-center transform transition hover:scale-105">
        <span className={THEME.textMuted + " text-sm font-medium"}>Required for Average</span>
        <span className={THEME.status.error + " font-bold text-2xl mt-1"}>{needed}</span>
      </div>
    </div>
  );
};

export default StatsCards;
