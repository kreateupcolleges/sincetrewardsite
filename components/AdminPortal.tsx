
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Lock, Download, BarChart2, Users, AlertTriangle, 
  Search, Activity, Filter, ArrowLeft, Calendar, Award, 
  CheckSquare, X, User, Layers, List, TrendingUp, PieChart as PieIcon,
  Target, Zap, BookOpen, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, LabelList, ComposedChart
} from 'recharts';
import { THEME } from '../theme';
import { Student, ActivityRow, SubjectMark } from '../types';
import { SYSTEM_HEADER_LABELS, CATEGORY_CODES, BATCHES, ADMIN_AUTH_CONFIG } from '../config';
import { parseActivityHeader, normalizeLabel, parseInternalMarks, fetchSheetData } from '../services/sheetService';

// Reusing Student Components
import StatsCards from './StatsCards';
import StudentDetails from './StudentDetails';
import ActivityTable from './ActivityTable';
import InternalMarks from './InternalMarks';
import StudentAnalytics from './StudentAnalytics';

interface Props {
  students: Student[]; // Initial props from App
  headers: string[];
  batchLabel: string;
  currentBatchId?: string;
  currentInternalId?: string;
  onParamChange: (key: string, value: string) => void;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export const AdminPortal: React.FC<Props> = ({ 
  students: initialStudents, headers: initialHeaders, batchLabel, currentBatchId, onParamChange 
}) => {
  // --- STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [adminUser, setAdminUser] = useState<{name: string, dept: string} | null>(null);

  // Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'student-dashboard' | 'activities' | 'internals'>('overview');
  
  // Strategic Filters
  const [selectedBatchId, setSelectedBatchId] = useState<string>(currentBatchId || BATCHES[0].id);
  const [currentSemester, setCurrentSemester] = useState<string>("1");
  const [dataScope, setDataScope] = useState<string>("Consolidated"); 
  const [selectedDept, setSelectedDept] = useState<string>("All");
  
  // Data State
  const [adminStudents, setAdminStudents] = useState<Student[]>([]);
  const [adminHeaders, setAdminHeaders] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Overview State
  const [customRange, setCustomRange] = useState({ min: 0, max: 50 });

  // Student Dashboard State
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [studentFullInternals, setStudentFullInternals] = useState<Record<string, SubjectMark[]>>({});
  const [studentConsolidated, setStudentConsolidated] = useState<SubjectMark[]>([]);
  const [studentActivityHistory, setStudentActivityHistory] = useState<ActivityRow[]>([]); // All activities
  const [studentViewScope, setStudentViewScope] = useState<string>("Consolidated");
  const [isLoadingStudentData, setIsLoadingStudentData] = useState(false);
  const [viewingStudentStats, setViewingStudentStats] = useState({ avg: 0, yours: 0, needed: 0 });

  // Activity Analysis State
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>("All");
  const [activityDateFilter, setActivityDateFilter] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [activityModal, setActivityModal] = useState<{title: string, data: any[]} | null>(null);

  // Internal Analytics State
  const [internalAnalyticsDept, setInternalAnalyticsDept] = useState<string>("");
  const [deptInternalStats, setDeptInternalStats] = useState<any[]>([]);
  const [allStudentMarksList, setAllStudentMarksList] = useState<any[]>([]);
  const [loadingInternalStats, setLoadingInternalStats] = useState(false);
  const [modalList, setModalList] = useState<{title: string, students: any[]} | null>(null);

  // --- DATA FETCHING ENGINE ---
  useEffect(() => {
    const loadAdminData = async () => {
      setDataLoading(true);
      setAdminStudents([]);
      setAdminHeaders([]);

      try {
        const batch = BATCHES.find(b => b.id === selectedBatchId);
        if (!batch) return;

        const semConfig = batch.semesters[currentSemester];
        if (!semConfig) return;

        let targetSheets: string[] = [];
        if (dataScope === 'Consolidated') {
          targetSheets = semConfig.internals;
        } else {
          targetSheets = [dataScope];
        }

        const mergedStudents = new Map<string, Student>();
        let mergedHeaders = new Set<string>();

        await Promise.all(targetSheets.map(async (sheetKey) => {
           const sheetConfig = semConfig.rewardSheets[sheetKey];
           if (sheetConfig) {
             try {
                const { headers: h, rows: r } = await fetchSheetData(sheetConfig);
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
                console.warn(`Admin Load: Failed to fetch ${sheetKey}`, err);
             }
           }
        }));

        setAdminStudents(Array.from(mergedStudents.values()));
        setAdminHeaders(Array.from(mergedHeaders));
      } catch (e) {
        console.error("Admin Data Load Error", e);
      } finally {
        setDataLoading(false);
      }
    };

    if (isLoggedIn) loadAdminData();
  }, [selectedBatchId, currentSemester, dataScope, isLoggedIn]);


  // --- IDENTIFY HEADERS ---
  const headerKeys = useMemo(() => {
    const normalize = (h: string) => h.toLowerCase().trim();
    return {
      reg: adminHeaders.find(h => /reg/i.test(h) || normalize(h).includes('register') || normalize(h).includes('roll')) || '',
      name: adminHeaders.find(h => /name/i.test(h)) || '',
      dept: adminHeaders.find(h => /dept/i.test(h) || normalize(h).includes('department')) || '',
      email: adminHeaders.find(h => /email/i.test(h)) || '',
    };
  }, [adminHeaders]);

  // --- DERIVED LISTS ---
  const departments = useMemo(() => {
    if (!headerKeys.dept) return [];
    const depts = new Set(adminStudents.map(s => String(s[headerKeys.dept] || "").trim()).filter(Boolean));
    return Array.from(depts).sort();
  }, [adminStudents, headerKeys]);

  useEffect(() => {
    if (!internalAnalyticsDept && departments.length > 0) setInternalAnalyticsDept(departments[0]);
  }, [departments]);

  const filteredStudents = useMemo(() => {
    if (selectedDept === "All") return adminStudents;
    return adminStudents.filter(s => String(s[headerKeys.dept] || '').trim() === selectedDept);
  }, [adminStudents, selectedDept, headerKeys]);

  // --- METRICS ENGINE (Overview) ---
  const metrics = useMemo(() => {
    if (!filteredStudents.length) return null;
    const relevantHdrs = adminHeaders.filter(h => !SYSTEM_HEADER_LABELS.includes(normalizeLabel(h)));
    
    let globalTotal = 0;
    const pointValues: number[] = [];
    const categoryCountMap: Record<string, number> = {};
    const lowPointStudents: Student[] = []; 
    const studentPointsData: { student: Student, total: number }[] = [];
    
    CATEGORY_CODES.forEach(c => categoryCountMap[c] = 0);
    relevantHdrs.forEach(h => {
       const meta = parseActivityHeader(h);
       const cat = meta.category || 'OT';
       if (CATEGORY_CODES.includes(cat)) categoryCountMap[cat]++;
    });

    filteredStudents.forEach(s => {
      let sTotal = 0;
      relevantHdrs.forEach(h => {
        const val = Number(s[h]) || 0;
        if (val > 0) sTotal += val;
      });
      globalTotal += sTotal;
      pointValues.push(sTotal);
      studentPointsData.push({ student: s, total: sTotal });
      if (sTotal <= 100) lowPointStudents.push(s);
    });

    // Cleaner Bins for Overview
    const step = 100; // Larger step for cleaner graph
    const maxPoints = Math.max(...pointValues, 200);
    const distributionMap: Record<string, number> = {};
    const limit = Math.ceil(maxPoints / step);
    
    for(let i=0; i < limit; i++) {
        distributionMap[`${i*step}-${(i+1)*step}`] = 0;
    }

    pointValues.forEach(val => {
       const binIdx = Math.floor(val / step);
       const label = `${binIdx * step}-${(binIdx + 1) * step}`;
       if (distributionMap[label] !== undefined) {
           distributionMap[label]++;
       } else {
           // Fallback for edge cases
           const lastKey = Object.keys(distributionMap).pop();
           if(lastKey) distributionMap[lastKey]++;
       }
    });

    return {
      globalTotal,
      avgPoints: Math.round(globalTotal / filteredStudents.length),
      graphData: Object.keys(distributionMap).map(k => ({ range: k, count: distributionMap[k], sorter: parseInt(k.split('-')[0]) })).sort((a,b) => a.sorter - b.sorter),
      categoryActivityStats: Object.keys(categoryCountMap).map(k => ({ name: k, value: categoryCountMap[k] })).filter(c => c.value > 0),
      lowPointStudents,
      studentPointsData,
      totalStudents: filteredStudents.length,
      activityCount: relevantHdrs.length
    };
  }, [filteredStudents, adminHeaders]);

  // --- ACTIVITY ANALYTICS DATA PREP ---
  const detailedActivityStats = useMemo(() => {
    const relevantHdrs = adminHeaders.filter(h => !SYSTEM_HEADER_LABELS.includes(normalizeLabel(h)));
    
    // Helper to parse DD.MM.YYYY to Date
    const parseDateStr = (dStr: string) => {
        if (!dStr) return null;
        // Assume format is like 12.06.2024 or 12/06/2024
        const parts = dStr.replace(/-/g, '.').replace(/\//g, '.').split('.');
        if (parts.length === 3) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        return null;
    };

    const stats = relevantHdrs.map(header => {
       const meta = parseActivityHeader(header);
       
       // Category Filter
       if (activityCategoryFilter !== 'All' && meta.category !== activityCategoryFilter) return null;

       // Date Filter
       if (activityDateFilter.start || activityDateFilter.end) {
           const actDate = parseDateStr(meta.dateStart);
           if (actDate) {
               if (activityDateFilter.start && actDate < new Date(activityDateFilter.start)) return null;
               if (activityDateFilter.end && actDate > new Date(activityDateFilter.end)) return null;
           } else {
               // If activity has no parsed date, exclude if strict filtering? 
               // Or include? Let's exclude if we are filtering by date.
               if (activityDateFilter.start || activityDateFilter.end) return null;
           }
       }

       const scores = filteredStudents
          .map(s => Number(s[header]) || 0)
          .filter(val => val > 0);
       
       const count = scores.length;
       const sum = scores.reduce((a, b) => a + b, 0);
       const avg = count > 0 ? (sum / count) : 0;
       const min = count > 0 ? Math.min(...scores) : 0;
       const max = count > 0 ? Math.max(...scores) : 0;

       return {
         header,
         displayName: meta.displayName,
         dateStart: meta.dateStart || '-',
         dateEnd: meta.dateEnd || '-',
         category: meta.category,
         count,
         avg: Number(avg.toFixed(1)),
         min,
         max,
         maxPoints: meta.maxPoints || max
       };
    }).filter(Boolean) as any[];

    return stats.sort((a,b) => b.count - a.count);
  }, [adminHeaders, filteredStudents, activityCategoryFilter, activityDateFilter]);
  
  const activitySummary = useMemo(() => {
      const totalMaxPoints = detailedActivityStats.reduce((acc, curr) => acc + (curr.maxPoints || 0), 0);
      const categoryCounts: Record<string, number> = {};
      detailedActivityStats.forEach(s => {
          categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
      });
      return { totalMaxPoints, categoryCounts };
  }, [detailedActivityStats]);


  // --- INTERNAL ANALYTICS FETCH ---
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedBatchId) return;
      setLoadingInternalStats(true);
      setAllStudentMarksList([]);
      try {
        const batch = BATCHES.find(b => b.id === selectedBatchId);
        const semConfig = batch?.semesters[currentSemester];
        const targetIPs = dataScope === 'Consolidated' ? (semConfig?.internals || []) : [dataScope];
        
        const targetDept = (internalAnalyticsDept === 'All' && departments.length > 0) ? departments[0] : internalAnalyticsDept;

        const subjectMap: Record<string, { 
           code: string, 
           maxPossible: number, 
           students: Record<string, {reg: string, name: string, email: string, dept: string, mark: number}> 
        }> = {};

        // To build the comprehensive student list
        const studentMasterMap: Record<string, any> = {};

        if (targetDept) {
            for (const ipId of targetIPs) {
              const sheetConfig = semConfig?.internalMarksSheets[ipId]?.[targetDept];
              if (sheetConfig) {
                try {
                    const { headers: iHeaders, rows: iRows } = await fetchSheetData(sheetConfig);
                    
                    // Detect Subjects using semester config
                    const confSubjects = semConfig?.subjectConfig.departments[targetDept] || [];
                    const subjectColumns: string[] = [];
                    
                    if (confSubjects.length > 0) {
                       confSubjects.forEach(c => {
                         const h = iHeaders.find(hdr => normalizeLabel(hdr).includes(normalizeLabel(c.code)));
                         if(h) subjectColumns.push(h);
                       });
                    } else {
                       iHeaders.forEach(h => {
                         const n = normalizeLabel(h);
                         if (/[a-z]/.test(n) && /\d/.test(n) && !n.includes('total') && !n.endsWith('_rp')) {
                           subjectColumns.push(h);
                         }
                       });
                    }

                    const iRegH = iHeaders.find(h => /reg/i.test(h));
                    const iNameH = iHeaders.find(h => /name/i.test(h));
                    const iEmailH = iHeaders.find(h => /email/i.test(h));

                    if (iRegH) {
                        iRows.forEach(row => {
                            const reg = String(row[iRegH]).toLowerCase().trim();
                            if (!reg) return;
                            if (!studentMasterMap[reg]) {
                                studentMasterMap[reg] = {
                                    RegNo: row[iRegH],
                                    Name: iNameH ? row[iNameH] : '',
                                    Email: iEmailH ? row[iEmailH] : '',
                                    Department: targetDept,
                                    Total: 0,
                                    subjects: {}
                                };
                            }
                            // Update Email if found later
                            if (!studentMasterMap[reg].Email && iEmailH && row[iEmailH]) {
                                studentMasterMap[reg].Email = row[iEmailH];
                            }
                        });
                    }

                    subjectColumns.forEach(subHeader => {
                       let standardCode = subHeader;
                       const configMatch = confSubjects.find(c => normalizeLabel(subHeader).includes(normalizeLabel(c.code)));
                       if (configMatch) standardCode = configMatch.code;

                       const maxPossible = configMatch ? configMatch.maxMarks : 15;
                       
                       if (!subjectMap[standardCode]) {
                          subjectMap[standardCode] = { code: standardCode, maxPossible, students: {} };
                       }

                       iRows.forEach(row => {
                         if (!iRegH) return;
                         const reg = String(row[iRegH]).toLowerCase().trim();
                         const mark = Number(row[subHeader]) || 0;
                         
                         if (reg && studentMasterMap[reg]) {
                            // Aggregate for Subject Map
                            if (subjectMap[standardCode].students[reg]) {
                                 if (dataScope === 'Consolidated') subjectMap[standardCode].students[reg].mark += mark;
                                 else subjectMap[standardCode].students[reg].mark = mark;
                            } else {
                               subjectMap[standardCode].students[reg] = {
                                  reg: String(row[iRegH]),
                                  name: iNameH ? String(row[iNameH]) : '',
                                  email: iEmailH ? String(row[iEmailH]) : '',
                                  dept: targetDept,
                                  mark: mark
                               };
                            }

                            // Aggregate for Master Map
                            if (!studentMasterMap[reg].subjects[standardCode]) studentMasterMap[reg].subjects[standardCode] = 0;
                            if (dataScope === 'Consolidated') studentMasterMap[reg].subjects[standardCode] += mark;
                            else studentMasterMap[reg].subjects[standardCode] = mark;
                         }
                       });
                    });
                } catch(e) {
                    console.warn(`Internal Stats: Failed to fetch ${ipId} - ${targetDept}`, e);
                }
              }
            }
        }

        // Final Aggregation for KPI
        const finalStats = Object.keys(subjectMap).map(subKey => {
           const subData = subjectMap[subKey];
           const studentList = Object.values(subData.students);
           const effectiveMax = dataScope === 'Consolidated' ? subData.maxPossible * targetIPs.length : subData.maxPossible;

           const totalMarks = studentList.reduce((acc, s) => acc + s.mark, 0);
           const totalStudents = studentList.length;

           const avg = totalStudents > 0 ? (totalMarks / totalStudents).toFixed(1) : 0;
           
           const listMax = studentList.filter(s => s.mark >= effectiveMax).sort((a,b) => b.mark - a.mark);
           const listMid = studentList.filter(s => s.mark >= (effectiveMax * 0.6) && s.mark < effectiveMax).sort((a,b) => b.mark - a.mark);
           const listFail = studentList.filter(s => s.mark < (effectiveMax * 0.5)).sort((a,b) => a.mark - b.mark);

           return {
             ip: dataScope,
             subject: subKey,
             maxPossible: effectiveMax,
             totalStudents,
             countMax: listMax.length,
             countMid: listMid.length,
             countFail: listFail.length,
             listMax,
             listMid,
             listFail,
             avg: Number(avg)
           };
        });

        // Final Aggregation for Master List
        const finalList = Object.values(studentMasterMap).map((s: any) => {
             let total = 0;
             Object.values(s.subjects).forEach((m: any) => total += Number(m));
             return { ...s, ...s.subjects, Total: total };
        }).sort((a, b) => b.Total - a.Total);

        setDeptInternalStats(finalStats);
        setAllStudentMarksList(finalList);

      } catch (e) {
        console.error("Internal Stats Error", e);
      } finally {
        setLoadingInternalStats(false);
      }
    };

    if (activeTab === 'internals') {
      fetchStats();
    }
  }, [internalAnalyticsDept, selectedBatchId, currentSemester, dataScope, activeTab, departments]);

  // --- STUDENT DASHBOARD LOGIC ---
  const handleStudentSearch = () => {
    if (!studentSearchTerm) return;
    const term = studentSearchTerm.toLowerCase();
    const match = adminStudents.find(s => {
      return String(s[headerKeys.reg]).toLowerCase().includes(term) || String(s[headerKeys.name]).toLowerCase().includes(term);
    });
    if (match) loadStudentFullProfile(match);
    else alert("Student not found!");
  };

  const loadStudentFullProfile = async (student: Student) => {
    setViewingStudent(student);
    setIsLoadingStudentData(true);
    setStudentFullInternals({});
    setStudentConsolidated([]);
    setStudentActivityHistory([]);
    setStudentViewScope('Consolidated'); // Default
    
    try {
      const batchConfig = BATCHES.find(b => b.id === selectedBatchId);
      if (!batchConfig) throw new Error("Batch config not found");
      
      const dept = String(student[headerKeys.dept]);
      const semConfig = batchConfig.semesters[currentSemester];
      const internalIds = semConfig ? semConfig.internals : []; // Updated logic
      
      const internalDataMap: Record<string, SubjectMark[]> = {};
      const consolidatedMap = new Map<string, SubjectMark>();
      const allActivities: ActivityRow[] = [];

      // 1. Fetch Internal Marks & Activity Data from all Reward Sheets in Semester
      await Promise.all(internalIds.map(async (ipId) => {
         // Reward Points & Activity parsing
         const rSheet = semConfig.rewardSheets[ipId];
         if(rSheet) {
            try {
              const { headers: rh, rows: rr } = await fetchSheetData(rSheet);
              const regH = rh.find(h => /reg/i.test(h));
              if(regH) {
                 const rrRow = rr.find(r => String(r[regH]).toLowerCase() === String(student[headerKeys.reg]).toLowerCase());
                 if(rrRow) {
                    // Extract activities
                    rh.forEach(h => {
                        if (!SYSTEM_HEADER_LABELS.includes(normalizeLabel(h))) {
                            const val = Number(rrRow[h]) || 0;
                            if (val > 0) {
                                const meta = parseActivityHeader(h);
                                allActivities.push({ ...meta as any, headerName: h, points: val, ip: ipId });
                            }
                        }
                    });
                 }
              }
            } catch(e) {}
         }

         // Internal Marks Parsing
         const sheetConfig = semConfig.internalMarksSheets[ipId]?.[dept];
         if (sheetConfig) {
            try {
               const { headers: iHeaders, rows: iRows } = await fetchSheetData(sheetConfig);
               const regH = iHeaders.find(h => /reg/i.test(h));
               if (regH) {
                  const row = iRows.find(r => String(r[regH]).toLowerCase().trim() === String(student[headerKeys.reg]).toLowerCase().trim());
                  if (row) {
                     const { subjects } = parseInternalMarks(iHeaders, row, dept, semConfig.subjectConfig);
                     internalDataMap[ipId] = subjects;
                     subjects.forEach(sub => {
                       const existing = consolidatedMap.get(sub.code);
                       if (existing) {
                         existing.marks += sub.marks;
                         existing.rp += sub.rp;
                         existing.max += sub.max;
                       } else {
                         consolidatedMap.set(sub.code, { ...sub });
                       }
                     });
                  }
               }
            } catch (e) { }
         }
      }));

      // Set Student Stats (Calculated on the fly from ALL loaded data for consistency)
      const totalPoints = allActivities.reduce((acc, curr) => acc + curr.points, 0);
      
      // Need global avg for context? Use Admin Context metrics if available, else 0
      setViewingStudentStats({
        avg: metrics?.avgPoints || 0,
        yours: totalPoints,
        needed: Math.max(0, (metrics?.avgPoints || 0) - totalPoints),
      });

      setStudentFullInternals(internalDataMap);
      setStudentConsolidated(Array.from(consolidatedMap.values()));
      setStudentActivityHistory(allActivities);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setIsLoadingStudentData(false);
    }
  };


  // --- HELPERS ---
  const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const hdrs = Object.keys(data[0]);
    let csv = hdrs.join(",") + "\n";
    data.forEach(row => {
      csv += hdrs.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setVerifying(true);

    try {
        const { headers, rows } = await fetchSheetData(ADMIN_AUTH_CONFIG);
        
        // Dynamic column matching (case-insensitive)
        const emailKey = headers.find(h => /email/i.test(h));
        const passKey = headers.find(h => /pass/i.test(h));
        const nameKey = headers.find(h => /name/i.test(h));
        const deptKey = headers.find(h => /dept/i.test(h) || /department/i.test(h));

        if (!emailKey || !passKey) {
            throw new Error("Invalid Admin Database Structure. Please check column names.");
        }

        const foundUser = rows.find(r => 
            String(r[emailKey]).trim().toLowerCase() === email.trim().toLowerCase() &&
            String(r[passKey]).trim() === pass.trim()
        );

        if (foundUser) {
            setIsLoggedIn(true);
            setAdminUser({
                name: nameKey ? String(foundUser[nameKey]) : "Admin",
                dept: deptKey ? String(foundUser[deptKey]) : "Administration"
            });
        } else {
            setLoginError("Invalid Email Address or Password");
        }

    } catch (err: any) {
        console.error(err);
        setLoginError("Authentication Failed: Unable to verify credentials. Please check your internet connection.");
    } finally {
        setVerifying(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
        <div className={`${THEME.card.base} w-full max-w-md overflow-hidden`}>
          <div className="bg-indigo-900 px-6 py-8 text-center">
            <div className="inline-flex p-3 bg-indigo-800 rounded-full mb-3 shadow-inner">
               <Lock className="w-8 h-8 text-indigo-100" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">Admin Access</h2>
            <p className="text-indigo-200 text-sm mt-1">Authorized personnel only</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className={THEME.input.label}>Email Address</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className={THEME.input.base + " bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"} 
                    placeholder="admin@yourcollege.ab"
                    required 
                    disabled={verifying}
                />
              </div>
              <div>
                <label className={THEME.input.label}>Password</label>
                <input 
                    type="password" 
                    value={pass} 
                    onChange={e => setPass(e.target.value)} 
                    className={THEME.input.base + " bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"} 
                    placeholder="••••••••"
                    required 
                    disabled={verifying}
                />
              </div>
              {loginError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-center gap-2"><AlertTriangle size={16}/>{loginError}</div>}
              <button 
                type="submit" 
                className={THEME.button.primary + " w-full font-bold shadow-lg flex justify-center items-center gap-2"}
                disabled={verifying}
              >
                {verifying ? (
                    <>
                        <Loader2 className="animate-spin" size={18} />
                        Verifying...
                    </>
                ) : (
                    "Enter Dashboard"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: STUDENT VIEW ---
  if (viewingStudent) {
    const batchConfig = BATCHES.find(b => b.id === selectedBatchId);
    const semesterIPs = batchConfig?.semesters[currentSemester]?.internals || [];
    
    // Filter data based on local scope
    const filteredActivities = studentViewScope === 'Consolidated' 
        ? studentActivityHistory 
        : studentActivityHistory.filter((a: any) => a.ip === studentViewScope); // Note: ip added during parse

    const filteredSubjects = studentViewScope === 'Consolidated' 
        ? studentConsolidated
        : studentFullInternals[studentViewScope] || [];
    
    // Calculate Total RP for current scope to pass to InternalMarks
    const calculatedTotalRP = filteredActivities.reduce((acc, curr) => acc + curr.points, 0);

    return (
      <div className="animate-fade-in-up pb-12">
        {/* Header with Search and Back */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-16 z-50">
             <button onClick={() => setViewingStudent(null)} className="flex items-center space-x-2 text-gray-500 hover:text-indigo-600 font-medium">
                <ArrowLeft size={18} />
                <span>Exit Student View</span>
             </button>
             
             <div className="flex gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search another student..." 
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
                      value={studentSearchTerm} 
                      onChange={e => setStudentSearchTerm(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleStudentSearch()} 
                    />
                </div>
                <button onClick={handleStudentSearch} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">Search</button>
             </div>
        </div>

        <div className="space-y-6 relative">
           {/* Sticky Scope Tabs */}
           <div className="sticky top-40 z-30 flex justify-center pointer-events-none">
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-md p-1 rounded-lg border border-gray-200 dark:border-gray-700 inline-flex pointer-events-auto">
                 <button 
                    onClick={() => setStudentViewScope('Consolidated')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${studentViewScope === 'Consolidated' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    Consolidated
                 </button>
                 {semesterIPs.map(ip => (
                    <button 
                        key={ip}
                        onClick={() => setStudentViewScope(ip)}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${studentViewScope === ip ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {ip}
                    </button>
                 ))}
              </div>
           </div>

           <StudentDetails student={viewingStudent} batchLabel={batchConfig?.label || ""} />
           
           <StatsCards avg={viewingStudentStats.avg} yours={viewingStudentStats.yours} needed={viewingStudentStats.needed} />

           <StudentAnalytics 
              activityRows={filteredActivities}
              internalSubjects={filteredSubjects} 
           />

           {/* Full Width Sections */}
           <div className="space-y-8">
               <div className="w-full">
                   <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Activity size={18}/> Activity History</h3>
                   <ActivityTable rows={filteredActivities} />
               </div>
               
               <div className="w-full">
                   <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Award size={18}/> Internal Marks</h3>
                   <InternalMarks 
                      title={`${studentViewScope} Marks`}
                      subjects={filteredSubjects}
                      loading={isLoadingStudentData}
                      totalRP={calculatedTotalRP}
                   />
               </div>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN ADMIN DASHBOARD ---
  return (
    <div className="animate-fade-in-up pb-12">
      
      {/* GLOBAL CONTEXT HEADER */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Executive Dashboard</h1>
               <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                   {adminUser && <span className="font-medium text-indigo-600 dark:text-indigo-400">Welcome, {adminUser.name}</span>}
                   {dataLoading ? <span className="text-indigo-600 animate-pulse">Syncing data...</span> : 
                   <>
                    <span>|</span>
                    <span>{BATCHES.find(b=>b.id === selectedBatchId)?.label}</span>
                    <span className="text-gray-300">|</span>
                    <span>{metrics ? metrics.totalStudents : 0} Students</span>
                   </>
                   }
               </div>
            </div>

            {/* Strategic Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full xl:w-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 items-center">
               <div className="flex flex-col px-3 border-r border-gray-200 dark:border-gray-700">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Batch</span>
                  <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className="bg-transparent border-none text-sm font-bold text-gray-800 dark:text-white focus:ring-0 cursor-pointer p-0">
                     {BATCHES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
               </div>
               <div className="flex flex-col px-3 border-r border-gray-200 dark:border-gray-700">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Semester</span>
                  <select value={currentSemester} onChange={(e) => setCurrentSemester(e.target.value)} className="bg-transparent border-none text-sm font-bold text-gray-800 dark:text-white focus:ring-0 cursor-pointer p-0">
                     {Object.keys(BATCHES.find(b => b.id === selectedBatchId)?.semesters || {}).map(k => (
                       <option key={k} value={k}>{BATCHES.find(b => b.id === selectedBatchId)?.semesters[k].label}</option>
                     ))}
                  </select>
               </div>
               <div className="flex flex-col px-3 border-r border-gray-200 dark:border-gray-700">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Scope</span>
                  <select value={dataScope} onChange={(e) => setDataScope(e.target.value)} className="bg-transparent border-none text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:ring-0 cursor-pointer p-0">
                     <option value="Consolidated">Consolidated</option>
                     {BATCHES.find(b => b.id === selectedBatchId)?.semesters[currentSemester]?.internals.map(ip => (
                       <option key={ip} value={ip}>{ip}</option>
                     ))}
                  </select>
               </div>
               <div className="flex flex-col px-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Department</span>
                  <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer p-0 truncate w-full">
                     <option value="All">All Departments</option>
                     {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
               </div>
            </div>
         </div>

         {/* Navigation Tabs */}
         <div className="flex gap-2 mt-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
               { id: 'overview', label: 'Overview', icon: BarChart2 },
               { id: 'activities', label: 'Activity Analytics', icon: Activity },
               { id: 'internals', label: 'Internal Marks', icon: Award },
               { id: 'student-dashboard', label: 'Student Dashboard', icon: User },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                     activeTab === tab.id 
                     ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                     : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-t-lg'
                  }`}
               >
                  <tab.icon size={18} className={activeTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"} /> 
                  {tab.label}
               </button>
            ))}
         </div>
      </div>
      
      {dataLoading && <div className="p-12 text-center text-gray-500 animate-pulse">Syncing sheet data...</div>}

      {!dataLoading && metrics && (
      <>
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Card 1: Students */}
             <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border-l-4 border-indigo-500">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Students</div>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalStudents}</span>
                   <span className="text-xs text-gray-400">active</span>
                </div>
             </div>
             {/* Card 2: Average */}
             <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border-l-4 border-emerald-500">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Avg Reward Points</div>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.avgPoints}</span>
                   <span className="text-xs text-emerald-600 flex items-center gap-1">Global Avg</span>
                </div>
             </div>
             {/* Card 3: At Risk */}
             <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border-l-4 border-red-500">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">At Risk (0-100 Pts)</div>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold text-red-600">{metrics.lowPointStudents.length}</span>
                   <span className="text-xs text-red-400">students</span>
                </div>
             </div>
             {/* Card 4: Custom Range */}
             <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border-l-4 border-purple-500 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                   <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Custom Range Analysis</div>
                   <Filter size={14} className="text-purple-500"/>
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <input type="number" min="0" className="w-full p-1.5 text-sm font-bold border border-gray-200 dark:border-gray-600 rounded text-center bg-gray-50 dark:bg-gray-900 dark:text-white outline-none" value={customRange.min} onChange={(e) => setCustomRange(prev => ({...prev, min: Number(e.target.value)}))} placeholder="Min" />
                    <span className="text-gray-400 text-xs font-bold">TO</span>
                    <input type="number" min="0" className="w-full p-1.5 text-sm font-bold border border-gray-200 dark:border-gray-600 rounded text-center bg-gray-50 dark:bg-gray-900 dark:text-white outline-none" value={customRange.max} onChange={(e) => setCustomRange(prev => ({...prev, max: Number(e.target.value)}))} placeholder="Max" />
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-baseline gap-1">
                       <span className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.studentPointsData.filter(s => s.total >= customRange.min && s.total <= customRange.max).length}</span>
                   </div>
                   <button onClick={() => {
                           const list = metrics.studentPointsData.filter(s => s.total >= customRange.min && s.total <= customRange.max);
                           setModalList({ title: `Custom Range: ${customRange.min} - ${customRange.max} Points`, students: list.map(item => ({ reg: item.student[headerKeys.reg], name: item.student[headerKeys.name], email: item.student[headerKeys.email], dept: item.student[headerKeys.dept], mark: item.total })) });
                       }}
                       className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 font-bold transition-colors">View List</button>
                </div>
             </div>
          </div>
          
          {/* Main Graph - Full Width & Clean */}
          <div className={`${THEME.card.base} ${THEME.card.body} min-h-[400px] flex flex-col`}>
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Overall Points Distribution</h3>
                <span className="text-xs text-gray-400">Distribution of students based on total reward points</span>
             </div>
             <div className="flex-1">
                <ResponsiveContainer width="100%" height={320}>
                   <BarChart data={metrics.graphData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="range" tick={{fontSize: 12}} stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                         cursor={{fill: 'transparent'}} 
                         contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                      />
                      <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={50} name="Students">
                         <LabelList dataKey="count" position="top" style={{ fill: '#6B7280', fontSize: '12px', fontWeight: 'bold' }} />
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVITY ANALYTICS TAB */}
      {activeTab === 'activities' && (
         <div className="space-y-6 animate-fade-in-up">
            {/* Summary Chips */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
               <div className="col-span-2 md:col-span-2 bg-indigo-600 text-white p-4 rounded-xl shadow">
                  <div className="text-xs font-bold uppercase opacity-80 mb-1">Total Available Points</div>
                  <div className="text-3xl font-bold">{activitySummary.totalMaxPoints}</div>
                  <div className="text-[10px] opacity-75 mt-1">Across all activities in scope</div>
               </div>
               {Object.entries(activitySummary.categoryCounts).map(([cat, count]) => (
                  <div key={cat} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                     <span className="text-[10px] text-gray-500 font-bold uppercase">{cat}</span>
                     <span className="text-xl font-bold text-gray-800 dark:text-gray-200">{count} <span className="text-[10px] font-normal text-gray-400">Activities</span></span>
                  </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category Pie Chart */}
                <div className={`${THEME.card.base} ${THEME.card.body} flex flex-col`}>
                   <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Activities by Category</h3>
                   <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={metrics.categoryActivityStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                               {metrics.categoryActivityStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{fontSize: '11px'}} />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Main Graph: Count & Avg Score */}
                <div className={`${THEME.card.base} ${THEME.card.body} lg:col-span-2 flex flex-col`}>
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                         <TrendingUp size={18} className="text-green-500"/> Participation & Performance
                      </h3>
                      <div className="flex flex-wrap gap-2 items-center">
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                              <span className="text-xs text-gray-500 pl-2">Filter:</span>
                              <input 
                                  type="date" 
                                  className="text-xs bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300"
                                  value={activityDateFilter.start}
                                  onChange={e => setActivityDateFilter(prev => ({...prev, start: e.target.value}))}
                              />
                              <span className="text-xs text-gray-400">-</span>
                              <input 
                                  type="date" 
                                  className="text-xs bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300"
                                  value={activityDateFilter.end}
                                  onChange={e => setActivityDateFilter(prev => ({...prev, end: e.target.value}))}
                              />
                          </div>
                          <select 
                             value={activityCategoryFilter} 
                             onChange={(e) => setActivityCategoryFilter(e.target.value)}
                             className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          >
                             <option value="All">All Categories</option>
                             {Array.from(new Set(adminHeaders.map(h => parseActivityHeader(h).category).filter(Boolean))).map(c => (
                                <option key={c} value={c}>{c}</option>
                             ))}
                          </select>
                      </div>
                   </div>
                   <div className="flex-1 min-h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={detailedActivityStats} margin={{top: 20, right: 30, left: 20, bottom: 60}}>
                          <CartesianGrid stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="displayName" angle={-45} textAnchor="end" height={80} tick={{fontSize: 10}} interval={0} />
                          <YAxis yAxisId="left" orientation="left" stroke="#4F46E5" label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#10B981" label={{ value: 'Avg Points', angle: 90, position: 'insideRight' }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                          <Legend verticalAlign="top"/>
                          <Bar yAxisId="left" dataKey="count" name="Participation" fill="#4F46E5" barSize={20} radius={[4, 4, 0, 0]} />
                          <Line yAxisId="right" type="monotone" dataKey="avg" name="Avg Score" stroke="#10B981" strokeWidth={2} dot={{r: 3}} />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
                </div>
            </div>

            {/* Detailed Data Table */}
            <div className={`${THEME.card.base} overflow-hidden`}>
               <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 dark:text-white">Detailed Activity Metrics</h3>
                  <button onClick={() => downloadCSV(detailedActivityStats, 'Activity_Metrics')} className="text-xs flex items-center gap-1 text-indigo-600 font-bold hover:underline"><Download size={14}/> CSV</button>
               </div>
               <div className="overflow-x-auto max-h-[500px]">
                  <table className="min-w-full text-sm text-left">
                     <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                        <tr>
                           <th className="px-6 py-3 font-bold text-gray-600 dark:text-gray-300">Activity Name</th>
                           <th className="px-6 py-3 font-bold text-gray-600 dark:text-gray-300">Category</th>
                           <th className="px-6 py-3 font-bold text-gray-600 dark:text-gray-300">Dates</th>
                           <th className="px-6 py-3 text-center font-bold text-gray-600 dark:text-gray-300">Participants</th>
                           <th className="px-6 py-3 text-center font-bold text-green-600">Max Score</th>
                           <th className="px-6 py-3 text-center font-bold text-red-600">Min Score</th>
                           <th className="px-6 py-3 text-center font-bold text-indigo-600">Avg Score</th>
                           <th className="px-6 py-3 text-center font-bold text-gray-600">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {detailedActivityStats.map((stat, idx) => (
                           <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100" title={stat.displayName}>{stat.displayName.substring(0, 30)}{stat.displayName.length > 30 ? '...' : ''}</td>
                              <td className="px-6 py-3"><span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-bold">{stat.category}</span></td>
                              <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                                  {stat.dateStart}<br/>{stat.dateEnd !== stat.dateStart && stat.dateEnd}
                              </td>
                              <td className="px-6 py-3 text-center font-bold">{stat.count}</td>
                              <td className="px-6 py-3 text-center text-green-600 font-medium">{stat.max}</td>
                              <td className="px-6 py-3 text-center text-red-600 font-medium">{stat.min}</td>
                              <td className="px-6 py-3 text-center text-indigo-600 font-bold">{stat.avg}</td>
                              <td className="px-6 py-3 text-center">
                                 <button 
                                    onClick={() => {
                                       const attendees = filteredStudents.filter(s => (Number(s[stat.header]) || 0) > 0).map(s => ({
                                          RegNo: s[headerKeys.reg], Name: s[headerKeys.name], Email: s[headerKeys.email], Dept: s[headerKeys.dept], Points: s[stat.header]
                                       }));
                                       setActivityModal({ title: stat.displayName, data: attendees });
                                    }}
                                    className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 font-bold"
                                 >
                                    View List
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}

      {/* 3. INTERNAL ANALYTICS TAB (REVAMPED) */}
      {activeTab === 'internals' && (
         <div className="space-y-6 animate-fade-in-up">
            {/* Controls */}
            <div className={`${THEME.card.base} p-6 bg-gradient-to-r from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 border-indigo-100`}>
               <div className="flex flex-col md:flex-row gap-8 items-end">
                  <div className="w-full md:w-1/3">
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Department</label>
                     <select 
                        value={internalAnalyticsDept} 
                        onChange={e => setInternalAnalyticsDept(e.target.value)}
                        className={THEME.input.base + " font-bold text-indigo-600"}
                     >
                        <option value="All">All Departments</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                     </select>
                  </div>
                  <div className="w-full md:w-2/3 flex items-center gap-4 p-4 bg-white dark:bg-gray-900/50 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                     <div className="text-indigo-600 dark:text-indigo-400 p-2 bg-indigo-50 dark:bg-indigo-900 rounded-full"><Layers size={24}/></div>
                     <div>
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-100">
                           {dataScope === 'Consolidated' 
                              ? `Consolidated View (Total of ${BATCHES.find(b=>b.id === selectedBatchId)?.semesters[currentSemester]?.internals.join(' + ')})` 
                              : `Single Exam View: ${dataScope}`}
                        </h4>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                           {dataScope === 'Consolidated' ? "Showing cumulative marks per subject across all internal exams." : "Showing specific exam performance."}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {loadingInternalStats ? (
               <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-pulse">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                  <p>Aggregating marks across sheets...</p>
               </div>
            ) : deptInternalStats.length > 0 ? (
               <>
                 {/* Top Level Subject KPI */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {(() => {
                        const sortedByAvg = [...deptInternalStats].sort((a,b) => b.avg - a.avg);
                        const best = sortedByAvg[0];
                        const worst = sortedByAvg[sortedByAvg.length - 1];
                        const avgPass = deptInternalStats.reduce((acc, curr) => acc + (1 - (curr.countFail/curr.totalStudents)), 0) / deptInternalStats.length;
                        return (
                           <>
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                 <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
                                    <Target size={18}/> <span className="text-xs font-bold uppercase">Top Subject</span>
                                 </div>
                                 <div className="text-lg font-bold text-gray-900 dark:text-white truncate" title={best?.subject}>{best?.subject}</div>
                                 <div className="text-sm text-gray-500">Avg: {best?.avg} / {best?.maxPossible}</div>
                              </div>
                              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                                 <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-1">
                                    <Zap size={18}/> <span className="text-xs font-bold uppercase">Needs Attention</span>
                                 </div>
                                 <div className="text-lg font-bold text-gray-900 dark:text-white truncate" title={worst?.subject}>{worst?.subject}</div>
                                 <div className="text-sm text-gray-500">Avg: {worst?.avg} / {worst?.maxPossible}</div>
                              </div>
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                 <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-1">
                                    <BookOpen size={18}/> <span className="text-xs font-bold uppercase">Overall Pass Rate</span>
                                 </div>
                                 <div className="text-2xl font-bold text-gray-900 dark:text-white">{(avgPass * 100).toFixed(1)}%</div>
                                 <div className="text-sm text-gray-500">Across {deptInternalStats.length} subjects</div>
                              </div>
                           </>
                        )
                     })()}
                 </div>

                 {/* Graph: Subject Performance */}
                 <div className={`${THEME.card.base} ${THEME.card.body}`}>
                     <h3 className="font-bold text-gray-900 dark:text-white mb-4">Subject-wise Average vs Max Performance</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={deptInternalStats} margin={{top: 20, right: 30, left: 20, bottom: 60}}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                              <XAxis dataKey="subject" angle={-45} textAnchor="end" height={80} tick={{fontSize: 10}} interval={0}/>
                              <YAxis />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }}/>
                              <Legend verticalAlign="top"/>
                              <Bar dataKey="avg" name="Average Mark" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={30}>
                                 <LabelList dataKey="avg" position="top" style={{ fill: '#6B7280', fontSize: '10px', fontWeight: 'bold' }} />
                              </Bar>
                              <Bar dataKey="maxPossible" name="Total Max Marks" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={30}/>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Detailed Table */}
                 <div className={`${THEME.card.base} overflow-hidden`}>
                     <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Detailed Subject Analytics</h3>
                        <button onClick={() => downloadCSV(deptInternalStats, 'Internal_Analytics')} className="text-xs text-indigo-600 font-bold hover:underline">Download Report</button>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                           <thead className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                              <tr>
                                 <th className="px-6 py-4 font-bold text-gray-600 dark:text-gray-300">Subject</th>
                                 <th className="px-6 py-4 text-center font-bold text-gray-600 dark:text-gray-300">Total Max</th>
                                 <th className="px-6 py-4 text-center font-bold text-green-600">Max Scorers</th>
                                 <th className="px-6 py-4 text-center font-bold text-blue-600">60% - 80%</th>
                                 <th className="px-6 py-4 text-center font-bold text-red-600">Low (&lt;50%)</th>
                                 <th className="px-6 py-4 text-center font-bold text-gray-600 dark:text-gray-300">Avg Mark</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {deptInternalStats.map((stat, idx) => (
                                 <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200" title={stat.subject}>
                                       {stat.subject.length > 25 ? stat.subject.substring(0, 25) + '...' : stat.subject}
                                       <div className="text-[10px] text-gray-400">{stat.ip}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-500 font-bold">{stat.maxPossible}</td>
                                    
                                    <td className={`px-6 py-4 text-center cursor-pointer transition-colors hover:bg-green-50`}
                                          onClick={() => setModalList({ title: `${stat.subject} - Top Scorers`, students: stat.listMax })}>
                                       <span className={`font-bold text-lg text-green-600 underline decoration-dotted underline-offset-4`}>{stat.countMax}</span>
                                    </td>
                                    
                                    <td className={`px-6 py-4 text-center cursor-pointer transition-colors hover:bg-blue-50`}
                                          onClick={() => setModalList({ title: `${stat.subject} - Mid Range Scorers`, students: stat.listMid })}>
                                       <span className={`font-bold text-lg text-blue-600 underline decoration-dotted underline-offset-4`}>{stat.countMid}</span>
                                    </td>

                                    <td className={`px-6 py-4 text-center cursor-pointer transition-colors hover:bg-red-50`}
                                          onClick={() => setModalList({ title: `${stat.subject} - Low Performance`, students: stat.listFail })}>
                                       <span className={`font-bold text-lg text-red-600 underline decoration-dotted underline-offset-4`}>{stat.countFail}</span>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-center font-bold text-indigo-600">{stat.avg}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                 </div>
                 
                 {/* ALL STUDENT MARKS LIST */}
                 <div className={`${THEME.card.base} overflow-hidden mt-8`}>
                     <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Complete Student Marks List</h3>
                        <button onClick={() => downloadCSV(allStudentMarksList, 'Full_Marks_List')} className="text-xs text-indigo-600 font-bold hover:underline">Download CSV</button>
                     </div>
                     <div className="overflow-x-auto max-h-[600px]">
                        <table className="min-w-full text-sm text-left">
                           <thead className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                              <tr>
                                 <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-300">Reg No</th>
                                 <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-300">Name</th>
                                 <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-300">Email</th>
                                 {allStudentMarksList.length > 0 && Object.keys(allStudentMarksList[0].subjects).map(sub => (
                                     <th key={sub} className="px-4 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">{sub}</th>
                                 ))}
                                 <th className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">Total</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {allStudentMarksList.map((student, idx) => (
                                 <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="px-4 py-3 font-mono font-medium">{student.RegNo}</td>
                                    <td className="px-4 py-3">{student.Name}</td>
                                    <td className="px-4 py-3 text-gray-500">{student.Email}</td>
                                    {Object.keys(student.subjects).map(sub => (
                                        <td key={sub} className="px-4 py-3 text-center">{student.subjects[sub]}</td>
                                    ))}
                                    <td className="px-4 py-3 font-bold text-indigo-600">{student.Total}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                 </div>
               </>
            ) : (
               <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Filter size={48} className="mb-2 opacity-20" />
                  <p>Select a specific department to view detailed analytics.</p>
               </div>
            )}
         </div>
      )}

      {/* 4. STUDENT DASHBOARD TAB (RESTORED) */}
      {activeTab === 'student-dashboard' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in-up">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 max-w-2xl w-full text-center">
                <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-6">
                    <Search size={48} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Student Lookup</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Enter a Register Number or Name to view detailed performance metrics, 
                    activity history, and internal marks for a specific student.
                </p>
                
                <div className="relative flex items-center max-w-md mx-auto group">
                    <Search className="absolute left-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-32 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      placeholder="Ex: 25BAM001 or Name"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStudentSearch()}
                    />
                    <button 
                      onClick={handleStudentSearch}
                      className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md hover:shadow-lg"
                    >
                      Search
                    </button>
                </div>
              </div>
          </div>
      )}

      {/* --- MODAL FOR LISTS --- */}
      {(modalList || activityModal) && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700">
               <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    {modalList ? modalList.title : activityModal?.title}
                  </h3>
                  <button onClick={() => { setModalList(null); setActivityModal(null); }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500"><X size={20}/></button>
               </div>
               <div className="overflow-y-auto p-0">
                  <table className="min-w-full text-sm text-left">
                     <thead className="bg-white dark:bg-gray-900 sticky top-0 shadow-sm z-10">
                        <tr>
                           <th className="px-6 py-3 font-semibold text-gray-500">Reg No</th>
                           <th className="px-6 py-3 font-semibold text-gray-500">Name</th>
                           <th className="px-6 py-3 font-semibold text-gray-500">Email</th>
                           <th className="px-6 py-3 font-semibold text-gray-500">Dept</th>
                           <th className="px-6 py-3 text-right font-semibold text-gray-500">
                             {activityModal ? "Points" : "Mark"}
                           </th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {(modalList ? modalList.students : activityModal?.data || []).map((s: any, i: number) => (
                           <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200">{s.reg || s.RegNo}</td>
                              <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{s.name || s.Name}</td>
                              <td className="px-6 py-3 text-gray-500">{s.email || s.Email || '-'}</td>
                              <td className="px-6 py-3 text-gray-500">{s.dept || s.Dept}</td>
                              <td className="px-6 py-3 text-right font-bold text-indigo-600">{s.mark || s.Points}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-right">
                  <button onClick={() => downloadCSV((modalList ? modalList.students : activityModal?.data || []), (modalList ? modalList.title : activityModal?.title || 'List'))} className="text-sm font-bold text-indigo-600 hover:underline">Download List</button>
               </div>
            </div>
         </div>
      )}
      </>)}
    </div>
  );
};
