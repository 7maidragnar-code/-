import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CommitteeMember, SupervisorFeedback, ProjectStatusType } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Search,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Edit3,
  Trash2,
  Lock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Building,
  Calendar,
  MessageSquare,
  Sparkles,
  Check,
  Layers,
  Filter,
} from 'lucide-react';

export const SupervisorMonitoring: React.FC = () => {
  const {
    isSupervisor,
    currentUser,
    visibleMembers,
    committees,
    visibleUnits,
    progressRecords,
    feedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    language,
    setActiveTab,
  } = useApp();

  const ChevronIcon = language === 'ar' ? ChevronLeft : ChevronRight;
  const BackArrowIcon = language === 'ar' ? ArrowRight : ChevronLeft;

  // Selected member for drilling down into employee profile
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  // Search & filter in team members list
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatusType>('all');
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<number | 'all'>('all');

  // Feedback form state
  const [feedbackProjectTargetId, setFeedbackProjectTargetId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackPriority, setFeedbackPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editingFeedbackId, setEditingFeedbackId] = useState<number | null>(null);

  // Lookup maps
  const unitMap = useMemo(() => new Map(visibleUnits.map(u => [u.id, u])), [visibleUnits]);
  const committeeMap = useMemo(() => new Map(committees.map(c => [c.id, c])), [committees]);

  // Selected member object
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return visibleMembers.find(m => m.id === selectedMemberId) || null;
  }, [selectedMemberId, visibleMembers]);

  // Calculate project assignment details for each team member
  const memberProjectProfiles = useMemo(() => {
    return visibleMembers.map(member => {
      // Find latest progress for this member
      const memberProgressHistory = progressRecords
        .filter(p => p.member_id === member.id)
        .sort((a, b) => a.day.localeCompare(b.day));

      const latestProgress = memberProgressHistory.length > 0
        ? memberProgressHistory[memberProgressHistory.length - 1].percentage
        : 65;

      // Project associated with member
      const mainProject = committeeMap.get(member.committee_id);
      const loc = unitMap.get(member.location_id || -1);
      const ben = unitMap.get(member.beneficiary_id || -1);

      // Derive project status based on progress
      let status: ProjectStatusType = 'on_track';
      if (latestProgress >= 100) {
        status = 'completed';
      } else if (latestProgress < 40) {
        status = 'delayed';
      } else if (latestProgress < 60) {
        status = 'incomplete';
      } else {
        status = 'on_track';
      }

      // Simulated secondary project contributions (for multi-project matrix governance)
      const assignedProjects = [
        {
          id: mainProject ? mainProject.id : 1,
          name: mainProject ? mainProject.name : (language === 'ar' ? 'المشروع الرئيسي' : 'Primary Project'),
          type: mainProject?.type || 'project',
          roleInProject: member.title,
          progress: latestProgress,
          status,
          contributionWeight: 70, // % of member's total allocation
          tasksCompleted: Math.round((latestProgress / 100) * 12),
          tasksTotal: 12,
          lastActivity: memberProgressHistory.length > 0 ? memberProgressHistory[memberProgressHistory.length - 1].day : '2026-09-26',
        },
      ];

      // Add secondary project for key engineers/managers
      if (member.id % 2 === 0) {
        const secondaryProject = committees.find(c => c.id !== member.committee_id) || committees[0];
        const secProgress = Math.max(25, (latestProgress - 15) % 100);
        let secStatus: ProjectStatusType = secProgress >= 100 ? 'completed' : secProgress < 40 ? 'delayed' : 'on_track';

        assignedProjects.push({
          id: secondaryProject.id,
          name: secondaryProject.name,
          type: secondaryProject.type || 'project',
          roleInProject: language === 'ar' ? 'مستشار فني مساند' : 'Supporting Technical Consultant',
          progress: secProgress,
          status: secStatus,
          contributionWeight: 30,
          tasksCompleted: Math.round((secProgress / 100) * 8),
          tasksTotal: 8,
          lastActivity: '2026-09-25',
        });
      }

      const totalWeightedProgress = Math.round(
        assignedProjects.reduce((acc, p) => acc + (p.progress * (p.contributionWeight / 100)), 0)
      );

      return {
        member,
        locationName: loc ? (language === 'ar' ? loc.name_ar : loc.name_en) : '—',
        beneficiaryName: ben ? (language === 'ar' ? ben.name_ar : ben.name_en) : '—',
        assignedProjects,
        overallProgress: totalWeightedProgress,
        primaryStatus: status,
      };
    });
  }, [visibleMembers, progressRecords, committeeMap, unitMap, committees, language]);

  // Filtered members list
  const filteredMemberList = useMemo(() => {
    return memberProjectProfiles.filter(item => {
      // Search
      const q = memberSearchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        item.member.full_name.toLowerCase().includes(q) ||
        item.member.employee_id.toLowerCase().includes(q) ||
        item.member.title.toLowerCase().includes(q) ||
        item.assignedProjects.some(p => p.name.toLowerCase().includes(q));

      // Status
      const matchesStatus = statusFilter === 'all' || item.primaryStatus === statusFilter;

      // Project filter
      const matchesProject = selectedProjectIdFilter === 'all' ||
        item.assignedProjects.some(p => p.id === selectedProjectIdFilter);

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [memberProjectProfiles, memberSearchQuery, statusFilter, selectedProjectIdFilter]);

  // Selected member profile data
  const selectedMemberProfile = useMemo(() => {
    if (!selectedMember) return null;
    return memberProjectProfiles.find(p => p.member.id === selectedMember.id) || null;
  }, [selectedMember, memberProjectProfiles]);

  // Feedbacks associated with the selected member
  const memberFeedbacks = useMemo(() => {
    if (!selectedMember) return [];
    return feedbacks.filter(f => f.employee_id === selectedMember.employee_id);
  }, [selectedMember, feedbacks]);

  // Helper status color badges
  const getStatusBadge = (status: ProjectStatusType) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          labelAr: 'مكتمل (100%)',
          labelEn: 'Completed',
          barColor: 'bg-emerald-500',
        };
      case 'on_track':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Clock,
          labelAr: 'جاري وقيد التنفيذ',
          labelEn: 'Ongoing / On Track',
          barColor: 'bg-blue-600',
        };
      case 'delayed':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertTriangle,
          labelAr: 'متأخر عن الخطة',
          labelEn: 'Delayed',
          barColor: 'bg-rose-500',
        };
      case 'incomplete':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertTriangle,
          labelAr: 'غير مكتمل / يحتاج دعم',
          labelEn: 'Incomplete / Needs Push',
          barColor: 'bg-amber-500',
        };
    }
  };

  // Submit Feedback Handler
  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !feedbackText.trim()) return;

    const targetProjId = feedbackProjectTargetId || selectedMember.committee_id;

    if (editingFeedbackId) {
      updateFeedback(editingFeedbackId, feedbackText.trim(), feedbackPriority);
      setEditingFeedbackId(null);
    } else {
      addFeedback({
        employee_id: selectedMember.employee_id,
        project_id: targetProjId,
        supervisor_id: currentUser.id,
        supervisor_name: currentUser.display_name,
        feedback_text: feedbackText.trim(),
        priority: feedbackPriority,
      });
    }

    setFeedbackText('');
  };

  const handleStartEdit = (f: SupervisorFeedback) => {
    setEditingFeedbackId(f.id);
    setFeedbackText(f.feedback_text);
    setFeedbackPriority(f.priority);
    setFeedbackProjectTargetId(f.project_id);
  };

  const handleCancelEdit = () => {
    setEditingFeedbackId(null);
    setFeedbackText('');
  };

  // ==========================================
  // ACCESS DENIED VIEW FOR NON-SUPERVISORS
  // ==========================================
  if (!isSupervisor) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-rose-200/80 rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {language === 'ar' ? 'صلاحية محصورة بالمشرف العام (Supervisor Only)' : 'Supervisor Role Required'}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            {language === 'ar'
              ? 'عذراً، هذه الواجهة مخصصة حصرياً للمشرف العام لمراقبة الأداء الفردي لأعضاء الفريق وإرسال التوجيهات والملاحظات. لا يمتلك المستخدمون العاديون حق الاطلاع على تقييمات الأداء الفردية للزملاء.'
              : 'Access to the Supervisor Performance Monitoring and Feedback Hub is strictly role-restricted. Regular users cannot inspect individual peer performances or send executive feedback.'}
          </p>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 text-start space-y-1.5 mb-6 font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">{language === 'ar' ? 'المستخدم الحالي:' : 'Current User:'}</span>
              <span className="font-bold text-slate-900">{currentUser.display_name}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">{language === 'ar' ? 'الدور المسند:' : 'Assigned Role:'}</span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold uppercase">{currentUser.role}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {language === 'ar' ? 'العودة للوحة القيادة' : 'Back to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUPERVISOR WORKSPACE: BREADCRUMB & NAVIGATION
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Top Banner & Path Breadcrumbs */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Strict workflow breadcrumb requested by user: أعضاء الفريق → ملف الموظف → المشاريع → نسبة الإنجاز والملاحظات */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5 flex-wrap">
            <button
              onClick={() => setSelectedMemberId(null)}
              className={`hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer ${
                !selectedMemberId ? 'text-blue-700 font-bold' : ''
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'ar' ? 'أعضاء الفريق' : 'Team Members'}</span>
            </button>

            {selectedMemberId && (
              <>
                <ChevronIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-blue-700 font-bold">
                  {language === 'ar' ? 'ملف الموظف' : 'Employee Profile'}: {selectedMember?.full_name}
                </span>
                <ChevronIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">
                  {language === 'ar' ? 'المشاريع المسندة' : 'Assigned Projects'}
                </span>
                <ChevronIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {language === 'ar' ? 'نسبة الإنجاز والملاحظات' : 'Progress & Feedback'}
                </span>
              </>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>
              {selectedMemberId
                ? (language === 'ar' ? `متابعة إنجاز: ${selectedMember?.full_name}` : `Monitoring: ${selectedMember?.full_name}`)
                : (language === 'ar' ? 'مركز مراقبة أداء الفريق وإدارة الملاحظات' : 'Supervisor Performance & Feedback Hub')}
            </span>
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-[11px] font-bold shadow-xs">
              Supervisor Exclusive
            </span>
          </h2>
        </div>

        {/* Supervisor Badge / Back Button */}
        <div className="flex items-center gap-2">
          {selectedMemberId ? (
            <button
              onClick={() => setSelectedMemberId(null)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <BackArrowIcon className="w-4 h-4" />
              <span>{language === 'ar' ? 'العودة لقائمة الفريق' : 'Back to Team List'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>{language === 'ar' ? `المشرف النشط: ${currentUser.display_name}` : `Active Supervisor: ${currentUser.display_name}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: TEAM MEMBERS DIRECTORY (Master View)              */}
      {/* ========================================================= */}
      {!selectedMemberId && (
        <div className="space-y-5">
          {/* Quick Filter Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3 pointer-events-none" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={e => setMemberSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث بالاسم، الرقم الوظيفي، أو المشروع...' : 'Search by name, ID, or project...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl ps-9 pe-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'الحالة:' : 'Status:'}</span>
              </span>

              {(['all', 'on_track', 'completed', 'delayed', 'incomplete'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {s === 'all'
                    ? (language === 'ar' ? 'الكل' : 'All')
                    : s === 'completed'
                    ? (language === 'ar' ? 'مكتمل' : 'Completed')
                    : s === 'on_track'
                    ? (language === 'ar' ? 'جاري' : 'Ongoing')
                    : s === 'delayed'
                    ? (language === 'ar' ? 'متأخر' : 'Delayed')
                    : (language === 'ar' ? 'غير مكتمل' : 'Incomplete')}
                </button>
              ))}
            </div>

            {/* Project Select Filter */}
            <div className="w-full md:w-auto">
              <select
                value={selectedProjectIdFilter}
                onChange={e => setSelectedProjectIdFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full md:w-56 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'جميع المشاريع' : 'All Projects'}</option>
                {committees.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Members Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMemberList.map(({ member, locationName, assignedProjects, overallProgress, primaryStatus }) => {
              const statusCfg = getStatusBadge(primaryStatus);
              const StatusIcon = statusCfg.icon;
              const feedbackCount = feedbacks.filter(f => f.employee_id === member.employee_id).length;

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top Header Card */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                            {member.full_name}
                          </h4>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {member.employee_id} · {member.title}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${statusCfg.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{language === 'ar' ? statusCfg.labelAr : statusCfg.labelEn}</span>
                      </span>
                    </div>

                    {/* Location & Primary project */}
                    <div className="text-xs text-slate-600 space-y-1 my-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">
                          {assignedProjects[0]?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{locationName}</span>
                        <span>·</span>
                        <span>{assignedProjects.length} {language === 'ar' ? 'مشاريع مسندة' : 'Projects'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">
                        {language === 'ar' ? 'متوسط الإنجاز الكلي' : 'Overall Progress'}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {overallProgress}%
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${statusCfg.barColor}`}
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>

                    {/* Bottom Meta & Action */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                        <span>{feedbackCount} {language === 'ar' ? 'ملاحظات وتوجيهات' : 'Feedback Notes'}</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                        <span>{language === 'ar' ? 'فحص الملف' : 'Inspect Profile'}</span>
                        <ChevronIcon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMemberList.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold">{language === 'ar' ? 'لم يتم العثور على موظفين مطابقين' : 'No team members match this criteria'}</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: EMPLOYEE PROFILE → ASSIGNED PROJECTS → PROGRESS & SUPERVISOR NOTES */}
      {/* ========================================================================= */}
      {selectedMember && selectedMemberProfile && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Employee Hero Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-lg shadow-blue-500/20">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-black text-slate-900">
                      {selectedMember.full_name}
                    </h3>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold text-xs rounded-lg border border-slate-200">
                      {selectedMember.employee_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getStatusBadge(selectedMemberProfile.primaryStatus).bg}`}>
                      {language === 'ar' ? getStatusBadge(selectedMemberProfile.primaryStatus).labelAr : getStatusBadge(selectedMemberProfile.primaryStatus).labelEn}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {selectedMember.title} · {selectedMemberProfile.locationName}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                    <span>{language === 'ar' ? 'رقم التواصل:' : 'Phone:'} <span className="font-mono text-slate-700 font-semibold">{selectedMember.phone}</span></span>
                    <span>·</span>
                    <span>{language === 'ar' ? 'الجهة المستفيدة:' : 'Beneficiary:'} <span className="text-slate-700 font-semibold">{selectedMemberProfile.beneficiaryName}</span></span>
                  </div>
                </div>
              </div>

              {/* Progress Summary Big Metric */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-6 shrink-0">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">
                    {language === 'ar' ? 'معدل الإنجاز الإجمالي' : 'Overall Completion Rate'}
                  </div>
                  <div className="text-3xl font-black font-mono text-blue-700 mt-0.5">
                    {selectedMemberProfile.overallProgress}%
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">
                    {language === 'ar' ? 'المشاريع النشطة' : 'Active Projects'}
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-800 mt-0.5">
                    {selectedMemberProfile.assignedProjects.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Projects & Progress Bars (Detailed) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {language === 'ar' ? 'المشاريع المسندة ومستوى إنجاز المهام' : 'Assigned Projects & Task Progress'}
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {language === 'ar' ? 'عرض تفصيلي لأداء الموظف' : 'Individual Performance Breakdown'}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {selectedMemberProfile.assignedProjects.map(proj => {
                const statusCfg = getStatusBadge(proj.status);
                const StatusIcon = statusCfg.icon;

                return (
                  <div key={proj.id} className="p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h5 className="text-sm font-bold text-slate-900">
                            {proj.name}
                          </h5>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${statusCfg.bg}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{language === 'ar' ? statusCfg.labelAr : statusCfg.labelEn}</span>
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {language === 'ar' ? 'الدور المسند:' : 'Assigned Role:'} <span className="font-semibold text-slate-700">{proj.roleInProject}</span>
                          <span className="mx-2">·</span>
                          {language === 'ar' ? 'وزن المساهمة:' : 'Weight:'} <span className="font-mono text-slate-700">{proj.contributionWeight}%</span>
                        </div>
                      </div>

                      {/* Percentage & Fraction */}
                      <div className="text-end">
                        <div className="text-lg font-black font-mono text-slate-900">
                          {proj.progress}%
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {proj.tasksCompleted} / {proj.tasksTotal} {language === 'ar' ? 'مهام منجزة' : 'tasks done'}
                        </div>
                      </div>
                    </div>

                    {/* Visual Progress Bar (Prominent and Clear) */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${statusCfg.barColor}`}
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>

                    {/* Quick Feedback Action Trigger */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {language === 'ar' ? 'آخر تحديث للنشاط:' : 'Last Activity:'} {proj.lastActivity}
                      </span>
                      <button
                        onClick={() => {
                          setFeedbackProjectTargetId(proj.id);
                          // Scroll smoothly to feedback form
                          const el = document.getElementById('supervisor-feedback-box');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? `إرسال ملاحظة حول هذا المشروع` : `Send feedback on this project`}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Supervisor Feedback & Notes (Add, Edit, View, Delete) */}
          <div id="supervisor-feedback-box" className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span>{language === 'ar' ? 'سجل الملاحظات والتوجيهات المباشرة للموظف' : 'Supervisor Direct Feedback & Guidance'}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'صلاحية حصرية للمشرف العام لإرسال التعليمات، رصد الملاحظات، وتعديلها مباشرة'
                    : 'Exclusive supervisor capability to send, update, and manage official employee performance directives'}
                </p>
              </div>

              <span className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
                {language === 'ar' ? 'بصفتك المشرف العام' : 'Acting as Supervisor'}
              </span>
            </div>

            {/* Input Form for New / Editing Feedback */}
            <form onSubmit={handleSaveFeedback} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>
                    {editingFeedbackId
                      ? (language === 'ar' ? 'تعديل الملاحظة الحالية' : 'Edit Selected Feedback')
                      : (language === 'ar' ? 'إضافة ملاحظة أو توجيه جديد' : 'Add New Directive or Note')}
                  </span>
                </span>

                {editingFeedbackId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
                  >
                    {language === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Target Project */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    {language === 'ar' ? 'المشروع المعني بالملاحظة:' : 'Relevant Project:'}
                  </label>
                  <select
                    value={feedbackProjectTargetId || selectedMemberProfile.assignedProjects[0]?.id || 1}
                    onChange={e => setFeedbackProjectTargetId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {selectedMemberProfile.assignedProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    {language === 'ar' ? 'مستوى الأهمية:' : 'Priority Level:'}
                  </label>
                  <select
                    value={feedbackPriority}
                    onChange={e => setFeedbackPriority(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="high">{language === 'ar' ? '🔴 أولوية عاجلة / تتطلب تدخلاً' : '🔴 High / Urgent'}</option>
                    <option value="medium">{language === 'ar' ? '🟡 أولوية متوسطة / توجيه عام' : '🟡 Medium / Routine'}</option>
                    <option value="low">{language === 'ar' ? '🟢 إشادة / ملاحظة تحسين' : '🟢 Low / Commendation'}</option>
                  </select>
                </div>
              </div>

              {/* Text Area */}
              <div>
                <textarea
                  required
                  rows={3}
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder={
                    language === 'ar'
                      ? 'اكتب توجيهاتك وملاحظاتك حول سير مهام الموظف أو مقترحات تسريع الإنجاز...'
                      : 'Provide constructive feedback, directives on stalled milestones, or recognition...'
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {editingFeedbackId
                      ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                      : (language === 'ar' ? 'إرسال الملاحظة للموظف' : 'Send Feedback to Employee')}
                  </span>
                </button>
              </div>
            </form>

            {/* List of Previous Feedbacks for this Member */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'ar' ? 'الملاحظات الصادرة مسبقاً' : 'Previously Sent Directives'} ({memberFeedbacks.length})
              </h5>

              {memberFeedbacks.length > 0 ? (
                <div className="space-y-3">
                  {memberFeedbacks.map(f => {
                    const project = committeeMap.get(f.project_id);
                    const isHigh = f.priority === 'high';
                    const isMed = f.priority === 'medium';

                    return (
                      <div
                        key={f.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isHigh
                            ? 'bg-rose-50/40 border-rose-200'
                            : isMed
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-emerald-50/40 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">
                              {f.supervisor_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {f.created_at} {f.updated_at && `(${language === 'ar' ? 'معدلة' : 'edited'})`}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700">
                              {project?.name || (language === 'ar' ? 'المشروع العام' : 'General')}
                            </span>
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEdit(f)}
                              title={language === 'ar' ? 'تعديل الملاحظة' : 'Edit Feedback'}
                              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteFeedback(f.id)}
                              title={language === 'ar' ? 'حذف الملاحظة' : 'Delete Feedback'}
                              className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-800 leading-relaxed font-medium">
                          {f.feedback_text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
                  {language === 'ar'
                    ? 'لم يتم إرسال أي ملاحظات سابقة لهذا الموظف حتى الآن. يمكنك إضافة توجيهك الأول عبر النموذج أعلاه.'
                    : 'No previous directives sent to this employee. Use the form above to provide feedback.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
