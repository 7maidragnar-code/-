import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { computeMemberProgressMetrics } from '../utils/math';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Check,
  Activity,
} from 'lucide-react';

export const ProgressForecaster: React.FC = () => {
  const {
    visibleMembers,
    committees,
    visibleUnits,
    progressRecords,
    addProgressRecord,
    language,
  } = useApp();

  const [selectedCommitteeId, setSelectedCommitteeId] = useState<number | 'all'>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMemberId, setLogMemberId] = useState<number>(visibleMembers[0]?.id || 1);
  const [logPct, setLogPct] = useState<number>(85);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const unitMap = useMemo(() => {
    return new Map(visibleUnits.map(u => [u.id, u]));
  }, [visibleUnits]);

  const committeeMap = useMemo(() => {
    return new Map(committees.map(c => [c.id, c]));
  }, [committees]);

  // Compute calculated metrics for all visible members
  const memberMetrics = useMemo(() => {
    return visibleMembers
      .filter(m => selectedCommitteeId === 'all' || m.committee_id === selectedCommitteeId)
      .map(m => {
        const comm = committeeMap.get(m.committee_id);
        const loc = unitMap.get(m.location_id || -1);
        const ben = unitMap.get(m.beneficiary_id || -1);

        const commName = comm?.name || '';
        const locName = loc ? (language === 'ar' ? loc.name_ar : loc.name_en) : '';
        const benName = ben ? (language === 'ar' ? ben.name_ar : ben.name_en) : '';

        return computeMemberProgressMetrics(m, progressRecords, commName, locName, benName);
      });
  }, [visibleMembers, selectedCommitteeId, committeeMap, unitMap, progressRecords, language]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (memberMetrics.length === 0) return { avgPct: 0, completedCount: 0, stalledCount: 0 };
    const avgPct = Math.round(
      memberMetrics.reduce((acc, curr) => acc + curr.currentPercentage, 0) / memberMetrics.length
    );
    const completedCount = memberMetrics.filter(m => m.status === 'completed').length;
    const stalledCount = memberMetrics.filter(m => m.status === 'stalled' || m.status === 'lagging').length;

    return { avgPct, completedCount, stalledCount };
  }, [memberMetrics]);

  const handleLogProgress = (e: React.FormEvent) => {
    e.preventDefault();
    addProgressRecord(logMemberId, today, Number(logPct));
    setShowLogModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>
              {language === 'ar'
                ? 'متابعة تسارع الإنجاز والتنبؤ بمدد الاكتمال'
                : 'Progress Velocity & Completion Forecasting'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ar'
              ? 'تطبيق دوال النوافذ (Window Functions) لحساب التسارع اليومي، المتوسط المتحرك 7 أيام، وتاريخ الإنجاز المتوقع.'
              : 'Executes SQL Window functions (LAG, Moving AVG) to compute acceleration velocity and days-to-completion.'}
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'تحديث نسبة اليوم' : 'Update Today\'s Progress'}</span>
        </button>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">
            {language === 'ar' ? 'متوسط نسبة الإنجاز العام' : 'Overall Completion Average'}
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-slate-900">
            {stats.avgPct}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${stats.avgPct}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'ar' ? 'المكتمل بنسبة 100%' : '100% Completed Deliverables'}</span>
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-emerald-600">
            {stats.completedCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {language === 'ar' ? 'مهمة تم إنجازها بنجاح' : 'tasks reached full completion'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'ar' ? 'مهام متأخرة أو متوقفة التسارع' : 'Stalled / Lagging Velocity'}</span>
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-amber-600">
            {stats.stalledCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {language === 'ar' ? 'تحتاج إلى مراجعة وتذليل معوقات' : 'requires escalation or unblocking'}
          </div>
        </div>
      </div>

      {/* SQL Formula Code Preview */}
      <div className="bg-slate-900 text-slate-300 rounded-lg p-4 text-xs font-mono border border-slate-800 overflow-x-auto">
        <div className="text-slate-400 mb-1 text-[11px] uppercase font-sans">
          {language === 'ar' ? 'صيغة حساب النوافذ الرياضية (Window Function):' : 'PostgreSQL Window Function Query:'}
        </div>
        <code>
          {`percentage - LAG(percentage, 1) OVER (PARTITION BY member_id ORDER BY day) AS daily_velocity,\n` +
           `AVG(percentage) OVER (PARTITION BY member_id ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7d,\n` +
           `CASE WHEN daily_velocity > 0 THEN CEIL((100 - percentage) / daily_velocity) ELSE NULL END AS estimated_days`}
        </code>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedCommitteeId('all')}
          className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap cursor-pointer ${
            selectedCommitteeId === 'all'
              ? 'bg-slate-900 text-white font-medium'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {language === 'ar' ? 'جميع اللجان' : 'All Committees'}
        </button>
        {committees.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCommitteeId(c.id)}
            className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap cursor-pointer ${
              selectedCommitteeId === c.id
                ? 'bg-slate-900 text-white font-medium'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Detailed Member Progress Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-5 py-3">{language === 'ar' ? 'العضو والمهمة' : 'Member & Committee'}</th>
                <th className="px-5 py-3 text-right">{language === 'ar' ? 'نسبة الإنجاز الحالية' : 'Current Progress'}</th>
                <th className="px-5 py-3 text-right">{language === 'ar' ? 'التسارع اليومي' : 'Daily Velocity'}</th>
                <th className="px-5 py-3 text-right">{language === 'ar' ? 'المتوسط المتحرك (7 أيام)' : '7-Day Moving Avg'}</th>
                <th className="px-5 py-3 text-center">{language === 'ar' ? 'المدة التقديرية للاكتمال' : 'Forecast Days'}</th>
                <th className="px-6 py-3 text-center">{language === 'ar' ? 'مسار الـ 14 يوماً' : '14-Day Trajectory'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberMetrics.map((row) => {
                const isComplete = row.status === 'completed';
                const isStalled = row.status === 'stalled';

                return (
                  <tr key={row.member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">
                        {row.member.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {row.member.title} · <span className="text-slate-400">{row.committeeName}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              isComplete ? 'bg-emerald-600' : isStalled ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${row.currentPercentage}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-900 w-12 text-right">
                          {row.currentPercentage}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-medium">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          row.dailyVelocity > 0
                            ? 'text-emerald-700'
                            : row.dailyVelocity === 0
                            ? 'text-slate-400'
                            : 'text-rose-600'
                        }`}
                      >
                        <TrendingUp className="w-3 h-3" />
                        {row.dailyVelocity > 0 ? `+${row.dailyVelocity}` : row.dailyVelocity}%
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                      {row.movingAvg7d}%
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {isComplete ? (
                        <span className="text-xs font-semibold text-emerald-700">
                          {language === 'ar' ? 'مكتمل بنجاح' : 'Completed'}
                        </span>
                      ) : row.estimatedDaysToCompletion !== null ? (
                        <span className="font-mono font-medium text-slate-800 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {language === 'ar'
                              ? `${row.estimatedDaysToCompletion} يوم تقريباً`
                              : `~${row.estimatedDaysToCompletion} days`}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600">
                          {language === 'ar' ? 'متوقف / غير محدد' : 'Stalled'}
                        </span>
                      )}
                    </td>

                    {/* Mini SVG Sparkline */}
                    <td className="px-6 py-3.5 text-center">
                      <div className="w-24 h-6 mx-auto flex items-end gap-0.5">
                        {row.history.map((pt, i) => (
                          <div
                            key={i}
                            className={`w-1.5 rounded-t-xs transition-all ${
                              isComplete ? 'bg-emerald-400' : 'bg-indigo-300'
                            }`}
                            style={{ height: `${Math.max(15, (pt.percentage / 100) * 24)}px` }}
                            title={`${pt.day}: ${pt.percentage}%`}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Update Today's Progress */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              {language === 'ar' ? 'تسجيل نسبة إنجاز جديدة' : 'Record Today\'s Member Progress'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ar'
                ? 'يتم تحديث سجل التاريخ اليومي لإعادة احتساب التسارع ومتوسط 7 أيام تلقائياً.'
                : 'Updates the daily progress log to recalculate velocity and moving averages.'}
            </p>

            <form onSubmit={handleLogProgress} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'العضو' : 'Member'}
                </label>
                <select
                  value={logMemberId}
                  onChange={(e) => setLogMemberId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                >
                  {visibleMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.employee_id || m.ref_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'نسبة الإنجاز (0 إلى 100%)' : 'Percentage (0 - 100%)'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={logPct}
                    onChange={(e) => setLogPct(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="font-mono font-bold text-sm text-slate-900 w-12 text-right">
                    {logPct}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تسجيل النسبة' : 'Save Progress'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
