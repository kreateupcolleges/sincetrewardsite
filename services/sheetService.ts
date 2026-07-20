
import { Student, SheetConfig, ActivityRow, SubjectMark, SemesterSubjectConfig } from '../types';
import { CATEGORY_CODES, SYSTEM_HEADER_LABELS } from '../config';

// Helper to normalize header strings for comparison
export const normalizeLabel = (label: string): string => 
  (label || "").toString().trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '');

const isSystemHeader = (hdr: string) => SYSTEM_HEADER_LABELS.includes(normalizeLabel(hdr));

// Helper: Pause execution
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches data from a public Google Sheet using the GViz API.
 */
export const fetchSheetData = async (config: SheetConfig): Promise<{ headers: string[], rows: Student[] }> => {
  const url = `https://docs.google.com/spreadsheets/d/${config.id}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(config.name)}`;
  
  let attempt = 0;
  const maxRetries = 2;

  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP Error ${res.status} accessing sheet '${config.name}'`);
      
      const text = await res.text();
      if (text.trim().startsWith("<!DOCTYPE html") || text.includes("google.com/accounts")) {
          throw new Error(`Sheet '${config.name}' is private or invalid.`);
      }

      const jsonMatch = text.match(/setResponse\(([\s\S]*)\);/);
      if (!jsonMatch || !jsonMatch[1]) throw new Error(`Invalid JSON response from '${config.name}'`);

      const json = JSON.parse(jsonMatch[1]);
      if (json.status === 'error') {
          throw new Error(`GViz API Error: ${json.errors?.[0]?.message || 'Unknown'} in '${config.name}'`);
      }

      let headers: string[] = [];
      if (json.table.cols) {
          headers = json.table.cols.map((col: any) => col?.label || "").map((h: string) => h.trim());
      }

      const validHeaderIndices: number[] = [];
      headers.forEach((h, i) => { if (h && h.length > 0) validHeaderIndices.push(i); });

      if (validHeaderIndices.length === 0) return { headers: [], rows: [] };

      const rawRows = json.table.rows || [];
      const rows: Student[] = rawRows.map((rowObj: any) => {
          if (!rowObj || !rowObj.c) return null;
          const student: Student = {};
          let hasData = false;

          validHeaderIndices.forEach(colIndex => {
              const cell = rowObj.c[colIndex];
              const header = headers[colIndex];
              let val = "";
              if (cell) {
                  if (cell.f !== null && cell.f !== undefined) val = String(cell.f);
                  else if (cell.v !== null && cell.v !== undefined) val = String(cell.v);
              }
              if (val.trim() !== "") hasData = true;
              student[header] = val.trim();
          });

          return hasData ? student : null;
      }).filter((s: any) => s !== null);

      return { headers: headers.filter(h => h !== ""), rows };

    } catch (error: any) {
      if (attempt === maxRetries) throw error; 
      await wait(500 * Math.pow(2, attempt));
      attempt++;
    }
  }
  throw new Error("Unknown error in fetchSheetData");
};

/**
 * Parses a raw column header into metadata.
 * Improved logic to find Max Points and Category specifically.
 */
export const parseActivityHeader = (name: string): Partial<ActivityRow> => {
  const raw = String(name || '').trim();
  // Standard split handles both underscore and space.
  const tokens = raw.split(/_| /).map(t => t.trim()).filter(t => t.length > 0); 
  
  const meta: any = { 
    raw, forWho: '', year: '', dateStart: '', dateEnd: '', 
    displayName: raw, category: 'OT', maxPoints: null 
  };

  if (tokens.length < 3) return meta;

  let idx = 0;
  if (tokens[0].toUpperCase() === 'RP') idx = 1;
  
  meta.forWho = tokens[idx] || 'All'; idx++;
  meta.year = tokens[idx] || ''; idx++;
  
  // Date parsing logic
  const dateToken = tokens[idx] || '';
  if (dateToken.toLowerCase().indexOf('to') !== -1 || (tokens[idx + 1] && tokens[idx + 1].toLowerCase() === 'to')) {
    if (dateToken.toLowerCase().indexOf('to') !== -1 && dateToken.indexOf('_To_') !== -1) {
      const parts = dateToken.split('_To_');
      meta.dateStart = parts[0]; meta.dateEnd = parts[1]; idx++;
    } else if (tokens[idx + 1] && tokens[idx + 1].toLowerCase() === 'to') {
      meta.dateStart = tokens[idx]; meta.dateEnd = tokens[idx + 2]; idx += 3;
    } else {
      const parts = dateToken.split(/to/i);
      meta.dateStart = parts[0]?.replace(/[_\-]/g, '.').trim();
      meta.dateEnd = parts[1]?.replace(/[_\-]/g, '.').trim();
      idx++;
    }
  } else {
    meta.dateStart = dateToken; meta.dateEnd = dateToken; idx++;
  }

  // Find Category Code and Max Points
  let categoryIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (CATEGORY_CODES.includes(tokens[i].toUpperCase())) {
      categoryIdx = i;
      break;
    }
  }

  if (categoryIdx !== -1) {
    meta.category = tokens[categoryIdx].toUpperCase();
    
    /**
     * LOGIC FOR MAX POINTS:
     * We need to be careful not to pick "1" from "1 yr" or fragments of dates.
     */
    const afterToken = tokens[categoryIdx + 1];
    const beforeToken = tokens[categoryIdx - 1];

    const isStrictlyNumeric = (s: string) => s && /^\d+$/.test(s);

    if (isStrictlyNumeric(afterToken)) {
      meta.maxPoints = Number(afterToken);
    } else if (isStrictlyNumeric(beforeToken) && !normalizeLabel(tokens[categoryIdx]).includes('yr')) {
      // Avoid picking up year prefix if it's separate (e.g. "1 yr")
      // Check if the token before 'beforeToken' is 'All' or something else indicative of metadata.
      const isYearToken = tokens[categoryIdx - 2] && tokens[idx - 2] === meta.forWho; 
      if (!isYearToken) meta.maxPoints = Number(beforeToken);
    } else {
      // Look for any numeric token at the very end as a fallback
      const lastToken = tokens[tokens.length - 1];
      if (isStrictlyNumeric(lastToken)) {
        meta.maxPoints = Number(lastToken);
      }
    }

    // Determine Display Name
    // Usually names are either at the start after dates, or at the end.
    const startOfName = idx;
    // We filter out metadata tokens from the remaining list.
    const nameTokens = tokens.slice(startOfName).filter(t => {
      const tUpper = t.toUpperCase();
      if (CATEGORY_CODES.includes(tUpper)) return false;
      if (t === String(meta.maxPoints)) return false;
      if (t.toLowerCase().includes('yr')) return false;
      // Filter out pure numbers unless they have dots (usually part of date or version, but dates handled)
      if (/^\d+$/.test(t)) return false; 
      return true;
    });
    
    meta.displayName = nameTokens.join(' ');
  } else {
     meta.displayName = tokens.slice(idx).join(' ');
  }
  
  // Final Sanitization: If points are obviously higher than maxPoints, it's a parsing error.
  // Actually, don't auto-correct unless certain, but we can set to null if it's '1' and points are '100'.
  
  return meta;
};

/**
 * Parses internal marks using Config if available.
 */
export const parseInternalMarks = (
  headers: string[], row: Student, dept: string, config: SemesterSubjectConfig
): { subjects: SubjectMark[], totals: any } => {
  const subjects: SubjectMark[] = [];
  const normalizedMap = new Map(headers.map(c => [normalizeLabel(c), c]));
  const configuredSubjects = config.departments[dept] || [];

  const findRPColumn = (baseHeader: string) => {
    const baseNorm = normalizeLabel(baseHeader);
    const tries = [baseNorm + "_rp", baseNorm + " rp", baseNorm + "rp"];
    for (const t of tries) if (normalizedMap.has(t)) return normalizedMap.get(t);
    return headers.find(h => normalizeLabel(h).endsWith("_rp") && normalizeLabel(h).includes(baseNorm));
  };

  if (configuredSubjects.length > 0) {
    configuredSubjects.forEach(subRule => {
      const sheetHeader = headers.find(h => normalizeLabel(h) === normalizeLabel(subRule.code)) 
                       || headers.find(h => normalizeLabel(h).includes(normalizeLabel(subRule.code)));
      if (sheetHeader) {
        const rpHeader = findRPColumn(sheetHeader);
        const marksVal = Number(row[sheetHeader]) || 0;
        const rpVal = rpHeader ? (Number(row[rpHeader]) || 0) : 0;
        let finalMax = subRule.maxMarks;
        if (finalMax < marksVal) finalMax = marksVal;
        subjects.push({ code: sheetHeader, type: subRule.type, marks: marksVal, rp: rpVal, max: finalMax });
      }
    });
  } else {
    const potentialSubjects = headers.filter(h => {
      const n = normalizeLabel(h);
      if (isSystemHeader(h)) return false;
      if (n.includes('total') || n.includes('allocated') || n.includes('balance') || n.includes('reward')) return false;
      return /[a-z]/.test(n) && /\d/.test(n) && n.length >= 4 && !n.endsWith("_rp");
    });
    potentialSubjects.forEach(subHeader => {
      const rpHeader = findRPColumn(subHeader);
      const marksVal = Number(row[subHeader]) || 0;
      const rpVal = rpHeader ? (Number(row[rpHeader]) || 0) : 0;
      const n = normalizeLabel(subHeader);
      let type: any = 'Theory';
      if (n.includes("lab+theory") || n.includes("lab + theory")) type = 'Lab + Theory';
      else if (n.includes("lab")) type = 'Lab';
      let finalMax = config.defaultMaxMarks[type as keyof typeof config.defaultMaxMarks] || 15;
      if (finalMax < marksVal) finalMax = marksVal;
      subjects.push({ code: subHeader, type, marks: marksVal, rp: rpVal, max: finalMax });
    });
  }
  return { subjects, totals: {} };
};
