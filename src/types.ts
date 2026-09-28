export type UnitLevel = 'company' | 'continent' | 'region' | 'country' | 'city';
export type UserRole = 'ceo' | 'supervisor' | 'admin' | 'editor' | 'viewer';
export type SentimentType = 'positive' | 'neutral' | 'negative';
export type ProjectStatusType = 'completed' | 'on_track' | 'delayed' | 'incomplete';

export type NotePriority = 'low' | 'medium' | 'high' | 'critical';
export type NoteStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface NoteReply {
  id: number;
  author_id: number;
  author_name: string;
  author_role: UserRole;
  author_avatar?: string;
  message: string;
  created_at: string; // YYYY-MM-DD HH:mm
}

export interface NoteActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  user_role: UserRole;
  action_type: 'created' | 'status_changed' | 'priority_changed' | 'replied' | 'updated' | 'closed' | 'reopened';
  description: string;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
}

export interface ProjectFeedbackNote {
  id: number;
  title: string;
  description: string;
  project_id: number;
  employee_id: string; // Target employee code e.g. 'EMP-1001'
  employee_name: string;
  created_by_id: number;
  created_by_name: string;
  created_by_role: UserRole;
  created_at: string; // YYYY-MM-DD HH:mm
  updated_at?: string;
  priority: NotePriority; // 'low' | 'medium' | 'high' | 'critical'
  status: NoteStatus; // 'open' | 'in_progress' | 'resolved' | 'closed'
  is_confidential: boolean; // Confidential/Administrative note (only for supervisors and executive roles)
  category?: 'performance' | 'task_followup' | 'quality' | 'compliance' | 'general';
  replies: NoteReply[];
  activity_log: NoteActivityLog[];
}

export interface AppNotification {
  id: number;
  target_user_id?: number;
  target_employee_id?: string;
  target_role?: UserRole | 'all';
  title: string;
  message: string;
  type: 'note_created' | 'note_updated' | 'note_replied' | 'note_closed' | 'status_change';
  related_note_id?: number;
  created_at: string;
  read: boolean;
}

export interface SupervisorFeedback {
  id: number;
  employee_id: string; // Target employee code
  project_id: number; // Project/Committee ID
  supervisor_id: number;
  supervisor_name: string;
  feedback_text: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string; // YYYY-MM-DD HH:mm
  updated_at?: string;
}

export interface Unit {
  id: number;
  parent_id: number | null;
  name_ar: string;
  name_en: string;
  level: UnitLevel;
  path: string; // e.g. '/1/4/12/31/'
  latitude: number | null;
  longitude: number | null;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  unit_id: number;
  role: UserRole;
  display_name: string;
}

export interface KpiDaily {
  unit_id: number;
  kpi_code: string; // 'MANPOWER_FILL' | 'VEHICLE_FILL' | 'ASSET_READINESS' | 'COMPLIANCE_RATE'
  day: string; // YYYY-MM-DD
  numerator: number;
  denominator: number;
}

export interface Committee {
  id: number;
  name: string;
  unit_id: number | null;
  description?: string;
  type?: 'committee' | 'project';
}

export interface CommitteeMember {
  id: number;
  committee_id: number;
  employee_id: string; // الرقم الوظيفي
  ref_number?: string; // الرقم المرجعي
  title: string; // المسمى
  full_name: string; // الاسم
  name_normalized: string; // for Arabic fuzzy search
  phone: string; // رقم التواصل
  location_id: number | null; // المكان (units.id)
  beneficiary_id: number | null; // المكان المستفيد (units.id)
}

export interface CommitteeProgress {
  member_id: number;
  day: string; // YYYY-MM-DD
  percentage: number; // 0 to 100
}

export interface CommitteeNote {
  id: number;
  member_id: number;
  day: string;
  body: string;
  ai_summary: string;
  ai_category: string;
  ai_sentiment: SentimentType;
  embedding?: number[]; // 1024 dimension vector concept
}

export interface KpiRollup {
  unit_id: number;
  unit_name_en: string;
  unit_name_ar: string;
  unit_level: UnitLevel;
  path: string;
  total_numerator: number;
  total_denominator: number;
  fill_percentage: number;
  naive_average: number;
  unit_count: number;
}

export interface MemberProgressCalculated {
  member: CommitteeMember;
  committeeName: string;
  locationName: string;
  beneficiaryName: string;
  currentPercentage: number;
  dailyVelocity: number;
  movingAvg7d: number;
  estimatedDaysToCompletion: number | null;
  status: 'completed' | 'on_track' | 'lagging' | 'stalled';
  history: { day: string; percentage: number; velocity: number }[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'feedback_dashboard'
  | 'supervisor_monitoring'
  | 'hierarchy'
  | 'committees'
  | 'progress'
  | 'notes'
  | 'gis_map'
  | 'sql_lab';
