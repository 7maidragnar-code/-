import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Bell,
  Calendar,
  Globe,
  User as UserIcon,
  Shield,
  ChevronDown,
  CheckCheck,
  MessageSquare,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUser,
    currentUserUnit,
    isRlsActive,
    language,
    setLanguage,
    userNotifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    setActiveTab,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  // Localized date matching the reference style
  const todayFormatted = React.useMemo(() => {
    const now = new Date();
    if (language === 'ar') {
      return now.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [language]);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* User Profile Pill & Notifications (On the start side in RTL) */}
        <div className="flex items-center gap-3 order-1 md:order-none">
          {/* User profile with RLS selector */}
          <div className="relative group">
            <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-2xl cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0">
                <UserIcon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-start">
                <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                  <span>
                    {currentUser.role === 'ceo'
                      ? (language === 'ar' ? 'المدير العام' : 'Director General')
                      : currentUser.role === 'supervisor'
                      ? (language === 'ar' ? 'المشرف العام (Supervisor)' : 'Supervisor')
                      : currentUser.username}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[10px] text-slate-500">
                  {language === 'ar' ? 'مرحباً بك' : 'Welcome'}
                </div>
              </div>
            </div>

            {/* Dropdown for RLS simulation actor */}
            <div className="absolute top-full start-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 hidden group-hover:block z-50 text-xs">
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                {language === 'ar' ? 'تبديل دور المستخدم (RLS):' : 'Switch Actor (RLS):'}
              </div>
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => setCurrentUser(u)}
                  className={`w-full text-start px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                    u.id === currentUser.id
                      ? 'bg-blue-50 text-blue-800 font-bold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="truncate">{u.display_name}</span>
                  <span className="text-[10px] font-mono uppercase text-slate-400">{u.role}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Bell with Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className="w-9 h-9 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors cursor-pointer relative"
              title={language === 'ar' ? 'الإشعارات والمتابعات' : 'Notifications & Updates'}
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {showNotifications && (
              <div className="absolute top-full start-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-bold text-xs text-slate-900">
                      {language === 'ar' ? 'الإشعارات والمتابعات اللحظية' : 'Real-time Notifications'}
                    </span>
                    {unreadNotificationCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </div>
                  {userNotifications.length > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>{language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 pe-1">
                  {userNotifications.length > 0 ? (
                    userNotifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          setShowNotifications(false);
                          setActiveTab('feedback_dashboard');
                        }}
                        className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                          !notif.read
                            ? 'bg-blue-50/70 border-blue-200 hover:bg-blue-100/70'
                            : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={`font-bold ${!notif.read ? 'text-blue-900' : 'text-slate-800'}`}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {notif.created_at}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {language === 'ar' ? 'لا توجد إشعارات جديدة حالياً' : 'No new notifications'}
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      setActiveTab('feedback_dashboard');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>{language === 'ar' ? 'الانتقال إلى لوحة الملاحظات المركزية' : 'Open Notes Central Dashboard'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RLS Active Pill indicator */}
          {isRlsActive && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'ar' ? 'الصلاحيات محصورة بـ RLS' : 'Scoped by RLS'}</span>
            </div>
          )}
        </div>

        {/* Global Search Bar (Center) */}
        <div className="w-full md:max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder={
              language === 'ar'
                ? 'البحث في المشاريع والمهام والوحدات...'
                : 'Search projects, tasks, and units...'
            }
            className="w-full bg-slate-50/90 hover:bg-slate-100/90 focus:bg-white border border-slate-200/80 rounded-2xl ps-10 pe-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
          />
        </div>

        {/* Date & Motto Widget + Language Toggle (End side) */}
        <div className="flex items-center gap-3">
          {/* Date Widget */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="text-start">
              <div className="font-semibold text-slate-900 leading-tight">
                {todayFormatted}
              </div>
              <div className="text-[10px] text-slate-500">
                {language === 'ar' ? 'معاً لمستقبل أفضل' : 'Together for a Better Future'}
              </div>
            </div>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors cursor-pointer border border-slate-200/60"
            title="Toggle Language / تبديل اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
