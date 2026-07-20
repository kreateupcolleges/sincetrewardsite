
import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, LayoutDashboard, UserCheck, Info} from 'lucide-react';
import SearchFilters from './components/SearchFilters';
import StatsCards from './components/StatsCards';
import StudentDetails from './components/StudentDetails';
import ActivityTable from './components/ActivityTable';
import InternalMarks from './components/InternalMarks';
import StudentAnalytics from './components/StudentAnalytics';
import { AdminPortal } from './components/AdminPortal';

import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { BATCHES, SYSTEM_HEADER_LABELS, INSTITUTION_CONFIG } from './config';
import { THEME } from './theme';
import { fetchSheetData, parseActivityHeader, normalizeLabel, parseInternalMarks } from './services/sheetService';
import { Student, ActivityRow, SearchParams, SubjectMark } from './types';

// Wrapper component to use Theme Hook
const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  // View Mode: 'student', 'admin', or 'elite'
  const [viewMode, setViewMode] = useState<'student' | 'admin'>('student');

  // State: Data
  const [students, setStudents] = useState<Student[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  
  // State: UI & Params
  const [params, setParams] = useState<SearchParams>({
    batchId: BATCHES[0].id,
    semesterId: '1',
    internalId: 'Consolidated',
    regNo: '',
    email: '',
    name: '',
    department: '',
    activity: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{msg: string, type: 'error' | 'success' | 'info'} | null>(null);

  // State: Results
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);
  const [stats, setStats] = useState({ avg: 0, yours: 0, needed: 0 });
  
  // State: Internal Marks
  const [internalSubjects, setInternalSubjects] = useState<SubjectMark[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState('');

  // State: Consolidated Marks (Semester Total)
  const [consolidatedSubjects, setConsolidatedSubjects] = useState<SubjectMark[]>([]);
  const [consolidatedTotalRP, setConsolidatedTotalRP] = useState(0);
  const [consolidatedLoading, setConsolidatedLoading] = useState(false);

  // 1. Fetch Master Sheet when Batch/Semester/Internal changes (Only needed for Student/Admin views)
  const loadMasterSheet = useCallback(async () => {
    // Skip loading master sheet data if in Elite mode (it handles its own data)
    

    setLoading(true);
    setStatusMsg({ msg: "Loading master data...", type: 'info' });
    
    try {
      const batch = BATCHES.find(b => b.id === params.batchId);
      if (!batch) throw new Error("Invalid batch selected");

      const semConfig = batch.semesters[params.semesterId];
      if (!semConfig) throw new Error("Invalid semester selected");

      let targetSheets: string[] = [];
      if (params.internalId === 'Consolidated') {
        targetSheets = semConfig.internals;
      } else {
        targetSheets = [params.internalId];
      }

      const mergedStudents = new Map<string, Student>();
      let mergedHeaders = new Set<string>();
      let successCount = 0;

      // Fetch all relevant sheets for the current scope
      await Promise.all(targetSheets.map(async (sheetKey) => {
        const sheetConfig = semConfig.rewardSheets[sheetKey];
        if (sheetConfig) {
          try {
            const { headers: h, rows: r } = await fetchSheetData(sheetConfig);
            successCount++;
            h.forEach(hdr => mergedHeaders.add(hdr));
            
            const regKey = h.find(k => /register|reg no|roll/i.test(k));
            if (regKey) {
              r.forEach(row => {
                const regNo = String(row[regKey]).toLowerCase().trim();
                if (!regNo) return;
                const existing = mergedStudents.get(regNo) || {};
                mergedStudents.set(regNo, { ...existing, ...row });
              });
            }
          } catch (err) {
            console.warn(`Failed to load sheet ${sheetKey}:`, err);
            // Don't throw, just continue. This allows other sheets to load.
          }
        }
      }));

      if (successCount === 0) {
        throw new Error("Failed to load any data sheets. Please check configuration.");
      }

      const finalHeaders = Array.from(mergedHeaders);
      const finalStudents = Array.from(mergedStudents.values());

      setHeaders(finalHeaders);
      setStudents(finalStudents);

      // Extract Departments
      const deptHdr = finalHeaders.find(c => normalizeLabel(c).includes('department'));
      if (deptHdr) {
        const depts = Array.from(new Set(finalStudents.map(s => String(s[deptHdr] || "").trim()).filter(Boolean))).sort();
        setDepartments(depts);
      }

      // Extract Activities
      const acts = finalHeaders.filter(c => !SYSTEM_HEADER_LABELS.includes(normalizeLabel(c)));
      setActivities(acts);

      setStatusMsg(null);
      
      // Clear results for Student View if search criteria aren't met
      if (viewMode === 'student' && !params.regNo) {
        setSelectedStudent(null);
        setActivityRows([]);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ msg: `Error: ${err.message}. Check internet or config.`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [params.batchId, params.semesterId, params.internalId, viewMode]);

  useEffect(() => {
    loadMasterSheet();
  }, [loadMasterSheet]);

  // 2. Search Logic
  const handleSearch = () => {
    const { regNo, email, name, department } = params;
    if (!regNo && !email && !name && !department) {
      alert("Please enter at least one search criteria.");
      return;
    }

    const regHeader = headers.find(h => /register|reg no|roll/i.test(h));
    const emailHeader = headers.find(h => /email/i.test(h));
    const nameHeader = headers.find(h => /name/i.test(h));
    const deptHeader = headers.find(h => /department/i.test(h));

    const found = students.filter(s => {
      let match = true;
      if (regNo && regHeader) match = match && String(s[regHeader]).toLowerCase() === regNo.toLowerCase().trim();
      if (email && emailHeader) match = match && String(s[emailHeader]).toLowerCase() === email.toLowerCase().trim();
      if (name && nameHeader) match = match && String(s[nameHeader]).toLowerCase().includes(name.toLowerCase().trim());
      if (department && deptHeader) match = match && String(s[deptHeader]) === department;
      return match;
    });

    if (found.length === 0) {
      alert("No records found.");
      setSelectedStudent(null);
      return;
    }

    const student = found[0]; 
    setSelectedStudent(student);
    processStudentData(student);
    
    // Trigger Internal Marks Load
    if (student && deptHeader && regHeader) {
      const sDept = String(student[deptHeader]);
      const sReg = String(student[regHeader]);
      
      if (params.internalId !== 'Consolidated') {
        loadInternalMarks(sDept, sReg);
      } else {
        setInternalSubjects([]);
        setInternalError('');
      }
      
      loadConsolidatedData(sDept, sReg);
    }
  };

  const processStudentData = (student: Student) => {
    const relevantHeaders = headers.filter(h => !SYSTEM_HEADER_LABELS.includes(normalizeLabel(h)));
    
    let total = 0;
    const rows: ActivityRow[] = [];

    relevantHeaders.forEach(h => {
      const val = Number(student[h]) || 0;
      if (val > 0 || params.activity === h) { 
        if (params.activity && params.activity !== h) return;
        
        total += val;
        const meta = parseActivityHeader(h);
        rows.push({
          ...meta as any,
          headerName: h,
          points: val
        });
      }
    });

    setActivityRows(rows);

    const grandTotal = students.reduce((acc, s) => {
      return acc + relevantHeaders.reduce((sum, h) => sum + (Number(s[h]) || 0), 0);
    }, 0);
    const avg = students.length ? grandTotal / students.length : 0;
    const needed = Math.max(0, Number(avg.toFixed(2)) - total);

    setStats({
      avg: avg,
      yours: total,
      needed: Number(needed.toFixed(2))
    });
  };

  const loadInternalMarks = async (dept: string, regNo: string) => {
    setInternalLoading(true);
    setInternalError('');
    setInternalSubjects([]);

    try {
      const batch = BATCHES.find(b => b.id === params.batchId);
      const semConfig = batch?.semesters[params.semesterId];
      
      const sheetConfig = semConfig?.internalMarksSheets[params.internalId]?.[dept];
      
      if (!sheetConfig) {
        setInternalError('No internal marks sheet configured for this department in this scope.');
        return;
      }

      const { headers: h, rows: r } = await fetchSheetData(sheetConfig);
      const regHeader = h.find(c => /register|reg no|roll/i.test(c));
      const studentRow = r.find(row => String(row[regHeader]).toLowerCase() === regNo.toLowerCase());
      
      if (!studentRow) {
        setInternalError(`No record found in ${params.internalId} sheet for ${regNo}.`);
        return;
      }

      const { subjects } = parseInternalMarks(h, studentRow, dept, semConfig.subjectConfig);
      setInternalSubjects(subjects);

    } catch (err: any) {
      console.error(err);
      setInternalError("Failed to load internal assessment details.");
    } finally {
      setInternalLoading(false);
    }
  };

  const loadConsolidatedData = async (dept: string, regNo: string) => {
    setConsolidatedLoading(true);
    setConsolidatedSubjects([]);
    setConsolidatedTotalRP(0);

    try {
      const batch = BATCHES.find(b => b.id === params.batchId);
      if (!batch) return;

      const semConfig = batch.semesters[params.semesterId];
      if (!semConfig) return;

      const internalIds = semConfig.internals; 
      let grandTotalRP = 0;
      const mergedSubjects = new Map<string, SubjectMark>();

      await Promise.all(internalIds.map(async (id) => {
        try {
          const rSheet = semConfig.rewardSheets[id];
          if(rSheet) {
              const { headers: rh, rows: rr } = await fetchSheetData(rSheet);
              const regH = rh.find(h => /register|reg no|roll/i.test(h));
              if (regH) {
                  const rRow = rr.find(r => String(r[regH]).toLowerCase() === regNo.toLowerCase());
                  if (rRow) {
                      const relevantHeaders = rh.filter(h => !SYSTEM_HEADER_LABELS.includes(normalizeLabel(h)));
                      const currentRP = relevantHeaders.reduce((sum, h) => sum + (Number(rRow[h]) || 0), 0);
                      grandTotalRP += currentRP;
                  }
              }
          }
          
          const iConfig = semConfig.internalMarksSheets[id]?.[dept];
          if (iConfig) {
              const { headers: ih, rows: ir } = await fetchSheetData(iConfig);
              const regH = ih.find(h => /register|reg no|roll/i.test(h));
              if (regH) {
                const iRow = ir.find(r => String(r[regH]).toLowerCase() === regNo.toLowerCase());
                if (iRow) {
                    const res = parseInternalMarks(ih, iRow, dept, semConfig.subjectConfig);
                    res.subjects.forEach(sub => {
                      const existing = mergedSubjects.get(sub.code);
                      if (existing) {
                        existing.marks += sub.marks;
                        existing.rp += sub.rp;
                        existing.max += sub.max;
                      } else {
                        mergedSubjects.set(sub.code, { ...sub });
                      }
                    });
                }
              }
          }
        } catch (e) { 
          // Ignore individual sheet errors during consolidated load
        }
      }));

      setConsolidatedTotalRP(grandTotalRP);
      setConsolidatedSubjects(Array.from(mergedSubjects.values()));

    } catch (err) {
      console.error("Consolidated Load Error", err);
    } finally {
      setConsolidatedLoading(false);
    }
  };

  const handleParamChange = (key: string, val: string) => {
    setParams(prev => ({ ...prev, [key]: val }));
  };

  const currentBatch = BATCHES.find(b => b.id === params.batchId);
  const currentSemesterLabel = currentBatch?.semesters[params.semesterId]?.label || "Current Semester";

  return (
    <div className={"min-h-screen pb-10 transition-colors duration-200 " + THEME.background}>
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between px-4 py-4 gap-4">
          <div className="flex items-center space-x-3">
            <img 
              src={INSTITUTION_CONFIG.logoUrl} 
              alt="Institution Logo" 
              className="h-10 w-10 md:h-12 md:w-12 object-contain" 
              referrerPolicy="no-referrer"
            />
            <h1 className="text-xl md:text-2xl font-bold text-indigo-700 dark:text-indigo-400 truncate">{INSTITUTION_CONFIG.name}</h1>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('student')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
                  viewMode === 'student' ? 'bg-white dark:bg-gray-600 shadow text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <UserCheck size={14} className="md:w-4 md:h-4" />
                <span>Student</span>
              </button>
              
              <button
                onClick={() => setViewMode('admin')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
                  viewMode === 'admin' ? 'bg-white dark:bg-gray-600 shadow text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <LayoutDashboard size={14} className="md:w-4 md:h-4" />
                <span>Admin</span>
              </button>
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto mt-6 px-4 md:px-6">
        {viewMode === 'admin' && (
          <AdminPortal 
            students={students} headers={headers} batchLabel={currentBatch?.label || ""}
            currentBatchId={params.batchId} currentInternalId={params.internalId}
            onParamChange={handleParamChange}
          />
        )}


        {viewMode === 'student' && (
          <>
            {statusMsg && (
              <div className={`mb-6 rounded-lg p-4 border flex items-center gap-3 ${
                statusMsg.type === 'error' ? THEME.status.bgError : THEME.status.bgInfo
              }`}>
                <Info size={20} />
                <span className="text-sm">{statusMsg.msg}</span>
              </div>
            )}

            <SearchFilters
              batches={BATCHES} selectedBatch={params.batchId} selectedSemester={params.semesterId}
              selectedInternal={params.internalId} departments={departments} activities={activities}
              onParamChange={handleParamChange} onSearch={handleSearch} loading={loading}
              values={{ regNo: params.regNo, email: params.email, name: params.name, department: params.department, activity: params.activity }}
            />

            {selectedStudent && (
              <div className="animate-fade-in-up space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-baseline gap-2">
                   <h2 className={`text-2xl font-bold ${THEME.primaryText}`}>Performance Dashboard</h2>
                   <div className="text-xs md:text-sm font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                      Viewing: {params.internalId === 'Consolidated' ? `${currentSemesterLabel} Total` : `${params.internalId} Result`}
                   </div>
                </div>
                
                <StatsCards {...stats} />
                
                <StudentDetails student={selectedStudent} batchLabel={currentBatch?.label || ""} />

                <StudentAnalytics 
                  activityRows={activityRows}
                  internalSubjects={params.internalId === 'Consolidated' ? consolidatedSubjects : internalSubjects}
                />

                <ActivityTable rows={activityRows} />

                {params.internalId !== 'Consolidated' && (
                  <InternalMarks 
                    title={`Detailed Internal Assessment: ${params.internalId}`}
                    subjects={internalSubjects} loading={internalLoading} error={internalError} totalRP={stats.yours}
                  />
                )}

                <InternalMarks 
                  title={`Semester Consolidated Result (${currentSemesterLabel})`}
                  subjects={consolidatedSubjects} loading={consolidatedLoading} totalRP={consolidatedTotalRP}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  // <ThemeProvider>
  //   <AppContent />
  // </ThemeProvider>
   <AppContent />
);

export default App;
