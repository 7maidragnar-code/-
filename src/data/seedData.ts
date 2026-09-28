import {
  Unit,
  User,
  KpiDaily,
  Committee,
  CommitteeMember,
  CommitteeProgress,
  CommitteeNote,
  SupervisorFeedback,
  ProjectFeedbackNote,
  AppNotification,
} from '../types';
import { normalizeArabic } from '../utils/arabic';
import { generateConceptVector } from '../utils/math';

export const INITIAL_UNITS: Unit[] = [
  {
    id: 1,
    parent_id: null,
    name_ar: 'المركز الرئيسي العالمي',
    name_en: 'Global Headquarters',
    level: 'company',
    path: '/1/',
    latitude: 24.7136,
    longitude: 46.6753,
  },
  {
    id: 2,
    parent_id: 1,
    name_ar: 'منطقة الشرق الأوسط',
    name_en: 'Middle East Region',
    level: 'continent',
    path: '/1/2/',
    latitude: 25.2048,
    longitude: 55.2708,
  },
  {
    id: 3,
    parent_id: 1,
    name_ar: 'منطقة أوروبا',
    name_en: 'Europe Region',
    level: 'continent',
    path: '/1/3/',
    latitude: 50.1109,
    longitude: 8.6821,
  },
  {
    id: 4,
    parent_id: 1,
    name_ar: 'منطقة الأمريكتين',
    name_en: 'Americas Region',
    level: 'continent',
    path: '/1/4/',
    latitude: 40.7128,
    longitude: -74.0060,
  },
  // Under Middle East (2)
  {
    id: 10,
    parent_id: 2,
    name_ar: 'المملكة العربية السعودية',
    name_en: 'Saudi Arabia',
    level: 'country',
    path: '/1/2/10/',
    latitude: 24.7743,
    longitude: 46.7386,
  },
  {
    id: 11,
    parent_id: 2,
    name_ar: 'دولة الإمارات العربية المتحدة',
    name_en: 'United Arab Emirates',
    level: 'country',
    path: '/1/2/11/',
    latitude: 24.4539,
    longitude: 54.3773,
  },
  // Under Europe (3)
  {
    id: 20,
    parent_id: 3,
    name_ar: 'جمهورية ألمانيا الاتحادية',
    name_en: 'Germany',
    level: 'country',
    path: '/1/3/20/',
    latitude: 52.5200,
    longitude: 13.4050,
  },
  {
    id: 21,
    parent_id: 3,
    name_ar: 'المملكة المتحدة',
    name_en: 'United Kingdom',
    level: 'country',
    path: '/1/3/21/',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    id: 22,
    parent_id: 3,
    name_ar: 'الجمهورية الفرنسية',
    name_en: 'France',
    level: 'country',
    path: '/1/3/22/',
    latitude: 48.8566,
    longitude: 2.3522,
  },
  // Under Saudi Arabia (10)
  {
    id: 30,
    parent_id: 10,
    name_ar: 'محور عمليات الرياض',
    name_en: 'Riyadh Operational Hub',
    level: 'city',
    path: '/1/2/10/30/',
    latitude: 24.7136,
    longitude: 46.6753,
  },
  {
    id: 31,
    parent_id: 10,
    name_ar: 'مركز لوجستيات جدة',
    name_en: 'Jeddah Logistics Center',
    level: 'city',
    path: '/1/2/10/31/',
    latitude: 21.4858,
    longitude: 39.1925,
  },
  {
    id: 32,
    parent_id: 10,
    name_ar: 'مركز الدمام الإقليمي',
    name_en: 'Dammam Regional Center',
    level: 'city',
    path: '/1/2/10/32/',
    latitude: 26.4207,
    longitude: 50.0888,
  },
  // Under UAE (11)
  {
    id: 33,
    parent_id: 11,
    name_ar: 'فرع عمليات دبي',
    name_en: 'Dubai Operations Branch',
    level: 'city',
    path: '/1/2/11/33/',
    latitude: 25.2048,
    longitude: 55.2708,
  },
  // Under Germany (20)
  {
    id: 40,
    parent_id: 20,
    name_ar: 'قاعدة برلين التقنية',
    name_en: 'Berlin Tech Base',
    level: 'city',
    path: '/1/3/20/40/',
    latitude: 52.5200,
    longitude: 13.4050,
  },
  {
    id: 41,
    parent_id: 20,
    name_ar: 'محور ميونخ الهندسي',
    name_en: 'Munich Engineering Hub',
    level: 'city',
    path: '/1/3/20/41/',
    latitude: 48.1351,
    longitude: 11.5820,
  },
  // Under UK (21)
  {
    id: 42,
    parent_id: 21,
    name_ar: 'فرع لندن التشغيلي',
    name_en: 'London Financial & Ops Branch',
    level: 'city',
    path: '/1/3/21/42/',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  // Under France (22)
  {
    id: 43,
    parent_id: 22,
    name_ar: 'مكتب باريس الميداني',
    name_en: 'Paris Field Office',
    level: 'city',
    path: '/1/3/22/43/',
    latitude: 48.8566,
    longitude: 2.3522,
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'ceo_tariq',
    password_hash: 'argon2$hash_ceo',
    unit_id: 1,
    role: 'ceo',
    display_name: 'طارق الغامدي (الرئيس التنفيذي)',
  },
  {
    id: 101,
    username: 'supervisor_khalid',
    password_hash: 'argon2$hash_supervisor',
    unit_id: 1,
    role: 'supervisor',
    display_name: 'د. خالد بن سلطان (المشرف العام / Supervisor)',
  },
  {
    id: 2,
    username: 'dir_elena',
    password_hash: 'argon2$hash_eu',
    unit_id: 3,
    role: 'admin',
    display_name: 'إيلينا روستوفا (مدير إقليم أوروبا)',
  },
  {
    id: 3,
    username: 'dir_fahad',
    password_hash: 'argon2$hash_me',
    unit_id: 2,
    role: 'admin',
    display_name: 'فهد العتيبي (مدير إقليم الشرق الأوسط)',
  },
  {
    id: 4,
    username: 'lead_sarah',
    password_hash: 'argon2$hash_ksa',
    unit_id: 10,
    role: 'editor',
    display_name: 'سارة الزهراني (مدير فرع السعودية)',
  },
  {
    id: 5,
    username: 'viewer_lukas',
    password_hash: 'argon2$hash_ber',
    unit_id: 40,
    role: 'viewer',
    display_name: 'لوكاس ويبر (مراقب محطة برلين / Regular)',
  },
  {
    id: 11,
    username: 'emp_ahmed',
    password_hash: 'argon2$hash_ahmed',
    unit_id: 1,
    role: 'editor',
    display_name: 'أحمد بن خالد السديري (موظف / EMP-1001)',
  },
  {
    id: 12,
    username: 'emp_hossam',
    password_hash: 'argon2$hash_hossam',
    unit_id: 30,
    role: 'editor',
    display_name: 'د. حسام عبد الرحمن (موظف / EMP-1003)',
  },
  {
    id: 13,
    username: 'emp_mansour',
    password_hash: 'argon2$hash_mansour',
    unit_id: 33,
    role: 'editor',
    display_name: 'منصور راشد النعيمي (موظف / EMP-1007)',
  },
];

export const INITIAL_COMMITTEES: Committee[] = [
  // اللجان الرسمية
  {
    id: 1,
    name: 'اللجنة العليا للتحول الرقمي والأتمتة',
    unit_id: 1,
    description: 'حوكمة مشاريع الأنظمة الرقمية وأتمتة العمليات عبر المراكز العالمية',
    type: 'committee',
  },
  {
    id: 2,
    name: 'لجنة كفاءة الإنفاق والموارد البشرية',
    unit_id: 10,
    description: 'مراجعة شواغر القوى العاملة وترشيد نفقات التشغيل',
    type: 'committee',
  },
  {
    id: 3,
    name: 'لجنة الجاهزية التشغيلية والأسطول',
    unit_id: 2,
    description: 'متابعة وفرة المركبات والمعدات الثقيلة وجاهزية الإمداد',
    type: 'committee',
  },
  {
    id: 4,
    name: 'لجنة المراجعة والامتثال الأوروبي',
    unit_id: 3,
    description: 'الامتثال للمعايير التنظيمية وحوكمة السياسات بالمراكز الأوروبية',
    type: 'committee',
  },
  // المشاريع الاستراتيجية بناءً على المنصة
  {
    id: 5,
    name: 'مشروع ميكنة أسطول النقل وسلاسل الإمداد الذكية',
    unit_id: 2,
    description: 'أتمتة جاهزية المركبات وربط أجهزة التتبع اللوجستي بالمستودعات الميدانية',
    type: 'project',
  },
  {
    id: 6,
    name: 'مشروع التحول السحابي والبنية الرقمية الموحدة',
    unit_id: 1,
    description: 'ربط قواعد البيانات الموزعة ومزامنة مؤشرات الأداء الحية مع المركز العالمي',
    type: 'project',
  },
  {
    id: 7,
    name: 'مشروع تسكين واستقطاب الكفاءات الهندسية',
    unit_id: 10,
    description: 'خطة سد شواغر القوى العاملة الفنية في مراكز الرياض وجدة وبرلين',
    type: 'project',
  },
  {
    id: 8,
    name: 'مشروع مركز العمليات الموحد لمنطقة الشرق الأوسط',
    unit_id: 2,
    description: 'تدشين منصة الرصد المشترك للعمليات التشغيلية بين السعودية والإمارات',
    type: 'project',
  },
  {
    id: 9,
    name: 'مشروع حوكمة الامتثال وتدقيق المعايير الأوروبية',
    unit_id: 3,
    description: 'مواءمة العمليات التشغيلية في ألمانيا وفرنسا مع اللائحة العامة لحماية البيانات والامتثال',
    type: 'project',
  },
  {
    id: 10,
    name: 'مشروع منصة الرصد والتحليلات الجغرافية اللحظية (GIS)',
    unit_id: 1,
    description: 'نظام الخرائط المستقل بدون واجهات خارجية للرصد التفاعلي لجاهزية الفروع والمستفيدين',
    type: 'project',
  },
];

// Helper to generate normalized name
function createMember(
  id: number,
  committee_id: number,
  employee_id: string,
  title: string,
  full_name: string,
  phone: string,
  location_id: number,
  beneficiary_id: number
): CommitteeMember {
  return {
    id,
    committee_id,
    employee_id,
    ref_number: employee_id,
    title,
    full_name,
    name_normalized: normalizeArabic(full_name),
    phone,
    location_id,
    beneficiary_id,
  };
}

export const INITIAL_COMMITTEE_MEMBERS: CommitteeMember[] = [
  createMember(1, 1, 'EMP-1001', 'رئيس اللجنة', 'أحمد بن خالد السديري', '+966-50-123-4567', 1, 1),
  createMember(2, 1, 'EMP-1002', 'أمين سر ومقرر', 'فاطمة محمد الأنصاري', '+966-55-987-6543', 30, 31),
  createMember(3, 6, 'EMP-1003', 'مدير مشروع التحول السحابي', 'د. حسام عبد الرحمن إبراهيم', '+966-54-321-9876', 30, 33),
  createMember(4, 2, 'EMP-1004', 'رئيس لجنة الموارد', 'سعود بن عبد العزيز الهذلول', '+966-53-888-1122', 10, 30),
  createMember(5, 7, 'EMP-1005', 'مدير مشروع استقطاب الكفاءات', 'مها بنت صالح القحطاني', '+966-56-777-3344', 31, 32),
  createMember(6, 2, 'EMP-1006', 'أخصائي تدقيق الكفاءة', 'عبد الله بن يحيى الغامدي', '+966-59-444-5566', 32, 10),
  createMember(7, 5, 'EMP-1007', 'مدير مشروع ميكنة الأسطول', 'منصور راشد النعيمي', '+971-50-666-7788', 33, 2),
  createMember(8, 5, 'EMP-1008', 'مهندس لوجستيات سلاسل الإمداد', 'زياد كمال الشريف', '+966-58-222-3344', 31, 33),
  createMember(9, 4, 'EMP-2001', 'رئيس لجنة الحوكمة', 'هانز مولر (Hans Müller)', '+49-170-555-1234', 40, 3),
  createMember(10, 9, 'EMP-2002', 'مدير مشروع الامتثال الأوروبي', 'صوفي دوبوا (Sophie Dubois)', '+33-6-1234-5678', 43, 22),
  createMember(11, 8, 'EMP-2003', 'قائد مشروع مركز العمليات الموحد', 'أوليفر سميث (Oliver Smith)', '+44-7700-900123', 42, 21),
  createMember(12, 10, 'EMP-1009', 'كبير مهندسي نظم الـ GIS', 'يوسف بن إبراهيم البواردي', '+966-50-777-8899', 41, 1),
  createMember(13, 7, 'EMP-1010', 'منسق تسكين القوى العاملة', 'ريم بنت فيصل الشمري', '+966-50-888-3322', 30, 10),
  createMember(14, 6, 'EMP-1011', 'أخصائي تكامل المنصات الموزعة', 'طارق فؤاد الكيلاني', '+966-55-444-9911', 30, 40),
];

// Generate 14 days of KPI data for all city units
export function generateSeedKpis(): KpiDaily[] {
  const kpis: KpiDaily[] = [];
  const cityUnitIds = [30, 31, 32, 33, 40, 41, 42, 43];
  const dates: string[] = [];

  // Generate 14 days ending today
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  // Base authorized & filled parameters per city
  const cityConfigs: { [id: number]: { authorizedManpower: number; authorizedVehicles: number; fillRatio: number } } = {
    30: { authorizedManpower: 450, authorizedVehicles: 120, fillRatio: 0.94 }, // Riyadh Hub
    31: { authorizedManpower: 280, authorizedVehicles: 90, fillRatio: 0.88 },  // Jeddah Logistics
    32: { authorizedManpower: 160, authorizedVehicles: 55, fillRatio: 0.82 },  // Dammam Regional
    33: { authorizedManpower: 210, authorizedVehicles: 70, fillRatio: 0.91 },  // Dubai Ops
    40: { authorizedManpower: 320, authorizedVehicles: 60, fillRatio: 0.86 },  // Berlin Tech
    41: { authorizedManpower: 190, authorizedVehicles: 45, fillRatio: 0.92 },  // Munich Hub
    42: { authorizedManpower: 260, authorizedVehicles: 40, fillRatio: 0.89 },  // London Ops
    43: { authorizedManpower: 140, authorizedVehicles: 35, fillRatio: 0.84 },  // Paris Field
  };

  dates.forEach((day, dayIndex) => {
    cityUnitIds.forEach(unitId => {
      const cfg = cityConfigs[unitId] || { authorizedManpower: 100, authorizedVehicles: 30, fillRatio: 0.85 };
      
      // Slight fluctuation over 14 days
      const wave = Math.sin((dayIndex + unitId) / 2) * 0.04;
      const ratio = Math.min(0.99, Math.max(0.70, cfg.fillRatio + wave));

      // Manpower KPI
      const filledManpower = Math.round(cfg.authorizedManpower * ratio);
      kpis.push({
        unit_id: unitId,
        kpi_code: 'MANPOWER_FILL',
        day,
        numerator: filledManpower,
        denominator: cfg.authorizedManpower,
      });

      // Vehicle KPI
      const activeVehicles = Math.round(cfg.authorizedVehicles * (ratio - 0.03));
      kpis.push({
        unit_id: unitId,
        kpi_code: 'VEHICLE_FILL',
        day,
        numerator: activeVehicles,
        denominator: cfg.authorizedVehicles,
      });

      // Readiness KPI
      const readyEquip = Math.round(cfg.authorizedManpower * (ratio + 0.02));
      kpis.push({
        unit_id: unitId,
        kpi_code: 'ASSET_READINESS',
        day,
        numerator: readyEquip,
        denominator: cfg.authorizedManpower,
      });
    });
  });

  return kpis;
}

// Generate 14 days of progress records for each member
export function generateSeedProgress(): CommitteeProgress[] {
  const records: CommitteeProgress[] = [];
  const dates: string[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  // Base progress trajectories per member
  const memberProfiles: { [id: number]: { startPct: number; dailyStep: number; maxPct: number } } = {
    1: { startPct: 65, dailyStep: 2.2, maxPct: 96 },
    2: { startPct: 50, dailyStep: 2.5, maxPct: 85 },
    3: { startPct: 40, dailyStep: 3.1, maxPct: 83 },
    4: { startPct: 75, dailyStep: 1.8, maxPct: 98 },
    5: { startPct: 55, dailyStep: 2.0, maxPct: 81 },
    6: { startPct: 30, dailyStep: 1.5, maxPct: 52 }, // slower
    7: { startPct: 60, dailyStep: 2.8, maxPct: 95 },
    8: { startPct: 45, dailyStep: 2.1, maxPct: 74 },
    9: { startPct: 80, dailyStep: 1.4, maxPct: 100 }, // completed!
    10: { startPct: 62, dailyStep: 2.0, maxPct: 88 },
    11: { startPct: 52, dailyStep: 1.9, maxPct: 77 },
    12: { startPct: 48, dailyStep: 2.6, maxPct: 84 },
  };

  dates.forEach((day, idx) => {
    INITIAL_COMMITTEE_MEMBERS.forEach(m => {
      const profile = memberProfiles[m.id] || { startPct: 50, dailyStep: 2.0, maxPct: 90 };
      const current = Math.min(
        profile.maxPct,
        Number((profile.startPct + profile.dailyStep * idx + (Math.sin(idx + m.id) * 0.8)).toFixed(1))
      );

      records.push({
        member_id: m.id,
        day,
        percentage: Math.max(0, Math.min(100, current)),
      });
    });
  });

  return records;
}

export function generateSeedNotes(): CommitteeNote[] {
  const notesData = [
    {
      id: 1,
      member_id: 1,
      day: new Date().toISOString().slice(0, 10),
      body: 'تم الانتهاء من مرحلة الربط التقني لقاعدة البيانات مع مركز العمليات بالرياض بنسبة نجاح 98% وتدريب الكوادر التقنية.',
      ai_summary: 'اكتمال الربط التقني بالرياض بنسبة 98% واستكمال تدريب الكوادر.',
      ai_category: 'digital',
      ai_sentiment: 'positive' as const,
    },
    {
      id: 2,
      member_id: 4,
      day: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      body: 'وجود عجز في شواغر الفنيين المتخصصين في مركز الدمام مما يتطلب تسريع خطة التوظيف التعاقدي قبل نهاية الربع.',
      ai_summary: 'عجز في الفنيين بالدمام يستوجب تسريع خطة التوظيف.',
      ai_category: 'manpower',
      ai_sentiment: 'negative' as const,
    },
    {
      id: 3,
      member_id: 7,
      day: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
      body: 'أسطول النقل اللوجستي في دبي يعمل بكفاءة تشغيلية مستقرة مع استلام 15 مركبة نقل ثقيل إضافية لتعزيز العمليات.',
      ai_summary: 'استلام 15 مركبة جديدة واستقرار كفاءة أسطول دبي.',
      ai_category: 'fleet',
      ai_sentiment: 'positive' as const,
    },
    {
      id: 4,
      member_id: 9,
      day: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
      body: 'تم استيفاء كامل بنود تدقيق الامتثال الأوروبي في برلين وميونخ وفق معايير الحوكمة المعتمدة وبدون أي مخالفات.',
      ai_summary: 'استيفاء معايير الامتثال الأوروبي في ألمانيا دون ملاحظات.',
      ai_category: 'compliance',
      ai_sentiment: 'positive' as const,
    },
    {
      id: 5,
      member_id: 5,
      day: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10),
      body: 'تأخر في اعتماد بنود ميزانية التدريب المشتركة بين جدة والدمام بسبب اختلاف تسعير العقود الاستشارية.',
      ai_summary: 'تأخر اعتماد ميزانية التدريب المشتركة بسبب تسعير العقود.',
      ai_category: 'budget',
      ai_sentiment: 'neutral' as const,
    },
    {
      id: 6,
      member_id: 3,
      day: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10),
      body: 'تطبيق النموذج الموحد للتوثيق البرمجي أدى لتقليص دورة نشر التحديثات التشغيلية بنسبة 35%.',
      ai_summary: 'تسريع نشر التحديثات بنسبة 35% عبر النموذج الموحد.',
      ai_category: 'digital',
      ai_sentiment: 'positive' as const,
    },
    {
      id: 7,
      member_id: 11,
      day: new Date(Date.now() - 86400000 * 6).toISOString().slice(0, 10),
      body: 'جاري فحص مسودة اتفاقية التعاون بين مركز لندن ومكتب باريس لتفادي أي ازدواجية في المهام الميدانية.',
      ai_summary: 'مراجعة اتفاقية التنسيق المشترك بين لندن وباريس.',
      ai_category: 'compliance',
      ai_sentiment: 'neutral' as const,
    },
  ];

  return notesData.map(item => ({
    ...item,
    embedding: generateConceptVector(item.body + ' ' + item.ai_summary + ' ' + item.ai_category),
  }));
}

export function generateSeedSupervisorFeedbacks(): SupervisorFeedback[] {
  return [
    {
      id: 1,
      employee_id: 'EMP-1001',
      project_id: 1,
      supervisor_id: 101,
      supervisor_name: 'د. خالد بن سلطان (المشرف العام)',
      feedback_text: 'أداء ممتاز في قيادة مراحل التحول الرقمي وإدارة الاجتماعات الدورية مع الفريق بنجاح ملحوظ.',
      priority: 'high',
      created_at: '2026-09-20 10:30',
    },
    {
      id: 2,
      employee_id: 'EMP-1003',
      project_id: 6,
      supervisor_id: 101,
      supervisor_name: 'د. خالد بن سلطان (المشرف العام)',
      feedback_text: 'يرجى مراجعة الجدول الزمني لتهيئة السحابة الهجينة وتحديث وثائق الأمان السيبراني قبل تسليم المرحلة الثانية.',
      priority: 'medium',
      created_at: '2026-09-22 14:15',
    },
    {
      id: 3,
      employee_id: 'EMP-1007',
      project_id: 5,
      supervisor_id: 101,
      supervisor_name: 'د. خالد بن سلطان (المشرف العام)',
      feedback_text: 'جهد استثنائي في تسريع ميكنة أسطول دبي والالتزام التام بالميزانية المعتمدة، نوصي بتعميم التجربة على باقي المراكز.',
      priority: 'high',
      created_at: '2026-09-24 16:45',
    },
    {
      id: 4,
      employee_id: 'EMP-1004',
      project_id: 2,
      supervisor_id: 101,
      supervisor_name: 'د. خالد بن سلطان (المشرف العام)',
      feedback_text: 'يرجى تكثيف التنسيق مع فريق تدقيق الكفاءة لتقليص الانحراف الحاصل في شواغر مركز الدمام.',
      priority: 'high',
      created_at: '2026-09-25 09:20',
    },
  ];
}

export function generateSeedProjectNotes(): ProjectFeedbackNote[] {
  return [
    {
      id: 1,
      title: 'مراجعة معايير التشفير والربط السحابي الهجين',
      description: 'نلاحظ تأخراً نسبياً في استكمال اختبارات نفاذ الحزم المشفرة بين المركز العالمي ومحور الرياض. يرجى توثيق مصفوفة الصلاحيات وتقديم تقرير الجاهزية الفنية قبل اجتماع اللجنة القادم.',
      project_id: 6,
      employee_id: 'EMP-1003',
      employee_name: 'د. حسام عبد الرحمن إبراهيم',
      created_by_id: 101,
      created_by_name: 'د. خالد بن سلطان (المشرف العام)',
      created_by_role: 'supervisor',
      created_at: '2026-09-24 09:30',
      priority: 'high',
      status: 'in_progress',
      is_confidential: false,
      category: 'task_followup',
      replies: [
        {
          id: 101,
          author_id: 12,
          author_name: 'د. حسام عبد الرحمن إبراهيم',
          author_role: 'editor',
          message: 'تم عقد جلسة فنية مع مهندسي الشبكات، وتم سد 80% من الثغرات المكتشفة في ربط بروتوكول IPsec، وسأرفع التقرير النهائي غداً صباحاً.',
          created_at: '2026-09-24 14:10',
        },
        {
          id: 102,
          author_id: 101,
          author_name: 'د. خالد بن سلطان (المشرف العام)',
          author_role: 'supervisor',
          message: 'ممتاز يا دكتور، بانتظار مسودة التقرير لمشاركتها مع لجنة الحوكمة العليا.',
          created_at: '2026-09-25 10:00',
        },
      ],
      activity_log: [
        {
          id: 1,
          user_id: 101,
          user_name: 'د. خالد بن سلطان (المشرف العام)',
          user_role: 'supervisor',
          action_type: 'created',
          description: 'إنشاء الملاحظة وتوجيهها للموظف المسؤول',
          timestamp: '2026-09-24 09:30:15',
        },
        {
          id: 2,
          user_id: 12,
          user_name: 'د. حسام عبد الرحمن إبراهيم',
          user_role: 'editor',
          action_type: 'status_changed',
          description: 'تغيير الحالة إلى: قيد المتابعة',
          timestamp: '2026-09-24 14:10:00',
        },
        {
          id: 3,
          user_id: 12,
          user_name: 'د. حسام عبد الرحمن إبراهيم',
          user_role: 'editor',
          action_type: 'replied',
          description: 'إضافة تعقيب ومستجدات إنجاز من الموظف',
          timestamp: '2026-09-24 14:10:00',
        },
        {
          id: 4,
          user_id: 101,
          user_name: 'د. خالد بن سلطان (المشرف العام)',
          user_role: 'supervisor',
          action_type: 'replied',
          description: 'رد المشرف على تحديثات الموظف',
          timestamp: '2026-09-25 10:00:22',
        },
      ],
    },
    {
      id: 2,
      title: 'انحراف توريد أجهزة التتبع اللوجستي لأسطول دبي',
      description: 'تأخرت الشحنة المتبقية المكونة من 35 جهاز تتبع GPS للشاحنات الثقيلة بسبب إجراءات التخليص الجمركي بميناء جبل علي. يلزم تدخل فوري لتفادي تعطل جدول التشغيل التجريبي.',
      project_id: 5,
      employee_id: 'EMP-1007',
      employee_name: 'منصور راشد النعيمي',
      created_by_id: 101,
      created_by_name: 'د. خالد بن سلطان (المشرف العام)',
      created_by_role: 'supervisor',
      created_at: '2026-09-25 11:15',
      priority: 'critical',
      status: 'open',
      is_confidential: false,
      category: 'quality',
      replies: [
        {
          id: 201,
          author_id: 13,
          author_name: 'منصور راشد النعيمي',
          author_role: 'editor',
          message: 'تم التنسيق مع المخلص الجمركي واستخراج إعفاء الفحص المؤقت، وستصل الشحنة مستودع دبي غداً ظهراً.',
          created_at: '2026-09-25 16:20',
        },
      ],
      activity_log: [
        {
          id: 1,
          user_id: 101,
          user_name: 'د. خالد بن سلطان (المشرف العام)',
          user_role: 'supervisor',
          action_type: 'created',
          description: 'تسجيل ملاحظة حرجة بسبب مخاطر تأخر الجدولة التشغيلية',
          timestamp: '2026-09-25 11:15:00',
        },
        {
          id: 2,
          user_id: 13,
          user_name: 'منصور راشد النعيمي',
          user_role: 'editor',
          action_type: 'replied',
          description: 'إفادة بالحل الإجرائي الميداني',
          timestamp: '2026-09-25 16:20:00',
        },
      ],
    },
    {
      id: 3,
      title: 'ملاحظة إدارية خاصة: تقييم عروض تسعير استشارات التسكين',
      description: 'ملاحظة سرية محصورة بالإشراف التنفيذي: تفاوت عروض أسعار الشركات الاستشارية المتقدمة لبرنامج تسكين الكفاءات بنسبة تفوق 40%. يلزم مراجعة نطاق العمل قبل أي ترسية نهائية.',
      project_id: 7,
      employee_id: 'EMP-1004',
      employee_name: 'سعود بن عبد العزيز الهذلول',
      created_by_id: 101,
      created_by_name: 'د. خالد بن سلطان (المشرف العام)',
      created_by_role: 'supervisor',
      created_at: '2026-09-22 08:45',
      priority: 'high',
      status: 'in_progress',
      is_confidential: true,
      category: 'compliance',
      replies: [],
      activity_log: [
        {
          id: 1,
          user_id: 101,
          user_name: 'د. خالد بن سلطان (المشرف العام)',
          user_role: 'supervisor',
          action_type: 'created',
          description: 'إنشاء ملاحظة سرية للمتابعة الإدارية العليا',
          timestamp: '2026-09-22 08:45:00',
        },
      ],
    },
    {
      id: 4,
      title: 'اعتماد وثيقة معايير الأتمتة ونماذج الربط البرمجي (API)',
      description: 'تم الانتهاء بنجاح من صياغة وتوثيق كافة المعايير القياسية للربط بين الفروع، واعتمادها من قبل مهندسي البرمجيات في الرياض وجدة.',
      project_id: 1,
      employee_id: 'EMP-1001',
      employee_name: 'أحمد بن خالد السديري',
      created_by_id: 101,
      created_by_name: 'د. خالد بن سلطان (المشرف العام)',
      created_by_role: 'supervisor',
      created_at: '2026-09-21 15:30',
      priority: 'low',
      status: 'resolved',
      is_confidential: false,
      category: 'performance',
      replies: [
        {
          id: 401,
          author_id: 11,
          author_name: 'أحمد بن خالد السديري',
          author_role: 'editor',
          message: 'نشكر المشرف العام على المتابعة الحثيثة، وتم تعميم الدليل على كافة منسقي الفرق التقنية بالمناطق.',
          created_at: '2026-09-22 09:10',
        },
      ],
      activity_log: [
        {
          id: 1,
          user_id: 101,
          user_name: 'د. خالد بن سلطان (المشرف العام)',
          user_role: 'supervisor',
          action_type: 'created',
          description: 'تسجيل الملاحظة وتوثيق إنجاز مرحلي',
          timestamp: '2026-09-21 15:30:00',
        },
        {
          id: 2,
          user_id: 11,
          user_name: 'أحمد بن خالد السديري',
          user_role: 'editor',
          action_type: 'replied',
          description: 'إفادة بإتمام التعميم',
          timestamp: '2026-09-22 09:10:00',
        },
        {
          id: 3,
          user_id: 101,
          user_name: 'د. خالد بن سلطان (المشرف العام)',
          user_role: 'supervisor',
          action_type: 'status_changed',
          description: 'تحديث الحالة إلى: تم الحل',
          timestamp: '2026-09-23 11:00:00',
        },
      ],
    },
    {
      id: 5,
      title: 'إغلاق تدقيق الامتثال للائحة حماية البيانات في مكتب باريس',
      description: 'استوفت التقارير كافة بنود الملاحظات السابقة وتم إغلاق ملف التدقيق السنوي بدون أي انحرافات قانونية.',
      project_id: 9,
      employee_id: 'EMP-2002',
      employee_name: 'صوفي دوبوا (Sophie Dubois)',
      created_by_id: 101,
      created_by_name: 'د. خالد بن سلطان (المشرف العام)',
      created_by_role: 'supervisor',
      created_at: '2026-09-20 13:00',
      priority: 'medium',
      status: 'closed',
      is_confidential: false,
      category: 'compliance',
      replies: [],
      activity_log: [
        {
          id: 1,
          user_id: 101,
          user_name: 'د. خالد بن سلطان (المشرف العام)',
          user_role: 'supervisor',
          action_type: 'created',
          description: 'إنشاء متابعة الامتثال',
          timestamp: '2026-09-20 13:00:00',
        },
        {
          id: 2,
          user_id: 101,
          user_name: 'د. خالد بن سلطان (المشرف العام)',
          user_role: 'supervisor',
          action_type: 'closed',
          description: 'إغلاق الملاحظة بعد التحقق من المستندات الرسمية',
          timestamp: '2026-09-24 16:00:00',
        },
      ],
    },
  ];
}

export function generateSeedNotifications(): AppNotification[] {
  return [
    {
      id: 1,
      target_employee_id: 'EMP-1003',
      title: 'ملاحظة إشرافية جديدة',
      message: 'قام د. خالد بن سلطان بإضافة ملاحظة بمشروع التحول السحابي: مراجعة معايير التشفير والربط السحابي',
      type: 'note_created',
      related_note_id: 1,
      created_at: '2026-09-24 09:30',
      read: false,
    },
    {
      id: 2,
      target_employee_id: 'EMP-1007',
      title: 'ملاحظة حرجة تتطلب تدخلاً',
      message: 'تنبيه عاجل بمشروع ميكنة الأسطول: انحراف توريد أجهزة التتبع اللوجستي لأسطول دبي',
      type: 'note_created',
      related_note_id: 2,
      created_at: '2026-09-25 11:15',
      read: false,
    },
    {
      id: 3,
      target_role: 'supervisor',
      title: 'تعقيب جديد من الموظف',
      message: 'أضاف منصور راشد النعيمي تعقيباً جديداً على ملاحظة أجهزة التتبع',
      type: 'note_replied',
      related_note_id: 2,
      created_at: '2026-09-25 16:20',
      read: false,
    },
  ];
}
