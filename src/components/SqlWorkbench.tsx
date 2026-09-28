import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SQL_SCRIPTS } from '../sql/scripts';
import { calculateSubtreeRollup } from '../utils/math';
import { normalizeArabic, trigramSimilarity } from '../utils/arabic';
import {
  Terminal,
  Play,
  Copy,
  Download,
  Check,
  FileCode,
  Table as TableIcon,
} from 'lucide-react';

export const SqlWorkbench: React.FC = () => {
  const {
    units,
    visibleUnits,
    kpis,
    selectedKpiCode,
    selectedDate,
    currentUser,
    currentUserUnit,
    members,
    progressRecords,
    language,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'console' | 'scripts'>('console');
  const [selectedScriptId, setSelectedScriptId] = useState(SQL_SCRIPTS[0].id);
  const [copied, setCopied] = useState(false);

  // Pre-configured sample queries matching the user prompt
  const sampleQueries = [
    {
      id: 'europe_rollup',
      title: '1. Europe KPI Rollup (No Average-of-Averages Fallacy)',
      sql: `-- Subtree rollup for Europe (/1/3/%)\nSELECT ROUND(100.0 * SUM(numerator) / NULLIF(SUM(denominator), 0), 1) AS pct,\n       SUM(numerator) AS total_filled,\n       SUM(denominator) AS total_authorized\nFROM kpi_daily k JOIN units u ON u.id = k.unit_id\nWHERE u.path LIKE '/1/3/%' AND k.kpi_code = 'MANPOWER_FILL' AND k.day = '${selectedDate}';`,
    },
    {
      id: 'user_visibility',
      title: '2. Units Accessible by Logged-in Actor (RLS Rule)',
      sql: `-- Units visible to user '${currentUser.username}' (mine.path = '${currentUserUnit.path}')\nSELECT u.id, u.name_ar, u.name_en, u.level, u.path\nFROM units u, units mine\nWHERE mine.id = ${currentUser.unit_id} AND u.path LIKE mine.path || '%'\nORDER BY u.path;`,
    },
    {
      id: 'progress_window',
      title: '3. Progress Velocity & Moving Avg (Window Function)',
      sql: `-- Velocity and moving averages across 14-day history\nSELECT member_id, day, percentage,\n       percentage - LAG(percentage, 1) OVER (PARTITION BY member_id ORDER BY day) AS daily_velocity,\n       ROUND(AVG(percentage) OVER (PARTITION BY member_id ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS moving_avg_7d\nFROM committee_progress\nORDER BY member_id, day DESC\nLIMIT 15;`,
    },
    {
      id: 'arabic_fuzzy',
      title: '4. Arabic Trigram Fuzzy Search (pg_trgm & normalize_arabic)',
      sql: `-- Fast fuzzy match tolerant of Hamza and Tashkeel\nSELECT cm.id, cm.ref_number, cm.full_name, cm.name_normalized,\n       similarity(cm.name_normalized, normalize_arabic('احمد')) AS match_score\nFROM committee_members cm\nWHERE cm.name_normalized % normalize_arabic('احمد')\nORDER BY match_score DESC;`,
    },
  ];

  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
  const [customSql, setCustomSql] = useState(sampleQueries[0].sql);

  // Sync sample query selection to editor
  const handleSelectSample = (idx: number) => {
    setActiveQueryIndex(idx);
    setCustomSql(sampleQueries[idx].sql);
  };

  // Live Query Execution Result Simulation
  const queryResult = useMemo(() => {
    switch (activeQueryIndex) {
      case 0: {
        // Europe Rollup
        const euRollup = calculateSubtreeRollup('/1/3/', units, kpis, 'MANPOWER_FILL', selectedDate);
        return {
          columns: ['pct', 'total_filled', 'total_authorized', 'participating_units'],
          rows: [[
            `${euRollup.weightedPct}%`,
            euRollup.totalNumerator,
            euRollup.totalDenominator,
            euRollup.participatingUnitsCount,
          ]],
          executionTime: '0.42 ms (Index-Only Scan on idx_kpi_daily_code_day_covering)',
        };
      }
      case 1: {
        // Units accessible by active actor
        const accessible = units.filter(u => u.path.startsWith(currentUserUnit.path));
        return {
          columns: ['id', 'name_ar', 'name_en', 'level', 'path'],
          rows: accessible.map(u => [u.id, u.name_ar, u.name_en, u.level, u.path]),
          executionTime: '0.18 ms (B-Tree scan on idx_units_path_pattern text_pattern_ops)',
        };
      }
      case 2: {
        // Progress window function
        const rows = progressRecords.slice(-12).reverse().map((p, idx, arr) => {
          const prev = arr[idx + 1];
          const velocity = prev ? (p.percentage - prev.percentage).toFixed(1) : '0.0';
          return [p.member_id, p.day, `${p.percentage}%`, `${velocity}%`];
        });
        return {
          columns: ['member_id', 'day', 'percentage', 'daily_velocity'],
          rows,
          executionTime: '0.65 ms (WindowAgg on idx_committee_progress_day)',
        };
      }
      case 3: {
        // Arabic fuzzy search
        const qNorm = normalizeArabic('احمد');
        const rows = members
          .map(m => ({
            ...m,
            sim: trigramSimilarity(m.name_normalized, qNorm),
          }))
          .sort((a, b) => b.sim - a.sim)
          .slice(0, 6)
          .map(m => [m.id, m.employee_id || m.ref_number, m.full_name, m.name_normalized, (m.sim * 100).toFixed(1) + '%']);

        return {
          columns: ['id', 'employee_id', 'full_name', 'name_normalized', 'match_score'],
          rows,
          executionTime: '0.31 ms (Bitmap Index Scan on idx_committee_members_name_trgm)',
        };
      }
      default:
        return { columns: [], rows: [], executionTime: '0.0 ms' };
    }
  }, [activeQueryIndex, units, kpis, selectedDate, currentUserUnit, progressRecords, members]);

  // Selected Script from SQL_SCRIPTS
  const selectedScript = useMemo(() => {
    return SQL_SCRIPTS.find(s => s.id === selectedScriptId) || SQL_SCRIPTS[0];
  }, [selectedScriptId]);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(selectedScript.content);
    setCopied(true);
    showToast(language === 'ar' ? 'تم نسخ كود SQL إلى الحافظة' : 'SQL script copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAllSql = () => {
    const combinedContent = SQL_SCRIPTS.map(
      s => `-- ==========================================\n-- FILE: ${s.name}\n-- ${s.description}\n-- ==========================================\n\n${s.content}\n\n`
    ).join('\n');

    const blob = new Blob([combinedContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postgresql_governance_complete_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(language === 'ar' ? 'تم تنزيل جميع ملفات SQL المكتملة' : 'Complete SQL scripts downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>
              {language === 'ar'
                ? 'مختبر الاستعلامات وهندسة قاعدة البيانات (SQL & DDL Workbench)'
                : 'SQL Query Console & PostgreSQL DDL Blueprint'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ar'
              ? 'تشغيل استعلامات التجميع الشجري، التحقق من سياسات الأمان RLS، واستعراض ملفات الترحيل 01 إلى 04.'
              : 'Interactive execution of subtree rollups, RLS proofs, and full downloadable PostgreSQL migrations.'}
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-medium">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'console'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3 h-3 text-indigo-600" />
            <span>{language === 'ar' ? 'وحدة الاستعلام المباشر' : 'Live Query Console'}</span>
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scripts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3 h-3 text-indigo-600" />
            <span>{language === 'ar' ? 'ملفات الـ DDL والتهيئة' : 'DDL & Migrations'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'console' ? (
        <div className="space-y-4">
          {/* Query Preset Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {sampleQueries.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => handleSelectSample(idx)}
                className={`p-3 text-left text-xs rounded-lg border transition-all cursor-pointer ${
                  activeQueryIndex === idx
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="truncate">{q.title}</div>
              </button>
            ))}
          </div>

          {/* SQL Editor View */}
          <div className="bg-slate-950 text-slate-200 rounded-lg p-4 font-mono text-xs border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                SQL Query Buffer
              </span>
              <span className="text-emerald-400 font-mono">
                {queryResult.executionTime}
              </span>
            </div>

            <textarea
              rows={5}
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              className="w-full bg-transparent text-emerald-400 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Result Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-900">
                  {language === 'ar' ? 'نتائج الاستعلام في محرك قاعدة البيانات' : 'Query Result Set'}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {queryResult.rows.length} {language === 'ar' ? 'صفوف مُرجعة' : 'rows returned'}
              </span>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    {queryResult.columns.map(col => (
                      <th key={col} className="px-5 py-2.5 font-mono">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {queryResult.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-5 py-2.5 text-slate-800">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* DDL Scripts Viewer */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Script selector tabs */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {SQL_SCRIPTS.map(script => (
                <button
                  key={script.id}
                  onClick={() => setSelectedScriptId(script.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    selectedScriptId === script.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {script.name}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (language === 'ar' ? 'تم النسخ' : 'Copied!') : (language === 'ar' ? 'نسخ الملف' : 'Copy File')}</span>
              </button>

              <button
                onClick={handleDownloadAllSql}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تنزيل حزمة SQL الكاملة' : 'Download Complete Package'}</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {selectedScript.description}
          </div>

          {/* Script Content Viewer */}
          <div className="bg-slate-950 text-slate-200 rounded-lg p-5 font-mono text-xs border border-slate-800 overflow-x-auto max-h-[600px] leading-relaxed">
            <pre>
              <code>{selectedScript.content}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
