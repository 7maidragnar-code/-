import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { RollupDashboard } from './components/RollupDashboard';
import { HierarchyExplorer } from './components/HierarchyExplorer';
import { CommitteeDirectory } from './components/CommitteeDirectory';
import { ProgressForecaster } from './components/ProgressForecaster';
import { NotesSemanticSearch } from './components/NotesSemanticSearch';
import { OfflineGisMap } from './components/OfflineGisMap';
import { SqlWorkbench } from './components/SqlWorkbench';
import { SupervisorMonitoring } from './components/SupervisorMonitoring';
import { FeedbackNotesDashboard } from './components/FeedbackNotesDashboard';
import executiveBgImg from './assets/images/executive_dashboard_bg_1790565670814.jpg';

const AppContent: React.FC = () => {
  const { activeTab, toast, language } = useApp();

  return (
    <div className="min-h-screen flex flex-row bg-[#F0F4F9] text-slate-900 relative selection:bg-blue-500 selection:text-white">
      {/* Ambient Textless High-End Executive Backdrop (Exact match to reference style) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${executiveBgImg})` }}
      />
      {/* Clean soft wash ensuring crisp WCAG contrast */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#F0F4F9]/60 via-[#F0F4F9]/85 to-[#EBF0F7]" />

      {/* Deep Navy Sidebar with Glowing City Skyline (Right in RTL, Left in LTR) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 min-h-screen">
        <Header />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && <RollupDashboard />}
          {activeTab === 'feedback_dashboard' && <FeedbackNotesDashboard />}
          {activeTab === 'supervisor_monitoring' && <SupervisorMonitoring />}
          {activeTab === 'hierarchy' && <HierarchyExplorer />}
          {activeTab === 'committees' && <CommitteeDirectory />}
          {activeTab === 'progress' && <ProgressForecaster />}
          {activeTab === 'notes' && <NotesSemanticSearch />}
          {activeTab === 'gis_map' && <OfflineGisMap />}
          {activeTab === 'sql_lab' && <SqlWorkbench />}
        </main>

        {/* Clean Footer adhering to design guidelines */}
        <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-4 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {language === 'ar' ? 'أعضاء اللجان والمشاريع' : 'Committees & Projects Hub'}
              </span>
              <span>·</span>
              <span className="font-mono text-slate-400">PostgreSQL 16 & pgvector</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>{language === 'ar' ? 'بناء اليوم لمستقبل أكثر ازدهاراً' : 'Building Today for a Better Tomorrow'}</span>
              <span>·</span>
              <span>Offline GIS Spatial</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 end-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
