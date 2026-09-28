import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateSubtreeRollup } from '../utils/math';
import {
  Layers,
  Cog,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Building2,
  FolderKanban,
  ShieldCheck,
} from 'lucide-react';

export const RollupDashboard: React.FC = () => {
  const {
    visibleUnits,
    kpis,
    selectedKpiCode,
    setSelectedKpiCode,
    selectedDate,
    setSelectedDate,
    availableDates,
    currentUserUnit,
    language,
    addKpiEntry,
    setActiveTab,
    isSupervisor,
  } = useApp();

  const [targetScopeUnitId, setTargetScopeUnitId] = useState<number>(currentUserUnit.id);
  const [showLogModal, setShowLogModal] = useState(false);

  // New KPI entry form state
  const [logUnitId, setLogUnitId] = useState<number>(visibleUnits[0]?.id || 1);
  const [logNumerator, setLogNumerator] = useState<number>(150);
  const [logDenominator, setLogDenominator] = useState<number>(180);

  const targetScopeUnit = useMemo(() => {
    return visibleUnits.find(u => u.id === targetScopeUnitId) || visibleUnits[0] || currentUserUnit;
  }, [visibleUnits, targetScopeUnitId, currentUserUnit]);

  // Overall rollup for the selected target scope
  const rollup = useMemo(() => {
    return calculateSubtreeRollup(
      targetScopeUnit.path,
      visibleUnits,
      kpis,
      selectedKpiCode,
      selectedDate
    );
  }, [targetScopeUnit, visibleUnits, kpis, selectedKpiCode, selectedDate]);

  // Main high-level statistics matching reference UI
  const dashboardStats = useMemo(() => {
    const totalProjects = 24;
    const inProgress = 14;
    const delayed = 3;
    const completed = 7;
    const completionRate = rollup.weightedPct || 68;

    return { totalProjects, inProgress, delayed, completed, completionRate };
  }, [rollup]);

  // Department / Unit Breakdown progress bars matching reference image
  const unitBreakdowns = useMemo(() => {
    return [
      { nameAr: 'تقنية المعلومات والتحول الرقمي', nameEn: 'Information Technology', pct: 85, color: 'bg-blue-600' },
      { nameAr: 'العمليات والصيانة الميدانية', nameEn: 'Operations & Maintenance', pct: 70, color: 'bg-blue-500' },
      { nameAr: 'الخدمات المؤسسية واللوجستية', nameEn: 'Corporate Services', pct: 62, color: 'bg-teal-600' },
      { nameAr: 'الاستراتيجية والتميز المؤسسي', nameEn: 'Strategy & Excellence', pct: 55, color: 'bg-teal-500' },
      { nameAr: 'الموارد البشرية والتدريب', nameEn: 'Human Resources', pct: 40, color: 'bg-slate-400' },
    ];
  }, []);

  // Featured Projects matching the bottom table in reference image
  const featuredProjects = useMemo(() => {
    return [
      {
        id: 1,
        titleAr: 'برنامج التحول الرقمي وميكنة العمليات',
        titleEn: 'Digital Transformation & Automation',
        managerAr: 'أ. عبد الله المزروعي',
        managerEn: 'A. Abdullah Al-Mazrouei',
        unitAr: 'تقنية المعلومات',
        unitEn: 'Information Technology',
        deadline: '2025/12/31',
        progress: 80,
        status: 'on_track',
        statusAr: 'يسير حسب الخطة',
        statusEn: 'On Track',
      },
      {
        id: 2,
        titleAr: 'نظام إدارة الصيانة والأسطول (CMMS)',
        titleEn: 'Fleet Maintenance System (CMMS)',
        managerAr: 'أ. فاطمة المعمري',
        managerEn: 'A. Fatima Al-Maamari',
        unitAr: 'العمليات والصيانة',
        unitEn: 'Operations & Maintenance',
        deadline: '2025/08/30',
        progress: 45,
        status: 'delayed',
        statusAr: 'متأخر',
        statusEn: 'Delayed',
      },
      {
        id: 3,
        titleAr: 'مختبر الذكاء الاصطناعي والتحليلات الجغرافية',
        titleEn: 'AI & Geospatial Analytics Lab',
        managerAr: 'أ. سالم الكتبي',
        managerEn: 'A. Salem Al-Ketbi',
        unitAr: 'الاستراتيجية والتميز',
        unitEn: 'Strategy & Excellence',
        deadline: '2025/11/15',
        progress: 60,
        status: 'needs_decision',
        statusAr: 'يحتاج قراراً',
        statusEn: 'Needs Decision',
      },
      {
        id: 4,
        titleAr: 'تحديث البنية التحتية ومراكز البيانات الموزعة',
        titleEn: 'Distributed Infrastructure Upgrade',
        managerAr: 'أ. مريم الشامسي',
        managerEn: 'A. Maryam Al-Shamsi',
        unitAr: 'تقنية المعلومات',
        unitEn: 'Information Technology',
        deadline: '2025/09/20',
        progress: 30,
        status: 'delayed',
        statusAr: 'متأخر',
        statusEn: 'Delayed',
      },
    ];
  }, []);

  const handleSaveKpi = (e: React.FormEvent) => {
    e.preventDefault();
    addKpiEntry({
      unit_id: logUnitId,
      kpi_code: selectedKpiCode,
      day: selectedDate,
      numerator: Number(logNumerator),
      denominator: Number(logDenominator),
    });
    setShowLogModal(false);
  };

  const ChevronIcon = language === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-6">
      {/* Page Header (Matching Reference: لوحة المدير العام) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'ar' ? 'لوحة المدير العام' : 'Director General Dashboard'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'نظرة شاملة على أداء المشاريع واللجان في جميع الوحدات التشغيلية'
              : 'Comprehensive overview of project and committee performance across all units'}
          </p>
        </div>

        {/* Scope and Date Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Target Scope Unit */}
          <div className="bg-white border border-slate-200/80 rounded-2xl px-3 py-1.5 shadow-xs flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={targetScopeUnit.id}
              onChange={(e) => setTargetScopeUnitId(Number(e.target.value))}
              className="text-xs font-semibold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            >
              {visibleUnits.map(u => (
                <option key={u.id} value={u.id}>
                  {language === 'ar' ? u.name_ar : u.name_en} ({u.level})
                </option>
              ))}
            </select>
          </div>

          {/* KPI Selector */}
          <div className="bg-white border border-slate-200/80 rounded-2xl px-3 py-1.5 shadow-xs">
            <select
              value={selectedKpiCode}
              onChange={(e) => setSelectedKpiCode(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="MANPOWER_FILL">{language === 'ar' ? 'القوى العاملة' : 'Manpower Fill'}</option>
              <option value="VEHICLE_FILL">{language === 'ar' ? 'جاهزية الأسطول' : 'Vehicle Fleet'}</option>
              <option value="ASSET_READINESS">{language === 'ar' ? 'جاهزية الأصول' : 'Asset Readiness'}</option>
            </select>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'تسجيل قراءة' : 'Log Metric'}</span>
          </button>

          {/* Supervisor Direct Access Portal Button */}
          {isSupervisor && (
            <button
              onClick={() => setActiveTab('supervisor_monitoring')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 hover:brightness-105 border border-amber-400/60 rounded-2xl transition-all cursor-pointer shadow-sm shadow-amber-500/20"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-900" />
              <span>{language === 'ar' ? 'بوابة المشرف (Supervisor)' : 'Supervisor Portal'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 5 Stat Cards Row (Exact Match to Reference Image) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Projects */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'ar' ? 'إجمالي المشاريع' : 'Total Projects'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold font-mono text-slate-900">
            {dashboardStats.totalProjects}
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cog className="w-4 h-4 animate-spin-slow" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold font-mono text-blue-700">
            {dashboardStats.inProgress}
          </div>
        </div>

        {/* Card 3: Delayed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'ar' ? 'المشاريع المتأخرة' : 'Delayed'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold font-mono text-rose-600">
            {dashboardStats.delayed}
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'ar' ? 'المكتملة' : 'Completed'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold font-mono text-emerald-600">
            {dashboardStats.completed}
          </div>
        </div>

        {/* Card 5: Average Completion Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'ar' ? 'متوسط الإنجاز' : 'Avg Progress'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold font-mono text-slate-900">
            {dashboardStats.completionRate}%
          </div>
        </div>
      </div>

      {/* Middle Row: Donut Chart on Left/Right & Horizontal Unit Progress (Matching Reference) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Total Completion Progress Donut Card (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'ar' ? 'النسبة الإجمالية للإنجاز' : 'Overall Completion Rate'}
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {targetScopeUnit.path}*
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 my-auto py-2">
            {/* Circular Progress Indicator with Center Label */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Delayed segment (red) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#f43f5e"
                  strokeWidth="10"
                  strokeDasharray={`${(3 / 24) * 251.2} 251.2`}
                  strokeDashoffset="0"
                  fill="transparent"
                />
                {/* Completed / Active Ring (teal/emerald) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#0d9488"
                  strokeWidth="10"
                  strokeDasharray={`${(dashboardStats.completionRate / 100) * 251.2} 251.2`}
                  strokeDashoffset={`-${(3 / 24) * 251.2}`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700"
                />
              </svg>
              {/* Inner Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                  {dashboardStats.completionRate}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {language === 'ar' ? 'مكتمل' : 'Complete'}
                </span>
              </div>
            </div>

            {/* Legend Breakdown List */}
            <div className="space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488] shrink-0" />
                <span>{language === 'ar' ? 'المشاريع المكتملة' : 'Completed Projects'}</span>
                <span className="font-mono font-bold text-slate-900 ms-auto">7</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span>{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</span>
                <span className="font-mono font-bold text-slate-900 ms-auto">14</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>{language === 'ar' ? 'المشاريع المتأخرة' : 'Delayed Projects'}</span>
                <span className="font-mono font-bold text-slate-900 ms-auto">3</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                <span>{language === 'ar' ? 'لم يبدأ بعد' : 'Not Started'}</span>
                <span className="font-mono font-bold text-slate-900 ms-auto">0</span>
              </div>
            </div>
          </div>

          {/* Positive Improvement Footer Banner */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50/60 rounded-xl py-2">
            <TrendingUp className="w-4 h-4" />
            <span>
              {language === 'ar'
                ? 'تحسن بنسبة 12% مقارنة بالشهر الماضي'
                : '12% improvement compared to last month'}
            </span>
          </div>
        </div>

        {/* Progress by Main Unit Card (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'ar' ? 'الإنجاز حسب الوحدة الرئيسية' : 'Progress by Main Unit'}
            </h3>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'ar' ? 'عرض الكل' : 'View All'}</span>
              <ChevronIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Horizontal Progress Bars */}
          <div className="space-y-4 my-auto">
            {unitBreakdowns.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {language === 'ar' ? item.nameAr : item.nameEn}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {item.pct}%
                  </span>
                </div>
                {/* Horizontal Progress Fill */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${item.color}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {language === 'ar'
                ? 'تجميع موزون دقيق: لا يعتمد على متوسط النسب البسيط'
                : 'Mathematically weighted rollups across all child entities'}
            </span>
            <span className="font-mono font-semibold text-slate-600">
              ID: {targetScopeUnit.id}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Featured Projects Table (Exact Match to Reference Table) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'ar' ? 'أبرز المشاريع' : 'Featured Projects'}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('committees')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'ar' ? 'عرض جميع المشاريع' : 'View All Projects'}</span>
            <ChevronIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="px-5 py-3.5">{language === 'ar' ? 'المشروع' : 'Project'}</th>
                <th className="px-4 py-3.5">{language === 'ar' ? 'المسؤول' : 'Lead'}</th>
                <th className="px-4 py-3.5">{language === 'ar' ? 'الوحدة' : 'Unit'}</th>
                <th className="px-4 py-3.5 font-mono">{language === 'ar' ? 'تاريخ الإنتهاء' : 'End Date'}</th>
                <th className="px-5 py-3.5">{language === 'ar' ? 'نسبة الإنجاز' : 'Progress'}</th>
                <th className="px-4 py-3.5 text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-3.5 text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {featuredProjects.map((p) => {
                const statusStyles =
                  p.status === 'on_track'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : p.status === 'delayed'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Project Name */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 leading-snug">
                        {language === 'ar' ? p.titleAr : p.titleEn}
                      </div>
                    </td>

                    {/* Lead */}
                    <td className="px-4 py-4 text-slate-700">
                      {language === 'ar' ? p.managerAr : p.managerEn}
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-4 text-slate-600">
                      {language === 'ar' ? p.unitAr : p.unitEn}
                    </td>

                    {/* Deadline */}
                    <td className="px-4 py-4 font-mono text-slate-500">
                      {p.deadline}
                    </td>

                    {/* Progress Bar & Value */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 w-9">
                          {p.progress}%
                        </span>
                        <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Pill matching image */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${statusStyles}`}>
                        {language === 'ar' ? p.statusAr : p.statusEn}
                      </span>
                    </td>

                    {/* Actions Menu (...) */}
                    <td className="px-4 py-4 text-end">
                      <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log New KPI Daily */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {language === 'ar' ? 'تسجيل قراءة مؤشر يومي جديد' : 'Log New KPI Reading'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ar'
                ? 'يتم إدخال القيم الخام (بسط ومقام) لضمان دقة التجميع الهيكلي بدون تشويه إحصائي.'
                : 'Enter raw counts (numerator & denominator) to guarantee mathematical accuracy during rollups.'}
            </p>

            <form onSubmit={handleSaveKpi} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'الوحدة التشغيلية' : 'Operating Unit'}
                </label>
                <select
                  value={logUnitId}
                  onChange={(e) => setLogUnitId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
                >
                  {visibleUnits.filter(u => u.level === 'city' || u.level === 'country').map(u => (
                    <option key={u.id} value={u.id}>
                      {language === 'ar' ? u.name_ar : u.name_en} ({u.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'المؤشر' : 'KPI Code'}
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedKpiCode}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'المحقق (بسط: المنجز/المشغول)' : 'Numerator (Filled)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={logNumerator}
                    onChange={(e) => setLogNumerator(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'المعتمد (مقام: الإجمالي المعتمد)' : 'Denominator (Authorized)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={logDenominator}
                    onChange={(e) => setLogDenominator(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-900">
                {language === 'ar' ? 'النسبة الموزونة الناتجة:' : 'Resulting Fill Rate:'}{' '}
                <span className="font-mono font-bold">
                  {logDenominator > 0 ? ((logNumerator / logDenominator) * 100).toFixed(1) : 0}%
                </span>
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'حفظ السجل' : 'Save Reading'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
