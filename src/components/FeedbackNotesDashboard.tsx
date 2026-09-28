import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ProjectFeedbackNote,
  NotePriority,
  NoteStatus,
  UserRole,
} from '../types';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Lock,
  Eye,
  Shield,
  ShieldCheck,
  User,
  Building,
  Briefcase,
  History,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Edit2,
  Trash2,
  Tag,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const FeedbackNotesDashboard: React.FC = () => {
  const {
    currentUser,
    isSupervisor,
    visibleProjectNotes,
    committees,
    visibleMembers,
    addProjectNote,
    updateProjectNoteStatus,
    updateProjectNotePriority,
    addNoteReply,
    updateProjectNote,
    deleteProjectNote,
    language,
    setActiveTab,
  } = useApp();

  const isRtl = language === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  // Selected note for Thread detail modal or dedicated pane
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<number | 'all'>('all');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string | 'all'>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<NotePriority | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<NoteStatus | 'all'>('all');
  const [confidentialOnlyFilter, setConfidentialOnlyFilter] = useState<boolean>(false);
  const [quickFilter, setQuickFilter] = useState<'all' | 'needs_action' | 'my_notes' | 'open' | 'resolved'>('all');

  // New Note Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newProjectId, setNewProjectId] = useState<number>(committees[0]?.id || 1);
  const [newEmployeeId, setNewEmployeeId] = useState<string>(visibleMembers[0]?.employee_id || '');
  const [newPriority, setNewPriority] = useState<NotePriority>('medium');
  const [newStatus, setNewStatus] = useState<NoteStatus>('open');
  const [newIsConfidential, setNewIsConfidential] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<'performance' | 'task_followup' | 'quality' | 'compliance' | 'general'>('task_followup');

  // Thread Reply state
  const [replyMessage, setReplyMessage] = useState('');

  // Edit Note Modal state
  const [editingNote, setEditingNote] = useState<ProjectFeedbackNote | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<NotePriority>('medium');
  const [editIsConfidential, setEditIsConfidential] = useState(false);

  // Quick lookup maps
  const committeeMap = useMemo(() => new Map(committees.map(c => [c.id, c])), [committees]);
  const memberMap = useMemo(() => new Map(visibleMembers.map(m => [m.employee_id, m])), [visibleMembers]);

  // Current selected note object
  const activeNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return visibleProjectNotes.find(n => n.id === selectedNoteId) || null;
  }, [selectedNoteId, visibleProjectNotes]);

  // Current user's mapped employee ID (if any)
  const currentEmployeeId = useMemo(() => {
    const match = currentUser.display_name.match(/EMP-\d+/);
    return match ? match[0] : null;
  }, [currentUser]);

  // Statistics
  const stats = useMemo(() => {
    const total = visibleProjectNotes.length;
    const open = visibleProjectNotes.filter(n => n.status === 'open').length;
    const inProgress = visibleProjectNotes.filter(n => n.status === 'in_progress').length;
    const resolved = visibleProjectNotes.filter(n => n.status === 'resolved').length;
    const closed = visibleProjectNotes.filter(n => n.status === 'closed').length;
    const critical = visibleProjectNotes.filter(n => n.priority === 'critical' && n.status !== 'closed' && n.status !== 'resolved').length;
    const confidential = visibleProjectNotes.filter(n => n.is_confidential).length;

    return { total, open, inProgress, resolved, closed, critical, confidential };
  }, [visibleProjectNotes]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return visibleProjectNotes.filter(note => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const inTitle = note.title.toLowerCase().includes(q);
        const inDesc = note.description.toLowerCase().includes(q);
        const inEmp = note.employee_name.toLowerCase().includes(q) || note.employee_id.toLowerCase().includes(q);
        const inReplies = note.replies.some(r => r.message.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inEmp && !inReplies) return false;
      }

      // Project filter
      if (selectedProjectFilter !== 'all' && note.project_id !== selectedProjectFilter) {
        return false;
      }

      // Employee filter
      if (selectedEmployeeFilter !== 'all' && note.employee_id !== selectedEmployeeFilter) {
        return false;
      }

      // Priority filter
      if (selectedPriorityFilter !== 'all' && note.priority !== selectedPriorityFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all' && note.status !== selectedStatusFilter) {
        return false;
      }

      // Confidential only filter
      if (confidentialOnlyFilter && !note.is_confidential) {
        return false;
      }

      // Quick filter
      if (quickFilter === 'needs_action') {
        const needsAction = (note.priority === 'critical' || note.priority === 'high') && (note.status === 'open' || note.status === 'in_progress');
        if (!needsAction) return false;
      } else if (quickFilter === 'my_notes') {
        if (currentEmployeeId && note.employee_id !== currentEmployeeId) {
          return false;
        }
      } else if (quickFilter === 'open') {
        if (note.status !== 'open') return false;
      } else if (quickFilter === 'resolved') {
        if (note.status !== 'resolved') return false;
      }

      return true;
    });
  }, [
    visibleProjectNotes,
    searchQuery,
    selectedProjectFilter,
    selectedEmployeeFilter,
    selectedPriorityFilter,
    selectedStatusFilter,
    confidentialOnlyFilter,
    quickFilter,
    currentEmployeeId,
  ]);

  // Helper for priority badges
  const getPriorityBadge = (priority: NotePriority) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-300',
          dot: 'bg-rose-600 animate-ping',
          labelAr: 'حرجة / عاجل جداً',
          labelEn: 'Critical',
        };
      case 'high':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-300',
          dot: 'bg-orange-500',
          labelAr: 'عالية الأولوية',
          labelEn: 'High Priority',
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-300',
          dot: 'bg-amber-500',
          labelAr: 'متوسطة',
          labelEn: 'Medium',
        };
      case 'low':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          labelAr: 'منخفضة',
          labelEn: 'Low',
        };
    }
  };

  // Helper for status badges
  const getStatusBadge = (status: NoteStatus) => {
    switch (status) {
      case 'open':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Clock,
          labelAr: 'مفتوحة',
          labelEn: 'Open',
        };
      case 'in_progress':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: RotateCcw,
          labelAr: 'قيد المتابعة',
          labelEn: 'In Progress',
        };
      case 'resolved':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          labelAr: 'تم الحل',
          labelEn: 'Resolved',
        };
      case 'closed':
      default:
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: XCircle,
          labelAr: 'مغلقة',
          labelEn: 'Closed',
        };
    }
  };

  // Create Note Form Submission
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const targetMember = memberMap.get(newEmployeeId);
    const employeeName = targetMember ? targetMember.full_name : newEmployeeId;

    addProjectNote({
      title: newTitle.trim(),
      description: newDescription.trim(),
      project_id: newProjectId,
      employee_id: newEmployeeId,
      employee_name: employeeName,
      priority: newPriority,
      status: newStatus,
      is_confidential: newIsConfidential,
      category: newCategory,
    });

    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setShowCreateModal(false);
  };

  // Send Thread Reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !replyMessage.trim()) return;

    addNoteReply(activeNote.id, replyMessage.trim());
    setReplyMessage('');
  };

  // Open Edit Modal
  const handleOpenEdit = (note: ProjectFeedbackNote) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditDescription(note.description);
    setEditPriority(note.priority);
    setEditIsConfidential(note.is_confidential);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editTitle.trim()) return;

    updateProjectNote(editingNote.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      is_confidential: editIsConfidential,
    });

    setEditingNote(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Control Overview */}
      <div className="bg-gradient-to-r from-[#081B34] via-[#0F315C] to-[#0A2244] border border-[#163B6B] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Soft Background Accent Ambient */}
        <div className="absolute top-0 end-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-[#DFB76C]/20 border border-[#DFB76C]/40 text-[#DFB76C] rounded-lg text-[10px] font-bold tracking-wider uppercase">
                {language === 'ar' ? 'نظام الملاحظات والمتابعات المؤسسي' : 'Enterprise Feedback & Notes System'}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-cyan-300 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentUser.display_name} ({currentUser.role})</span>
              </span>
            </div>

            <h2 className="text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
              <MessageSquare className="w-6 h-6 text-[#DFB76C]" />
              <span>{language === 'ar' ? 'لوحة الملاحظات والتغذية الراجعة المركزية' : 'Central Notes & Feedback Dashboard'}</span>
            </h2>

            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {language === 'ar'
                ? 'توثيق رسمي لكافة التعليقات والملاحظات والتوجيهات على المشاريع والمهام والموظفين، مع محادثات تفاعلية لحظية وسجل تدقيق إجرائي كامل.'
                : 'Central repository for official project directives, performance follow-ups, real-time employee threads, and immutable audit logs.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {isSupervisor && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:brightness-110 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-900/40 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'إنشاء ملاحظة جديدة' : 'Create New Note'}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('supervisor_monitoring')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-[#DFB76C]" />
              <span>{language === 'ar' ? 'مراقبة أداء الموظفين' : 'Supervisor Portal'}</span>
            </button>
          </div>
        </div>

        {/* 6 Key Performance Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-300 font-medium">
              {language === 'ar' ? 'إجمالي الملاحظات' : 'Total Notes'}
            </div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {stats.total}
            </div>
          </div>

          <div className="bg-blue-950/40 backdrop-blur-md rounded-2xl p-3 border border-blue-400/20">
            <div className="text-[11px] text-blue-300 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>{language === 'ar' ? 'مفتوحة' : 'Open'}</span>
            </div>
            <div className="text-xl font-black font-mono text-blue-200 mt-1">
              {stats.open}
            </div>
          </div>

          <div className="bg-purple-950/40 backdrop-blur-md rounded-2xl p-3 border border-purple-400/20">
            <div className="text-[11px] text-purple-300 font-medium flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-purple-400" />
              <span>{language === 'ar' ? 'قيد المتابعة' : 'In Progress'}</span>
            </div>
            <div className="text-xl font-black font-mono text-purple-200 mt-1">
              {stats.inProgress}
            </div>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-md rounded-2xl p-3 border border-emerald-400/20">
            <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{language === 'ar' ? 'تم الحل' : 'Resolved'}</span>
            </div>
            <div className="text-xl font-black font-mono text-emerald-300 mt-1">
              {stats.resolved}
            </div>
          </div>

          <div className="bg-rose-950/40 backdrop-blur-md rounded-2xl p-3 border border-rose-400/30">
            <div className="text-[11px] text-rose-300 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{language === 'ar' ? 'حرجة / عاجلة' : 'Critical'}</span>
            </div>
            <div className="text-xl font-black font-mono text-rose-300 mt-1">
              {stats.critical}
            </div>
          </div>

          <div className="bg-amber-950/30 backdrop-blur-md rounded-2xl p-3 border border-amber-400/20">
            <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>{language === 'ar' ? 'إدارية خاصة' : 'Confidential'}</span>
            </div>
            <div className="text-xl font-black font-mono text-amber-300 mt-1">
              {stats.confidential}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Master-Detail Thread View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter Console & Notes List (col-span-12 or col-span-5 when thread active) */}
        <div className={`${activeNote ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-4`}>
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'ابحث بالعنوان، الموظف، نص الملاحظة أو الردود...'
                    : 'Search notes by title, employee, body or replies...'
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl ps-9 pe-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Quick Action Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setQuickFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                  quickFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {language === 'ar' ? 'جميع الملاحظات' : 'All Notes'}
              </button>

              <button
                onClick={() => setQuickFilter('needs_action')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors flex items-center gap-1 ${
                  quickFilter === 'needs_action'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                <span>{language === 'ar' ? 'تحتاج إلى متابعة أو إجراء' : 'Needs Follow-up'}</span>
              </button>

              {currentEmployeeId && (
                <button
                  onClick={() => setQuickFilter('my_notes')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                    quickFilter === 'my_notes'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {language === 'ar' ? 'الملاحظات المسندة إليّ' : 'Assigned to Me'}
                </button>
              )}

              <button
                onClick={() => setQuickFilter('open')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                  quickFilter === 'open'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {language === 'ar' ? 'المفتوحة' : 'Open'}
              </button>

              <button
                onClick={() => setQuickFilter('resolved')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                  quickFilter === 'resolved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {language === 'ar' ? 'المحلولة' : 'Resolved'}
              </button>
            </div>

            {/* Dropdown Filters (Project, Employee, Priority, Status) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
              {/* Project Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  {language === 'ar' ? 'المشروع:' : 'Project:'}
                </label>
                <select
                  value={selectedProjectFilter}
                  onChange={e => setSelectedProjectFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">{language === 'ar' ? 'جميع المشاريع' : 'All Projects'}</option>
                  {committees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Employee Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  {language === 'ar' ? 'الموظف المعني:' : 'Employee:'}
                </label>
                <select
                  value={selectedEmployeeFilter}
                  onChange={e => setSelectedEmployeeFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">{language === 'ar' ? 'جميع الموظفين' : 'All Employees'}</option>
                  {visibleMembers.map(m => (
                    <option key={m.id} value={m.employee_id}>
                      {m.full_name} ({m.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  {language === 'ar' ? 'الأولوية:' : 'Priority:'}
                </label>
                <select
                  value={selectedPriorityFilter}
                  onChange={e => setSelectedPriorityFilter(e.target.value as NotePriority | 'all')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">{language === 'ar' ? 'جميع الأولويات' : 'All Priorities'}</option>
                  <option value="critical">{language === 'ar' ? '🔴 حرجة' : '🔴 Critical'}</option>
                  <option value="high">{language === 'ar' ? '🟠 عالية' : '🟠 High'}</option>
                  <option value="medium">{language === 'ar' ? '🟡 متوسطة' : '🟡 Medium'}</option>
                  <option value="low">{language === 'ar' ? '⚪ منخفضة' : '⚪ Low'}</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  {language === 'ar' ? 'الحالة:' : 'Status:'}
                </label>
                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value as NoteStatus | 'all')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                  <option value="open">{language === 'ar' ? '🔵 مفتوحة' : '🔵 Open'}</option>
                  <option value="in_progress">{language === 'ar' ? '🟣 قيد المتابعة' : '🟣 In Progress'}</option>
                  <option value="resolved">{language === 'ar' ? '🟢 تم الحل' : '🟢 Resolved'}</option>
                  <option value="closed">{language === 'ar' ? '⚪ مغلقة' : '⚪ Closed'}</option>
                </select>
              </div>
            </div>

            {/* Confidential Toggle (Supervisor only) */}
            {isSupervisor && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confidentialOnlyFilter}
                    onChange={e => setConfidentialOnlyFilter(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-amber-800 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'ar' ? 'عرض الملاحظات السرية والإدارية الخاصة فقط' : 'Show Confidential / Administrative Notes Only'}</span>
                  </span>
                </label>

                <span className="text-[11px] text-slate-400 font-mono">
                  {filteredNotes.length} {language === 'ar' ? 'ملاحظة مطابقة' : 'matching notes'}
                </span>
              </div>
            )}
          </div>

          {/* Notes Cards Stream */}
          <div className="space-y-3">
            {filteredNotes.map(note => {
              const project = committeeMap.get(note.project_id);
              const priorityCfg = getPriorityBadge(note.priority);
              const statusCfg = getStatusBadge(note.status);
              const StatusIcon = statusCfg.icon;
              const isSelected = selectedNoteId === note.id;

              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`bg-white border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/15 bg-blue-50/20'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar of Note Card */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Confidentiality tag */}
                      {note.is_confidential && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                          <Lock className="w-3 h-3 text-amber-700" />
                          <span>{language === 'ar' ? 'سري إداري' : 'Confidential'}</span>
                        </span>
                      )}

                      {/* Project Tag */}
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 truncate max-w-[200px]">
                        {project?.name || (language === 'ar' ? 'مشروع عام' : 'Project')}
                      </span>

                      {/* Priority Tag */}
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${priorityCfg.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                        <span>{language === 'ar' ? priorityCfg.labelAr : priorityCfg.labelEn}</span>
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1 shrink-0 ${statusCfg.bg}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? statusCfg.labelAr : statusCfg.labelEn}</span>
                    </span>
                  </div>

                  {/* Note Title */}
                  <h4 className="text-sm font-bold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                    {note.title}
                  </h4>

                  {/* Note Excerpt */}
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {note.description}
                  </p>

                  {/* Bottom Meta & Employee Assignment */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                        {note.employee_name.slice(0, 1)}
                      </div>
                      <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[140px]">
                        {note.employee_name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        ({note.employee_id})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                        <span>{note.replies.length} {language === 'ar' ? 'ردود' : 'replies'}</span>
                      </span>

                      <span className="font-mono text-slate-400 hidden sm:inline">
                        {note.created_at.slice(5)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold">
                  {language === 'ar' ? 'لا توجد ملاحظات مطابقة لمعايير البحث الحالية' : 'No notes match your current filters'}
                </p>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'جرب تغيير شروط التصفية أو إنشاء ملاحظة جديدة' : 'Try adjusting the search criteria or log a new note'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Note Conversation Thread & Audit Trail (Active when a note is selected) */}
        {activeNote && (
          <div className="lg:col-span-7 space-y-4 animate-in fade-in slide-in-from-end-2 duration-200">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5 sticky top-20">
              {/* Thread Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedNoteId(null)}
                      className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 font-semibold lg:hidden cursor-pointer"
                    >
                      <BackArrow className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'الرجوع للقائمة' : 'Back'}</span>
                    </button>

                    {activeNote.is_confidential && (
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        <span>{language === 'ar' ? 'ملاحظة سرية إدارية' : 'Confidential Note'}</span>
                      </span>
                    )}

                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1 bg-slate-100 text-slate-800">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      <span>{committeeMap.get(activeNote.project_id)?.name || 'Project'}</span>
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getPriorityBadge(activeNote.priority).bg}`}>
                      {language === 'ar' ? getPriorityBadge(activeNote.priority).labelAr : getPriorityBadge(activeNote.priority).labelEn}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {activeNote.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span>
                      {language === 'ar' ? 'الموظف المسؤول:' : 'Assigned Employee:'}{' '}
                      <strong className="text-slate-800">{activeNote.employee_name} ({activeNote.employee_id})</strong>
                    </span>
                    <span>·</span>
                    <span>
                      {language === 'ar' ? 'المشرف المنشئ:' : 'Created by:'}{' '}
                      <strong className="text-slate-800">{activeNote.created_by_name}</strong>
                    </span>
                    <span>·</span>
                    <span className="font-mono">{activeNote.created_at}</span>
                  </div>
                </div>

                {/* Edit & Delete Actions for Supervisor */}
                {isSupervisor && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(activeNote)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer"
                      title={language === 'ar' ? 'تعديل بيانات الملاحظة' : 'Edit Note Details'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        deleteProjectNote(activeNote.id);
                        setSelectedNoteId(null);
                      }}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer"
                      title={language === 'ar' ? 'حذف الملاحظة' : 'Delete Note'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Original Note Body / Directive */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'ar' ? 'نص الملاحظة والتوجيه الإشرافي:' : 'Official Directive / Description:'}</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {activeNote.description}
                </p>
              </div>

              {/* Status Update Quick Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">
                    {language === 'ar' ? 'الحالة الحالية:' : 'Current Status:'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getStatusBadge(activeNote.status).bg}`}>
                    {language === 'ar' ? getStatusBadge(activeNote.status).labelAr : getStatusBadge(activeNote.status).labelEn}
                  </span>
                </div>

                {/* Status Switcher Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['open', 'in_progress', 'resolved', 'closed'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => updateProjectNoteStatus(activeNote.id, st)}
                      disabled={activeNote.status === st}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeNote.status === st
                          ? 'bg-slate-800 text-white opacity-90'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {st === 'open'
                        ? (language === 'ar' ? 'فتح' : 'Open')
                        : st === 'in_progress'
                        ? (language === 'ar' ? 'متابعة' : 'In Progress')
                        : st === 'resolved'
                        ? (language === 'ar' ? 'تم الحل' : 'Resolve')
                        : (language === 'ar' ? 'إغلاق' : 'Close')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation Thread (المحادثة والتواصل المباشر) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>{language === 'ar' ? 'المحادثة وسجل الردود المباشرة' : 'Discussion Thread & Responses'}</span>
                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-mono text-[10px]">
                      {activeNote.replies.length}
                    </span>
                  </h4>

                  <span className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'تواصل فوري بين المشرف والموظف' : 'Direct Supervisor & Employee Chat'}
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="max-h-72 overflow-y-auto space-y-3 p-1">
                  {activeNote.replies.map(reply => {
                    const isCurrentUser = reply.author_id === currentUser.id;
                    const isSupervisorAuthor = reply.author_role === 'supervisor' || reply.author_role === 'ceo';

                    return (
                      <div
                        key={reply.id}
                        className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 space-y-1 shadow-2xs ${
                            isSupervisorAuthor
                              ? 'bg-blue-50/90 border border-blue-200 text-slate-900'
                              : 'bg-slate-100 border border-slate-200 text-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[11px] border-b border-black/5 pb-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              {isSupervisorAuthor && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                              <span>{reply.author_name}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {reply.created_at}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {reply.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {activeNote.replies.length === 0 && (
                    <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                      {language === 'ar'
                        ? 'لا توجد ردود بعد. يمكن للمشرف أو الموظف المعني كتابة أول تعقيب في المربع أدناه.'
                        : 'No replies posted yet. Either supervisor or employee can post updates below.'}
                    </div>
                  )}
                </div>

                {/* Reply Input Form */}
                <form onSubmit={handleSendReply} className="pt-2">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder={
                        language === 'ar'
                          ? 'اكتب رداً أو متابعة على هذه الملاحظة...'
                          : 'Write a response, progress clarification, or action update...'
                      }
                      className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!replyMessage.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'إرسال الرد' : 'Send Reply'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Audit Trail & Activity Log (سجل الإجراءات والتحديثات) */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" />
                    <span>{language === 'ar' ? 'سجل التدقيق والإجراءات التلقائي' : 'Immutable Action Audit Log'}</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeNote.activity_log.length} {language === 'ar' ? 'إجراء موثق' : 'logged entries'}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pe-1">
                  {activeNote.activity_log.map(entry => (
                    <div
                      key={entry.id}
                      className="p-2.5 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs text-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800 text-[11px]">
                            {entry.description}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {language === 'ar' ? 'بواسطة:' : 'By:'} <strong>{entry.user_name}</strong> ({entry.user_role})
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {entry.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE NEW NOTE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'ar' ? 'تسجيل ملاحظة وتغذية راجعة جديدة' : 'Create New Directive / Note'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'عنوان الملاحظة:' : 'Note Title:'} *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: مراجعة خطة جاهزية الخوادم، تأخر توريد أجهزة التتبع...' : 'e.g. Server readiness review, Delivery deviation...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'وصف الملاحظة والتفاصيل:' : 'Detailed Description & Directives:'} *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل الوصف التفصيلي للملاحظة، الأسباب، والإجراءات المتوقعة من الموظف...' : 'Enter full details, expectations, and requested actions...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Project & Employee Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'المشروع المرتبط:' : 'Related Project:'} *
                  </label>
                  <select
                    value={newProjectId}
                    onChange={e => setNewProjectId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none cursor-pointer"
                  >
                    {committees.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'الموظف / عضو الفريق المرتبط:' : 'Related Employee:'} *
                  </label>
                  <select
                    value={newEmployeeId}
                    onChange={e => setNewEmployeeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none cursor-pointer"
                  >
                    {visibleMembers.map(m => (
                      <option key={m.id} value={m.employee_id}>
                        {m.full_name} ({m.employee_id} - {m.title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'درجة الأولوية:' : 'Priority Level:'}
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as NotePriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="low">{language === 'ar' ? '⚪ منخفضة' : 'Low'}</option>
                    <option value="medium">{language === 'ar' ? '🟡 متوسطة' : 'Medium'}</option>
                    <option value="high">{language === 'ar' ? '🟠 عالية' : 'High'}</option>
                    <option value="critical">{language === 'ar' ? '🔴 حرجة / عاجل جداً' : 'Critical'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'حالة الملاحظة الأولية:' : 'Initial Status:'}
                  </label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as NoteStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="open">{language === 'ar' ? 'مفتوحة (جديدة)' : 'Open'}</option>
                    <option value="in_progress">{language === 'ar' ? 'قيد المتابعة' : 'In Progress'}</option>
                    <option value="resolved">{language === 'ar' ? 'تم الحل' : 'Resolved'}</option>
                    <option value="closed">{language === 'ar' ? 'مغلقة' : 'Closed'}</option>
                  </select>
                </div>
              </div>

              {/* Category & Confidentiality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'تصنيف الملاحظة:' : 'Category:'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="task_followup">{language === 'ar' ? 'متابعة مهام وجداول' : 'Task Follow-up'}</option>
                    <option value="performance">{language === 'ar' ? 'تقييم أداء وإنتاجية' : 'Performance'}</option>
                    <option value="quality">{language === 'ar' ? 'جودة وتوريد' : 'Quality'}</option>
                    <option value="compliance">{language === 'ar' ? 'امتثال وحوكمة' : 'Compliance'}</option>
                    <option value="general">{language === 'ar' ? 'ملاحظة عامة' : 'General'}</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-amber-50 border border-amber-200 w-full">
                    <input
                      type="checkbox"
                      checked={newIsConfidential}
                      onChange={e => setNewIsConfidential(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div className="text-start">
                      <div className="font-bold text-amber-900 text-xs flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>{language === 'ar' ? 'ملاحظة سرية إدارية' : 'Confidential Note'}</span>
                      </div>
                      <div className="text-[10px] text-amber-700">
                        {language === 'ar' ? 'مرئية للمشرفين والإدارة العليا فقط' : 'Restricted to supervisors only'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'ar' ? 'حفظ وتوثيق الملاحظة' : 'Save & Log Directive'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NOTE MODAL */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {language === 'ar' ? 'تعديل تفاصيل الملاحظة' : 'Edit Note Details'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ar' ? 'سيتم توثيق كل تعديل تلقائياً في سجل التدقيق الخاص بالملاحظة.' : 'All changes are permanently logged to the audit history.'}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'عنوان الملاحظة:' : 'Title:'}
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'نص الملاحظة:' : 'Description:'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'درجة الأولوية:' : 'Priority:'}
                  </label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as NotePriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="low">{language === 'ar' ? 'منخفضة' : 'Low'}</option>
                    <option value="medium">{language === 'ar' ? 'متوسطة' : 'Medium'}</option>
                    <option value="high">{language === 'ar' ? 'عالية' : 'High'}</option>
                    <option value="critical">{language === 'ar' ? 'حرجة' : 'Critical'}</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsConfidential}
                      onChange={e => setEditIsConfidential(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>{language === 'ar' ? 'ملاحظة سرية' : 'Confidential'}</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'ar' ? 'حفظ التحديثات' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
