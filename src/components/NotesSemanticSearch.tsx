import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CommitteeNote, SentimentType } from '../types';
import { cosineSimilarity, generateConceptVector } from '../utils/math';
import {
  FileText,
  Search,
  Plus,
  Compass,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const NotesSemanticSearch: React.FC = () => {
  const {
    visibleNotes,
    visibleMembers,
    language,
    addNote,
    isSupervisor,
    setActiveTab,
  } = useApp();

  const [semanticQuery, setSemanticQuery] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Note form states
  const [formMemberId, setFormMemberId] = useState<number>(visibleMembers[0]?.id || 1);
  const [formBody, setFormBody] = useState('');
  const [formCategory, setFormCategory] = useState('manpower');
  const [formSentiment, setFormSentiment] = useState<SentimentType>('positive');

  const memberMap = useMemo(() => {
    return new Map(visibleMembers.map(m => [m.id, m]));
  }, [visibleMembers]);

  // Compute query vector if search is active
  const queryVector = useMemo(() => {
    if (!semanticQuery.trim()) return null;
    return generateConceptVector(semanticQuery);
  }, [semanticQuery]);

  // Ranked notes based on cosine similarity
  const rankedNotes = useMemo(() => {
    return visibleNotes
      .filter(note => {
        if (selectedSentiment !== 'all' && note.ai_sentiment !== selectedSentiment) {
          return false;
        }
        if (selectedCategory !== 'all' && note.ai_category !== selectedCategory) {
          return false;
        }
        return true;
      })
      .map(note => {
        let similarity = 0;
        if (queryVector && note.embedding) {
          similarity = cosineSimilarity(queryVector, note.embedding);
        }
        return {
          note,
          similarity: Number(similarity.toFixed(4)),
        };
      })
      .sort((a, b) => {
        if (queryVector) {
          return b.similarity - a.similarity;
        }
        return b.note.day.localeCompare(a.note.day);
      });
  }, [visibleNotes, selectedSentiment, selectedCategory, queryVector]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBody.trim()) return;

    addNote(formMemberId, formBody.trim(), formCategory, formSentiment);
    setShowAddModal(false);
    setFormBody('');
  };

  const categories = ['all', 'manpower', 'fleet', 'digital', 'compliance', 'budget'];

  return (
    <div className="space-y-6">
      {/* Top Header & Search Console */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>
                {language === 'ar'
                  ? 'ملاحظات اللجان والبحث الدلالي بالمتجهات (1024-dim HNSW Vector Search)'
                  : 'Committee Notes & Vector Semantic Search (1024-dim BGE-M3)'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar'
                ? 'استعلامات التشابه الدلالي عبر جيب التمام (Cosine Similarity) المطابقة لمكتبة pgvector ومؤشر HNSW.'
                : 'Simulates PostgreSQL pgvector HNSW indexing using 1024-dimensional normalized concept embeddings.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {isSupervisor && (
              <button
                onClick={() => setActiveTab('supervisor_monitoring')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-gradient-to-r from-amber-300 to-amber-200 hover:brightness-105 border border-amber-400 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-900" />
                <span>{language === 'ar' ? 'مراقبة أداء الموظفين' : 'Supervisor Portal'}</span>
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إضافة ملاحظة جديدة' : 'Add Note'}</span>
            </button>
          </div>
        </div>

        {/* Semantic Search Input */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3" />
            <input
              type="text"
              placeholder={
                language === 'ar'
                  ? 'ابحث بالمعنى والدلالة (جرب: قوى عاملة وتوظيف، أسطول النقل، الميزانية والتعاقدات، الامتثال والرقابة)...'
                  : 'Search by semantic meaning (e.g. manpower recruitment, fleet readiness, budget contracts, compliance)...'
              }
              value={semanticQuery}
              onChange={(e) => setSemanticQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-9 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {semanticQuery.trim() && (
            <div className="bg-indigo-50 border border-indigo-100 rounded p-2.5 text-xs flex items-center justify-between text-indigo-900 font-mono">
              <div>
                <span className="font-sans text-indigo-700">
                  {language === 'ar' ? 'استعلام المتجه النشط:' : 'Active Vector Query:'}
                </span>{' '}
                <span>1024-dim Normalized Concept Vector Generated</span>
              </div>
              <span className="text-[11px] font-sans text-indigo-600">
                {language === 'ar' ? 'الترتيب تنازلياً حسب جيب التمام' : 'Ranked by Cosine Similarity DESC'}
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">
              {language === 'ar' ? 'التصنيف:' : 'Category:'}
            </span>
            <div className="flex items-center gap-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer capitalize ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">
              {language === 'ar' ? 'الشعور (Sentiment):' : 'Sentiment:'}
            </span>
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value as SentimentType | 'all')}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
            >
              <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
              <option value="positive">{language === 'ar' ? 'إيجابي (Positive)' : 'Positive'}</option>
              <option value="neutral">{language === 'ar' ? 'محايد (Neutral)' : 'Neutral'}</option>
              <option value="negative">{language === 'ar' ? 'سلبي (Negative)' : 'Negative'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* SQL Vector Query Preview */}
      <div className="bg-slate-900 text-slate-300 rounded-lg p-4 text-xs font-mono border border-slate-800 overflow-x-auto">
        <div className="text-slate-400 mb-1 text-[11px] uppercase font-sans">
          {language === 'ar' ? 'استعلام المتجهات في PostgreSQL (pgvector HNSW Operator):' : 'pgvector HNSW Distance Operator Query:'}
        </div>
        <code>
          {`SELECT id, body, ai_summary, ai_sentiment,\n` +
           `       1 - (embedding <=> :query_embedding) AS cosine_similarity\n` +
           `FROM committee_notes\n` +
           `ORDER BY embedding <=> :query_embedding ASC\n` +
           `LIMIT 5;`}
        </code>
      </div>

      {/* Notes Feed */}
      <div className="space-y-3">
        {rankedNotes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-xs">
            {language === 'ar'
              ? 'لا توجد ملاحظات تطابق معايير البحث الحالية.'
              : 'No notes found matching current search filters.'}
          </div>
        ) : (
          rankedNotes.map(({ note, similarity }) => {
            const member = memberMap.get(note.member_id);
            const sentimentColor =
              note.ai_sentiment === 'positive'
                ? 'text-emerald-700'
                : note.ai_sentiment === 'negative'
                ? 'text-rose-700'
                : 'text-amber-700';

            return (
              <div
                key={note.id}
                className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-900">
                      {member?.full_name || `Member #${note.member_id}`}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-mono">{note.day}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600 capitalize font-medium">{note.ai_category}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {queryVector && (
                      <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        Cosine: {similarity}
                      </div>
                    )}
                    <span className={`font-semibold capitalize text-xs ${sentimentColor}`}>
                      {note.ai_sentiment}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-sans">
                  {note.body}
                </p>

                {note.ai_summary && (
                  <div className="bg-slate-50 border-s-2 border-indigo-400 px-3 py-1.5 text-xs text-slate-600">
                    <span className="font-medium text-slate-800">
                      {language === 'ar' ? 'الملخص الآلي:' : 'Summary:'}
                    </span>{' '}
                    {note.ai_summary}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Note */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              {language === 'ar' ? 'إضافة ملاحظة جديدة للجنة' : 'Add New Committee Note'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ar'
                ? 'يتم توليد متجه التضمين الدلالي (1024 بعد) وحفظه مع الملاحظة لتمكين البحث الهجين.'
                : 'A 1024-dimensional concept embedding is calculated and stored with the note.'}
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'العضو كاتب الملاحظة' : 'Author Member'}
                </label>
                <select
                  value={formMemberId}
                  onChange={(e) => setFormMemberId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                >
                  {visibleMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.employee_id || m.ref_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 capitalize"
                  >
                    <option value="manpower">manpower (القوى العاملة)</option>
                    <option value="fleet">fleet (الأسطول اللوجستي)</option>
                    <option value="digital">digital (التحول الرقمي)</option>
                    <option value="compliance">compliance (الحوكمة والامتثال)</option>
                    <option value="budget">budget (الميزانية والتكاليف)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'الشعور التقديري (Sentiment)' : 'Sentiment'}
                  </label>
                  <select
                    value={formSentiment}
                    onChange={(e) => setFormSentiment(e.target.value as SentimentType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                  >
                    <option value="positive">positive (إيجابي)</option>
                    <option value="neutral">neutral (محايد)</option>
                    <option value="negative">negative (سلبي)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'نص الملاحظة' : 'Note Body'}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={
                    language === 'ar'
                      ? 'اكتب تفاصيل الملاحظة، المعوقات، أو الإنجازات المحققة...'
                      : 'Enter detailed observation, roadblock, or milestone...'
                  }
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'حفظ وتوليد المتجه' : 'Save & Embed'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
