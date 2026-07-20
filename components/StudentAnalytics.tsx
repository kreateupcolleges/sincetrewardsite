
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList 
} from 'recharts';
import { ActivityRow, SubjectMark } from '../types';
import { THEME } from '../theme';

interface Props {
  activityRows: ActivityRow[];
  internalSubjects: SubjectMark[];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

const StudentAnalytics: React.FC<Props> = ({ activityRows, internalSubjects }) => {
  
  // 1. Process Activity Data: Points by Category
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    activityRows.forEach(row => {
      const cat = row.category || 'OT';
      counts[cat] = (counts[cat] || 0) + row.points;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [activityRows]);

  // 2. Process Internal Marks
  const marksData = React.useMemo(() => {
    return internalSubjects.map(sub => ({
      code: sub.code.split(' ').pop() || sub.code.substring(0,6), // Short code
      marks: sub.marks,
      max: sub.max,
      percentage: sub.max > 0 ? Math.round((sub.marks / sub.max) * 100) : 0
    }));
  }, [internalSubjects]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 mb-8">
      
      {/* Category Distribution */}
      <div className={`${THEME.card.base} ${THEME.card.body}`}>
        <h3 className={`text-lg font-bold mb-4 ${THEME.primaryText}`}>Points Distribution by Category</h3>
        <div className="h-64">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000 }} 
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">No activity data available</div>
          )}
        </div>
      </div>

      {/* Internal Marks Performance with Visible Labels */}
      <div className={`${THEME.card.base} ${THEME.card.body}`}>
        <h3 className={`text-lg font-bold mb-4 ${THEME.primaryText}`}>Internal Marks Performance</h3>
        <div className="h-64">
          {marksData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="code" tick={{fontSize: 12}} stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000 }}
                />
                <Legend />
                <Bar name="Obtained" dataKey="marks" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                   {/* Visible Counts without hovering */}
                   <LabelList dataKey="marks" position="top" style={{ fill: '#4F46E5', fontSize: '11px', fontWeight: 'bold' }} />
                </Bar>
                <Bar name="Max Marks" dataKey="max" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">No internal marks loaded</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
