import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import {
  Home,
  Folder,
  CheckSquare,
  Users2,
  BarChart3,
  Settings,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    language,
    currentUserUnit,
    isRlsActive,
    isSupervisor,
  } = useApp();

  // Navigation items mapping exactly to the reference image + Supervisor Exclusive & Feedback Hub
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      labelAr: 'لوحة القيادة',
      labelEn: 'Dashboard',
      icon: Home,
    },
    // Central Enterprise Feedback & Notes Dashboard
    {
      id: 'feedback_dashboard' as ActiveTab,
      labelAr: 'الملاحظات والمتابعات',
      labelEn: 'Notes & Feedback',
      icon: MessageSquare,
    },
    // Dedicated Supervisor Monitoring tab (accessible only if isSupervisor)
    ...(isSupervisor ? [{
      id: 'supervisor_monitoring' as ActiveTab,
      labelAr: 'مراقبة أداء الموظفين',
      labelEn: 'Supervisor Monitoring',
      icon: ShieldCheck,
      isSpecial: true,
    }] : []),
    {
      id: 'committees' as ActiveTab,
      labelAr: 'المشاريع',
      labelEn: 'Projects',
      icon: Folder,
    },
    {
      id: 'progress' as ActiveTab,
      labelAr: 'المهام',
      labelEn: 'Tasks & Progress',
      icon: CheckSquare,
    },
    {
      id: 'notes' as ActiveTab,
      labelAr: 'فريق العمل',
      labelEn: 'Team & Members',
      icon: Users2,
    },
    {
      id: 'gis_map' as ActiveTab,
      labelAr: 'التقارير',
      labelEn: 'Reports & GIS',
      icon: BarChart3,
    },
    {
      id: 'hierarchy' as ActiveTab,
      labelAr: 'الإعدادات',
      labelEn: 'Settings & RLS',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 xl:w-72 bg-[#091D36] text-white flex flex-col shrink-0 h-screen sticky top-0 border-e border-[#132A4A] shadow-2xl relative select-none overflow-hidden z-40">
      {/* Background ambient lighting and soft wavy ribbons */}
      <div className="absolute inset-0 pointer-events-none opacity-45">
        <svg className="w-full h-full" viewBox="0 0 300 800" fill="none" preserveAspectRatio="none">
          <path
            d="M -50 350 Q 80 300 180 390 T 350 360 L 350 800 L -50 800 Z"
            fill="#0F2E55"
            opacity="0.5"
          />
          <path
            d="M -50 480 Q 90 420 200 500 T 350 460 L 350 800 L -50 800 Z"
            fill="#0A2242"
            opacity="0.7"
          />
          <path
            d="M -50 620 Q 110 560 220 640 T 350 600 L 350 800 L -50 800 Z"
            fill="#06162C"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Top Header (Exact Match to Reference Image) */}
      <div className="pt-7 pb-4 px-6 text-center relative z-10 shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-[#DFB76C] font-sans drop-shadow-xs">
          {language === 'ar' ? 'أعضاء اللجان والمشاريع' : 'Committees & Projects'}
        </h1>
        <p className="text-xs text-[#8BA4BD] font-medium mt-1">
          {language === 'ar' ? 'مستقبل أكثر ازدهاراً' : 'A More Prosperous Future'}
        </p>

        {/* Golden Horizontal Accent Divider Line */}
        <div className="w-12 h-0.5 bg-[#DFB76C] mx-auto mt-3 rounded-full shadow-xs" />

        {/* Small Scope Badge for Context */}
        {isRlsActive && (
          <div className="mt-2.5 py-0.5 px-2 bg-blue-950/70 border border-amber-400/30 rounded text-[10px] text-amber-300 font-mono inline-block">
            RLS: {currentUserUnit.path}
          </div>
        )}
      </div>

      {/* Navigation Menu (Exact Match to Image Icons & RTL Alignment) */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 relative z-10 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#104DA2] via-[#165EBE] to-[#1253AC] text-white shadow-lg shadow-blue-900/50 border border-blue-400/30 font-bold'
                  : 'text-[#B8CCE0] hover:text-white hover:bg-[#122A4C]/60'
              }`}
            >
              {/* Text Label */}
              <span className={`tracking-wide ${isActive ? 'text-white' : 'text-[#B8CCE0]'}`}>
                {language === 'ar' ? item.labelAr : item.labelEn}
              </span>

              {/* Icon on the right (matching Arabic RTL reference layout) */}
              <Icon
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 transition-transform ${
                  isActive ? 'text-white scale-110' : 'text-[#8EA7C0]'
                }`}
                strokeWidth={1.8}
              />
            </button>
          );
        })}
      </nav>

      {/* Bottom Section (Exact Match to User Image: Golden Skyline + "بناء اليوم" + "لمستقبل أكثر ازدهاراً") */}
      <div className="relative z-10 pt-2 pb-5 px-4 mt-auto shrink-0 border-t border-[#142A4A]/60 bg-gradient-to-t from-[#061427] via-[#081B34] to-transparent">
        {/* Crisp Golden Architectural Skyline (Burj Khalifa, Emirates Towers, Modern City) */}
        <div className="w-full relative h-36 pointer-events-none mb-1">
          <svg
            className="w-full h-full"
            viewBox="0 0 300 130"
            fill="none"
            preserveAspectRatio="xMidYMax meet"
          >
            {/* Soft wave shading in backdrop */}
            <path
              d="M 0 80 Q 75 55 150 85 T 300 65 L 300 130 L 0 130 Z"
              fill="#061528"
              opacity="0.85"
            />
            <path
              d="M 0 100 Q 90 75 180 105 T 300 90 L 300 130 L 0 130 Z"
              fill="#040F1E"
              opacity="0.95"
            />

            {/* Base horizon ground line */}
            <line x1="0" y1="108" x2="300" y2="108" stroke="#DFB76C" strokeWidth="1.2" opacity="0.85" />

            {/* GOLDEN WIREFRAME SKYLINE (Exact architectural contours from user screenshot) */}
            <g stroke="#E2BC74" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* === LEFT: Emirates Towers / Slanted Towers === */}
              {/* Tower 1 */}
              <path d="M 18 108 L 18 68 L 36 46 L 36 108" />
              <line x1="24" y1="68" x2="24" y2="108" strokeWidth="0.7" opacity="0.6" />
              <line x1="30" y1="58" x2="30" y2="108" strokeWidth="0.7" opacity="0.6" />
              {/* Floor horizontal hatches */}
              <line x1="18" y1="78" x2="36" y2="78" strokeWidth="0.7" opacity="0.4" />
              <line x1="18" y1="88" x2="36" y2="88" strokeWidth="0.7" opacity="0.4" />
              <line x1="18" y1="98" x2="36" y2="98" strokeWidth="0.7" opacity="0.4" />

              {/* Tower 2 */}
              <path d="M 40 108 L 40 56 L 56 36 L 56 108" />
              <line x1="45" y1="56" x2="45" y2="108" strokeWidth="0.7" opacity="0.6" />
              <line x1="51" y1="48" x2="51" y2="108" strokeWidth="0.7" opacity="0.6" />
              {/* Floor hatches */}
              <line x1="40" y1="68" x2="56" y2="68" strokeWidth="0.7" opacity="0.4" />
              <line x1="40" y1="80" x2="56" y2="80" strokeWidth="0.7" opacity="0.4" />
              <line x1="40" y1="92" x2="56" y2="92" strokeWidth="0.7" opacity="0.4" />

              {/* === MID-LEFT: Mid-rise commercial high-rises with spire === */}
              <path d="M 62 108 L 62 68 L 70 68 L 70 108" />
              <path d="M 74 108 L 74 52 L 82 46 L 88 52 L 88 108" />
              <line x1="81" y1="46" x2="81" y2="34" strokeWidth="0.9" />

              {/* Wide Office Tower with glass grid */}
              <path d="M 94 108 L 94 48 L 108 48 L 108 108" />
              <line x1="101" y1="48" x2="101" y2="108" strokeWidth="0.6" opacity="0.5" />
              <line x1="94" y1="60" x2="108" y2="60" strokeWidth="0.6" opacity="0.4" />
              <line x1="94" y1="74" x2="108" y2="74" strokeWidth="0.6" opacity="0.4" />
              <line x1="94" y1="88" x2="108" y2="88" strokeWidth="0.6" opacity="0.4" />

              {/* Lower podium / Metro station pavilion */}
              <rect x="112" y="96" width="30" height="12" strokeWidth="0.9" />
              <line x1="112" y1="100" x2="142" y2="100" strokeWidth="0.6" opacity="0.5" />

              {/* === CENTER: THE MAJESTIC BURJ KHALIFA === */}
              {/* Stepped Podiums & Spire - Exact Iconic Silhouette */}
              {/* Base Tier 1 */}
              <path d="M 136 108 L 136 90 L 164 90 L 164 108" />
              {/* Tier 2 */}
              <path d="M 139 90 L 139 70 L 161 70 L 161 90" />
              {/* Tier 3 */}
              <path d="M 142 70 L 142 50 L 158 50 L 158 70" />
              {/* Tier 4 */}
              <path d="M 144 50 L 144 32 L 156 32 L 156 50" />
              {/* Tier 5 */}
              <path d="M 146 32 L 146 18 L 154 18 L 154 32" />
              {/* Tier 6 & Needle Spire */}
              <path d="M 148 18 L 148 8 L 152 8 L 152 18" />
              <line x1="150" y1="8" x2="150" y2="1" strokeWidth="1.4" />
              <circle cx="150" cy="1" r="1.2" fill="#E2BC74" />

              {/* Central vertical spine lines */}
              <line x1="147" y1="32" x2="147" y2="108" strokeWidth="0.6" opacity="0.5" />
              <line x1="153" y1="32" x2="153" y2="108" strokeWidth="0.6" opacity="0.5" />

              {/* === MID-RIGHT: Curved Futuristic Landmark (Museum / Opera / Arch) === */}
              <path d="M 170 108 L 170 96 L 178 96 L 178 108" />
              {/* Curved Oval/Arch Structure */}
              <path d="M 184 108 L 184 66 Q 198 44 212 66 L 212 108" />
              <path d="M 190 108 L 190 74 Q 198 62 206 74 L 206 108" strokeWidth="0.7" opacity="0.5" />
              <rect x="180" y="96" width="36" height="12" strokeWidth="0.8" />

              {/* === RIGHT: Stepped Tower with angled roof & Spire === */}
              <path d="M 218 108 L 218 56 L 228 48 L 238 56 L 238 108" />
              <line x1="228" y1="48" x2="228" y2="36" strokeWidth="0.9" />

              {/* Far Right Angled Skyscraper (Burj Al Arab style curved sail contour) */}
              <path d="M 244 108 L 244 42 Q 256 34 266 32 L 266 108" />
              <line x1="252" y1="42" x2="252" y2="108" strokeWidth="0.7" opacity="0.6" />
              <line x1="259" y1="36" x2="259" y2="108" strokeWidth="0.7" opacity="0.6" />
              {/* Floor horizontal hatches */}
              <line x1="244" y1="55" x2="266" y2="55" strokeWidth="0.6" opacity="0.4" />
              <line x1="244" y1="70" x2="266" y2="70" strokeWidth="0.6" opacity="0.4" />
              <line x1="244" y1="86" x2="266" y2="86" strokeWidth="0.6" opacity="0.4" />

              {/* Edge tower */}
              <path d="M 270 108 L 270 60 L 284 50 L 284 108" />
            </g>
          </svg>
        </div>

        {/* Corporate Slogan (Exact Match to User's Uploaded Screenshot) */}
        <div className="text-center space-y-1 pt-1">
          <div className="text-xs font-semibold text-[#DFE7EF] tracking-wide">
            {language === 'ar' ? 'بناء اليوم' : 'Building Today'}
          </div>
          <div className="text-sm font-bold text-[#E5BE75] tracking-wide drop-shadow-xs">
            {language === 'ar' ? 'لمستقبل أكثر ازدهاراً' : 'For a Thriving Future'}
          </div>

          {/* Golden Horizontal Accent Divider Line */}
          <div className="w-12 h-0.5 bg-[#DFB76C] mx-auto mt-2 rounded-full shadow-xs" />
        </div>
      </div>
    </aside>
  );
};
