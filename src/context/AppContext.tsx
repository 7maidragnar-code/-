import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Unit,
  User,
  KpiDaily,
  Committee,
  CommitteeMember,
  CommitteeProgress,
  CommitteeNote,
  ActiveTab,
  SentimentType,
  SupervisorFeedback,
  ProjectFeedbackNote,
  NotePriority,
  NoteStatus,
  NoteReply,
  NoteActivityLog,
  AppNotification,
} from '../types';
import {
  INITIAL_UNITS,
  INITIAL_USERS,
  INITIAL_COMMITTEES,
  INITIAL_COMMITTEE_MEMBERS,
  generateSeedKpis,
  generateSeedProgress,
  generateSeedNotes,
  generateSeedSupervisorFeedbacks,
  generateSeedProjectNotes,
  generateSeedNotifications,
} from '../data/seedData';
import { normalizeArabic } from '../utils/arabic';
import { generateConceptVector } from '../utils/math';

interface AppContextType {
  // Units & Hierarchy
  units: Unit[];
  visibleUnits: Unit[];
  addUnit: (unit: Omit<Unit, 'id' | 'path'>) => void;
  reparentUnit: (unitId: number, newParentId: number | null) => void;
  
  // Users & RLS
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  currentUserUnit: Unit;
  isRlsActive: boolean;

  // KPIs
  kpis: KpiDaily[];
  selectedKpiCode: string;
  setSelectedKpiCode: (code: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableDates: string[];
  addKpiEntry: (entry: KpiDaily) => void;

  // Committees & Members
  committees: Committee[];
  members: CommitteeMember[];
  visibleMembers: CommitteeMember[];
  addMember: (member: Omit<CommitteeMember, 'id' | 'name_normalized'>) => void;
  updateMember: (member: CommitteeMember) => void;

  // Progress
  progressRecords: CommitteeProgress[];
  addProgressRecord: (memberId: number, day: string, percentage: number) => void;

  // Notes
  notes: CommitteeNote[];
  visibleNotes: CommitteeNote[];
  addNote: (memberId: number, body: string, category: string, sentiment: SentimentType) => void;

  // Supervisor Performance & Feedback (Exclusive role access)
  isSupervisor: boolean;
  feedbacks: SupervisorFeedback[];
  addFeedback: (feedback: Omit<SupervisorFeedback, 'id' | 'created_at'>) => void;
  updateFeedback: (id: number, text: string, priority: 'high' | 'medium' | 'low') => void;
  deleteFeedback: (id: number) => void;

  // Enterprise Project Feedback Notes & Followups
  projectNotes: ProjectFeedbackNote[];
  visibleProjectNotes: ProjectFeedbackNote[];
  addProjectNote: (noteData: Omit<ProjectFeedbackNote, 'id' | 'created_at' | 'created_by_id' | 'created_by_name' | 'created_by_role' | 'replies' | 'activity_log'>) => void;
  updateProjectNoteStatus: (noteId: number, newStatus: NoteStatus) => void;
  updateProjectNotePriority: (noteId: number, newPriority: NotePriority) => void;
  addNoteReply: (noteId: number, message: string) => void;
  updateProjectNote: (noteId: number, updates: Partial<Pick<ProjectFeedbackNote, 'title' | 'description' | 'priority' | 'status' | 'is_confidential' | 'category'>>) => void;
  deleteProjectNote: (noteId: number) => void;

  // In-app Notifications
  notifications: AppNotification[];
  userNotifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: number) => void;
  markAllNotificationsRead: () => void;

  // Navigation & Locale
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // CEO default
  
  const [kpis, setKpis] = useState<KpiDaily[]>(() => generateSeedKpis());
  const [selectedKpiCode, setSelectedKpiCode] = useState<string>('MANPOWER_FILL');
  
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const [committees, setCommittees] = useState<Committee[]>(INITIAL_COMMITTEES);
  const [members, setMembers] = useState<CommitteeMember[]>(INITIAL_COMMITTEE_MEMBERS);
  const [progressRecords, setProgressRecords] = useState<CommitteeProgress[]>(() => generateSeedProgress());
  const [notes, setNotes] = useState<CommitteeNote[]>(() => generateSeedNotes());
  const [feedbacks, setFeedbacks] = useState<SupervisorFeedback[]>(() => generateSeedSupervisorFeedbacks());
  const [projectNotes, setProjectNotes] = useState<ProjectFeedbackNote[]>(() => generateSeedProjectNotes());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => generateSeedNotifications());

  // Role-based access: Supervisor exclusive
  const isSupervisor = useMemo(() => {
    return currentUser.role === 'supervisor' || currentUser.role === 'ceo';
  }, [currentUser]);

  // Current employee ID if current user is an employee
  const currentEmployeeId = useMemo(() => {
    const match = currentUser.display_name.match(/EMP-\d+/);
    return match ? match[0] : null;
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [toast, setToast] = useState<string | null>(null);

  // Sync document direction and lang
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Find unit of current user
  const currentUserUnit = useMemo(() => {
    return units.find(u => u.id === currentUser.unit_id) || units[0];
  }, [units, currentUser]);

  // Is RLS restricting view from the global root?
  const isRlsActive = useMemo(() => {
    return currentUserUnit.path !== '/1/';
  }, [currentUserUnit]);

  // Available dates in dataset
  const availableDates = useMemo(() => {
    const set = new Set(kpis.map(k => k.day));
    return Array.from(set).sort().reverse();
  }, [kpis]);

  // Units visible under current user's RLS scope (path LIKE currentUserUnit.path || '%')
  const visibleUnits = useMemo(() => {
    return units.filter(u => u.path.startsWith(currentUserUnit.path));
  }, [units, currentUserUnit]);

  const visibleUnitIds = useMemo(() => {
    return new Set(visibleUnits.map(u => u.id));
  }, [visibleUnits]);

  // Members visible under RLS: location_id OR beneficiary_id in visible units
  const visibleMembers = useMemo(() => {
    return members.filter(m => {
      const locVisible = m.location_id ? visibleUnitIds.has(m.location_id) : true;
      const benVisible = m.beneficiary_id ? visibleUnitIds.has(m.beneficiary_id) : true;
      return locVisible || benVisible;
    });
  }, [members, visibleUnitIds]);

  const visibleMemberIds = useMemo(() => {
    return new Set(visibleMembers.map(m => m.id));
  }, [visibleMembers]);

  // Notes visible under RLS
  const visibleNotes = useMemo(() => {
    return notes.filter(n => visibleMemberIds.has(n.member_id));
  }, [notes, visibleMemberIds]);

  // Reparent Unit and automatically update materialized path across all descendants
  const reparentUnit = (unitId: number, newParentId: number | null) => {
    setUnits(prev => {
      const target = prev.find(u => u.id === unitId);
      if (!target) return prev;
      if (unitId === newParentId) return prev;

      let newParentPath = '/';
      if (newParentId !== null) {
        const parent = prev.find(u => u.id === newParentId);
        if (!parent) return prev;
        // Circular check: new parent cannot be a descendant of target
        if (parent.path.startsWith(target.path)) {
          showToast(language === 'ar' ? 'خطأ: لا يمكن تعيين وحدة تابعة كأب للوحدة الحالية' : 'Error: Circular hierarchy detected');
          return prev;
        }
        newParentPath = parent.path;
      }

      const oldPath = target.path;
      const newPath = `${newParentPath}${target.id}/`;

      const updated = prev.map(u => {
        if (u.id === unitId) {
          return { ...u, parent_id: newParentId, path: newPath };
        }
        if (u.path.startsWith(oldPath)) {
          // Cascade update to descendants
          const subPath = u.path.slice(oldPath.length);
          return { ...u, path: `${newPath}${subPath}` };
        }
        return u;
      });

      return updated;
    });

    showToast(language === 'ar' ? 'تم تحديث التبعية الهيكلية ومسارات الشجرة تلقائياً' : 'Hierarchy updated and paths recalculated');
  };

  // Add new unit with automatic path assignment
  const addUnit = (unitData: Omit<Unit, 'id' | 'path'>) => {
    setUnits(prev => {
      const nextId = Math.max(...prev.map(u => u.id), 0) + 1;
      let path = `/${nextId}/`;
      if (unitData.parent_id) {
        const parent = prev.find(u => u.id === unitData.parent_id);
        if (parent) {
          path = `${parent.path}${nextId}/`;
        }
      }

      const newUnit: Unit = {
        ...unitData,
        id: nextId,
        path,
      };

      return [...prev, newUnit];
    });

    showToast(language === 'ar' ? 'تمت إضافة الوحدة وتوليد المسار الهيكلي بنجاح' : 'New unit created with materialized path');
  };

  // Add KPI entry
  const addKpiEntry = (entry: KpiDaily) => {
    setKpis(prev => {
      // Replace if exists for same unit, code, day
      const filtered = prev.filter(
        k => !(k.unit_id === entry.unit_id && k.kpi_code === entry.kpi_code && k.day === entry.day)
      );
      return [entry, ...filtered];
    });
    showToast(language === 'ar' ? 'تم تسجيل قراءة المؤشر بنجاح' : 'KPI record logged successfully');
  };

  // Add Committee Member
  const addMember = (memberData: Omit<CommitteeMember, 'id' | 'name_normalized'>) => {
    setMembers(prev => {
      const nextId = Math.max(...prev.map(m => m.id), 0) + 1;
      const newMember: CommitteeMember = {
        ...memberData,
        id: nextId,
        name_normalized: normalizeArabic(memberData.full_name),
      };
      return [...prev, newMember];
    });

    showToast(language === 'ar' ? 'تمت إضافة عضو اللجنة وتطبيع الاسم العربي' : 'Member added and Arabic name normalized');
  };

  // Update Member
  const updateMember = (member: CommitteeMember) => {
    setMembers(prev =>
      prev.map(m =>
        m.id === member.id
          ? { ...member, name_normalized: normalizeArabic(member.full_name) }
          : m
      )
    );
    showToast(language === 'ar' ? 'تم تحديث بيانات العضو' : 'Member updated successfully');
  };

  // Add Progress Record
  const addProgressRecord = (memberId: number, day: string, percentage: number) => {
    const clamped = Math.max(0, Math.min(100, percentage));
    setProgressRecords(prev => {
      const filtered = prev.filter(p => !(p.member_id === memberId && p.day === day));
      return [...filtered, { member_id: memberId, day, percentage: clamped }];
    });
    showToast(language === 'ar' ? 'تم تحديث نسبة الإنجاز وحساب التسارع' : 'Progress percentage updated');
  };

  // Add Note with automatic sentiment and category vector embedding
  const addNote = (memberId: number, body: string, category: string, sentiment: SentimentType) => {
    const nextId = Math.max(...notes.map(n => n.id), 0) + 1;
    const summary = body.length > 50 ? body.slice(0, 50) + '...' : body;
    const embedding = generateConceptVector(body + ' ' + summary + ' ' + category);

    const newNote: CommitteeNote = {
      id: nextId,
      member_id: memberId,
      day: today,
      body,
      ai_summary: summary,
      ai_category: category,
      ai_sentiment: sentiment,
      embedding,
    };

    setNotes(prev => [newNote, ...prev]);
    showToast(language === 'ar' ? 'تم حفظ الملاحظة وتوليد المتجه الدلالي 1024' : 'Note saved with 1024-d vector embedding');
  };

  // Supervisor Feedback Handlers
  const addFeedback = (feedbackData: Omit<SupervisorFeedback, 'id' | 'created_at'>) => {
    if (!isSupervisor) {
      showToast(language === 'ar' ? 'عذراً، هذه العملية محصورة بالمشرف العام (Supervisor)' : 'Restricted to Supervisor role only');
      return;
    }
    const nextId = Math.max(...feedbacks.map(f => f.id), 0) + 1;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newFeedback: SupervisorFeedback = {
      ...feedbackData,
      id: nextId,
      created_at: nowStr,
    };
    setFeedbacks(prev => [newFeedback, ...prev]);
    showToast(language === 'ar' ? 'تم إرسال الملاحظة والتوجيه إلى الموظف بنجاح' : 'Supervisor feedback sent successfully');
  };

  const updateFeedback = (id: number, text: string, priority: 'high' | 'medium' | 'low') => {
    if (!isSupervisor) {
      showToast(language === 'ar' ? 'عذراً، هذه العملية محصورة بالمشرف العام (Supervisor)' : 'Restricted to Supervisor role only');
      return;
    }
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setFeedbacks(prev =>
      prev.map(f => (f.id === id ? { ...f, feedback_text: text, priority, updated_at: nowStr } : f))
    );
    showToast(language === 'ar' ? 'تم تعديل الملاحظة بنجاح' : 'Feedback updated successfully');
  };

  const deleteFeedback = (id: number) => {
    if (!isSupervisor) {
      showToast(language === 'ar' ? 'عذراً، هذه العملية محصورة بالمشرف العام (Supervisor)' : 'Restricted to Supervisor role only');
      return;
    }
    setFeedbacks(prev => prev.filter(f => f.id !== id));
    showToast(language === 'ar' ? 'تم حذف التوجيه' : 'Feedback deleted');
  };

  // Visible Project Notes (Role-based access & Confidentiality)
  const visibleProjectNotes = useMemo(() => {
    // Supervisors and CEOs have full visibility into all project notes, including confidential ones
    if (isSupervisor) {
      return projectNotes;
    }

    // Target employee viewing: can view non-confidential notes assigned to their employee_id
    if (currentEmployeeId) {
      return projectNotes.filter(n => n.employee_id === currentEmployeeId && !n.is_confidential);
    }

    // Regional admins or editors: non-confidential notes in their scope
    if (currentUser.role === 'admin' || currentUser.role === 'editor') {
      return projectNotes.filter(n => !n.is_confidential);
    }

    // Viewers: non-confidential notes only
    return projectNotes.filter(n => !n.is_confidential);
  }, [projectNotes, isSupervisor, currentEmployeeId, currentUser]);

  // Notifications filtered for current user
  const userNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (n.target_user_id && n.target_user_id === currentUser.id) return true;
      if (n.target_role === 'supervisor' && isSupervisor) return true;
      if (n.target_employee_id && currentEmployeeId && n.target_employee_id === currentEmployeeId) return true;
      if (n.target_role === 'all') return true;
      return false;
    });
  }, [notifications, currentUser, isSupervisor, currentEmployeeId]);

  const unreadNotificationCount = useMemo(() => {
    return userNotifications.filter(n => !n.read).length;
  }, [userNotifications]);

  const markNotificationRead = (id: number) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast(language === 'ar' ? 'تم تعيين جميع الإشعارات كمقروءة' : 'All notifications marked as read');
  };

  // Add new Project Feedback Note with automatic audit log and real-time notification
  const addProjectNote = (noteData: Omit<ProjectFeedbackNote, 'id' | 'created_at' | 'created_by_id' | 'created_by_name' | 'created_by_role' | 'replies' | 'activity_log'>) => {
    const nextId = Math.max(...projectNotes.map(n => n.id), 0) + 1;
    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const nowAudit = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const initialLog: NoteActivityLog = {
      id: 1,
      user_id: currentUser.id,
      user_name: currentUser.display_name,
      user_role: currentUser.role,
      action_type: 'created',
      description: language === 'ar' ? 'إنشاء الملاحظة وتوجيهها للمتابعة المؤسسية' : 'Note created and assigned for follow-up',
      timestamp: nowAudit,
    };

    const newNote: ProjectFeedbackNote = {
      ...noteData,
      id: nextId,
      created_by_id: currentUser.id,
      created_by_name: currentUser.display_name,
      created_by_role: currentUser.role,
      created_at: nowStr,
      replies: [],
      activity_log: [initialLog],
    };

    setProjectNotes(prev => [newNote, ...prev]);

    // Send notification to the concerned employee
    const notifId = Math.max(...notifications.map(n => n.id), 0) + 1;
    const newNotif: AppNotification = {
      id: notifId,
      target_employee_id: noteData.employee_id,
      title: language === 'ar' ? `ملاحظة جديدة: ${noteData.title}` : `New Note: ${noteData.title}`,
      message: language === 'ar'
        ? `أضاف ${currentUser.display_name} ملاحظة متابعة بدرجة أولوية (${noteData.priority})`
        : `${currentUser.display_name} logged a note with priority (${noteData.priority})`,
      type: 'note_created',
      related_note_id: nextId,
      created_at: nowStr,
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(language === 'ar' ? 'تم تسجيل الملاحظة وتوثيقها وإشعار المعنيين بنجاح' : 'Note logged, audited, and notified successfully');
  };

  // Update Note Status (open, in_progress, resolved, closed) with automatic audit logging
  const updateProjectNoteStatus = (noteId: number, newStatus: NoteStatus) => {
    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const nowAudit = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    let noteTitle = '';
    let targetEmployeeId = '';

    setProjectNotes(prev =>
      prev.map(note => {
        if (note.id !== noteId) return note;
        noteTitle = note.title;
        targetEmployeeId = note.employee_id;

        const logEntry: NoteActivityLog = {
          id: note.activity_log.length + 1,
          user_id: currentUser.id,
          user_name: currentUser.display_name,
          user_role: currentUser.role,
          action_type: newStatus === 'closed' ? 'closed' : newStatus === 'open' && note.status === 'closed' ? 'reopened' : 'status_changed',
          description: language === 'ar'
            ? `تغيير حالة الملاحظة إلى: ${newStatus === 'open' ? 'مفتوحة' : newStatus === 'in_progress' ? 'قيد المتابعة' : newStatus === 'resolved' ? 'تم الحل' : 'مغلقة'}`
            : `Status changed to: ${newStatus}`,
          timestamp: nowAudit,
        };

        return {
          ...note,
          status: newStatus,
          updated_at: nowStr,
          activity_log: [...note.activity_log, logEntry],
        };
      })
    );

    // Notify counterpart
    const notifId = Math.max(...notifications.map(n => n.id), 0) + 1;
    const isUserSupervisor = isSupervisor;
    setNotifications(prev => [
      {
        id: notifId,
        target_employee_id: isUserSupervisor ? targetEmployeeId : undefined,
        target_role: !isUserSupervisor ? 'supervisor' : undefined,
        title: language === 'ar' ? `تحديث حالة الملاحظة: ${noteTitle}` : `Status update: ${noteTitle}`,
        message: language === 'ar'
          ? `تم تغيير الحالة إلى (${newStatus}) بواسطة ${currentUser.display_name}`
          : `Status changed to (${newStatus}) by ${currentUser.display_name}`,
        type: 'status_change',
        related_note_id: noteId,
        created_at: nowStr,
        read: false,
      },
      ...prev,
    ]);

    showToast(language === 'ar' ? 'تم تحديث حالة الملاحظة وتسجيل الإجراء في السجل' : 'Note status updated and audit entry recorded');
  };

  // Update Note Priority
  const updateProjectNotePriority = (noteId: number, newPriority: NotePriority) => {
    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const nowAudit = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    setProjectNotes(prev =>
      prev.map(note => {
        if (note.id !== noteId) return note;

        const logEntry: NoteActivityLog = {
          id: note.activity_log.length + 1,
          user_id: currentUser.id,
          user_name: currentUser.display_name,
          user_role: currentUser.role,
          action_type: 'priority_changed',
          description: language === 'ar'
            ? `تعديل درجة الأولوية إلى: ${newPriority === 'critical' ? 'حرجة' : newPriority === 'high' ? 'عالية' : newPriority === 'medium' ? 'متوسطة' : 'منخفضة'}`
            : `Priority changed to: ${newPriority}`,
          timestamp: nowAudit,
        };

        return {
          ...note,
          priority: newPriority,
          updated_at: nowStr,
          activity_log: [...note.activity_log, logEntry],
        };
      })
    );

    showToast(language === 'ar' ? 'تم تحديث درجة الأولوية وتوثيق الإجراء' : 'Priority level updated and logged');
  };

  // Add reply to Note Conversation Thread
  const addNoteReply = (noteId: number, message: string) => {
    if (!message.trim()) return;
    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const nowAudit = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    let noteTitle = '';
    let targetEmployeeId = '';

    setProjectNotes(prev =>
      prev.map(note => {
        if (note.id !== noteId) return note;
        noteTitle = note.title;
        targetEmployeeId = note.employee_id;

        const newReply: NoteReply = {
          id: note.replies.length + 1,
          author_id: currentUser.id,
          author_name: currentUser.display_name,
          author_role: currentUser.role,
          message: message.trim(),
          created_at: nowStr,
        };

        const logEntry: NoteActivityLog = {
          id: note.activity_log.length + 1,
          user_id: currentUser.id,
          user_name: currentUser.display_name,
          user_role: currentUser.role,
          action_type: 'replied',
          description: language === 'ar' ? `إضافة رد ومتابعة في المحادثة` : `Reply added to discussion thread`,
          timestamp: nowAudit,
        };

        return {
          ...note,
          updated_at: nowStr,
          replies: [...note.replies, newReply],
          activity_log: [...note.activity_log, logEntry],
        };
      })
    );

    // Notify the other party in the thread
    const notifId = Math.max(...notifications.map(n => n.id), 0) + 1;
    const isUserSupervisor = isSupervisor;
    setNotifications(prev => [
      {
        id: notifId,
        target_employee_id: isUserSupervisor ? targetEmployeeId : undefined,
        target_role: !isUserSupervisor ? 'supervisor' : undefined,
        title: language === 'ar' ? `رد جديد: ${noteTitle}` : `New Reply: ${noteTitle}`,
        message: `${currentUser.display_name}: "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"`,
        type: 'note_replied',
        related_note_id: noteId,
        created_at: nowStr,
        read: false,
      },
      ...prev,
    ]);

    showToast(language === 'ar' ? 'تم إرسال الرد وتحديث سجل المحادثة' : 'Reply posted and thread updated');
  };

  // Update note details
  const updateProjectNote = (noteId: number, updates: Partial<Pick<ProjectFeedbackNote, 'title' | 'description' | 'priority' | 'status' | 'is_confidential' | 'category'>>) => {
    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const nowAudit = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    setProjectNotes(prev =>
      prev.map(note => {
        if (note.id !== noteId) return note;

        const logEntry: NoteActivityLog = {
          id: note.activity_log.length + 1,
          user_id: currentUser.id,
          user_name: currentUser.display_name,
          user_role: currentUser.role,
          action_type: 'updated',
          description: language === 'ar' ? 'تحديث بيانات ومحتوى الملاحظة' : 'Note details updated',
          timestamp: nowAudit,
        };

        return {
          ...note,
          ...updates,
          updated_at: nowStr,
          activity_log: [...note.activity_log, logEntry],
        };
      })
    );

    showToast(language === 'ar' ? 'تم حفظ التعديلات وتسجيل الإجراء' : 'Note updated and action logged');
  };

  // Delete note
  const deleteProjectNote = (noteId: number) => {
    setProjectNotes(prev => prev.filter(n => n.id !== noteId));
    showToast(language === 'ar' ? 'تم حذف الملاحظة' : 'Note deleted');
  };

  return (
    <AppContext.Provider
      value={{
        units,
        visibleUnits,
        addUnit,
        reparentUnit,
        users,
        currentUser,
        setCurrentUser,
        currentUserUnit,
        isRlsActive,
        kpis,
        selectedKpiCode,
        setSelectedKpiCode,
        selectedDate,
        setSelectedDate,
        availableDates,
        addKpiEntry,
        committees,
        members,
        visibleMembers,
        addMember,
        updateMember,
        progressRecords,
        addProgressRecord,
        notes,
        visibleNotes,
        addNote,
        isSupervisor,
        feedbacks,
        addFeedback,
        updateFeedback,
        deleteFeedback,
        projectNotes,
        visibleProjectNotes,
        addProjectNote,
        updateProjectNoteStatus,
        updateProjectNotePriority,
        addNoteReply,
        updateProjectNote,
        deleteProjectNote,
        notifications,
        userNotifications,
        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        activeTab,
        setActiveTab,
        language,
        setLanguage,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
