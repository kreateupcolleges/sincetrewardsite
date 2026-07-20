import React from 'react';
import { Search, Calendar, Layers } from 'lucide-react';
import { BatchConfig } from '../types';
import { THEME } from '../theme';

interface Props {
  batches: BatchConfig[];
  selectedBatch: string;
  selectedSemester: string;
  selectedInternal: string;
  departments: string[];
  activities: string[];
  onParamChange: (key: string, value: string) => void;
  onSearch: () => void;
  loading: boolean;
  values: { regNo: string; email: string; name: string; department: string; activity: string };
}

const SearchFilters: React.FC<Props> = ({
  batches,
  selectedBatch,
  selectedSemester,
  selectedInternal,
  departments,
  activities,
  onParamChange,
  onSearch,
  loading,
  values
}) => {
  const currentBatch = batches.find(b => b.id === selectedBatch);
  const semesters = currentBatch ? Object.keys(currentBatch.semesters) : [];
  const currentSemConfig = currentBatch?.semesters[selectedSemester];
  const internals = currentSemConfig ? currentSemConfig.internals : [];

  return (
    <div className={THEME.card.base + " " + THEME.card.body + " mb-8"}>
      <h2 className={"text-lg font-semibold flex items-center space-x-2 mb-6 " + THEME.primaryText}>
        <Search className="w-5 h-5" />
        <span>Search Student</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {/* Batch Selection */}
        <div>
          <label className={THEME.input.label}>Academic Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => onParamChange('batchId', e.target.value)}
            className={THEME.input.base}
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </div>

        {/* Semester Selection */}
        <div>
          <label className={THEME.input.label}>Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => onParamChange('semesterId', e.target.value)}
            className={THEME.input.base}
          >
            {semesters.map(semId => (
              <option key={semId} value={semId}>{currentBatch?.semesters[semId].label}</option>
            ))}
          </select>
        </div>

        {/* Scope (Internal / Consolidated) Selection */}
        <div>
          <label className={THEME.input.label}>Data Scope</label>
          <select
            value={selectedInternal}
            onChange={(e) => onParamChange('internalId', e.target.value)}
            className={THEME.input.base + " font-bold text-indigo-600 dark:text-indigo-400"}
          >
            <option value="Consolidated">Consolidated (Semester)</option>
            {internals.map(int => (
              <option key={int} value={int}>{int}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={THEME.input.label}>
            Register No <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex: 78912345678"
            value={values.regNo}
            onChange={(e) => onParamChange('regNo', e.target.value)}
            className={THEME.input.base}
          />
        </div>

        <div>
          <label className={THEME.input.label}>Email</label>
          <input
            type="text"
            placeholder="Ex: name@yourcollege.ab"
            value={values.email}
            onChange={(e) => onParamChange('email', e.target.value)}
            className={THEME.input.base}
          />
        </div>

        <div>
          <label className={THEME.input.label}>Name</label>
          <input
            type="text"
            placeholder="Ex: Arun"
            value={values.name}
            onChange={(e) => onParamChange('name', e.target.value)}
            className={THEME.input.base}
          />
        </div>

        <div>
          <label className={THEME.input.label}>
            Department <span className="text-red-500">*</span>
          </label>
          <select
            value={values.department}
            onChange={(e) => onParamChange('department', e.target.value)}
            disabled={departments.length === 0}
            className={THEME.input.base}
          >
            <option value="">Select Department</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className={THEME.input.label}>Activity Filter</label>
          <select
            value={values.activity}
            onChange={(e) => onParamChange('activity', e.target.value)}
            disabled={activities.length === 0}
            className={THEME.input.base}
          >
            <option value="">All Activities</option>
            {activities.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={onSearch}
          disabled={loading}
          className={THEME.button.primary}
        >
          {loading ? (
             <span>Loading...</span>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span className="font-bold">Search Details</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
