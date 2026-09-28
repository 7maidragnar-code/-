import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CommitteeMember } from '../types';
import { normalizeArabic, matchesArabicSearch } from '../utils/arabic';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  Building,
  Check,
  Edit2,
  Sparkles,
  Briefcase,
  FolderGit2,
} from 'lucide-react';

export const CommitteeDirectory: React.FC = () => {
  const {
    committees,
    visibleMembers,
    visibleUnits,
    language,
    addMember,
    updateMember,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'committee' | 'project'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);

  // Form states
  const [formCommitteeId, setFormCommitteeId] = useState<number>(committees[0]?.id || 1);
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLocationId, setFormLocationId] = useState<number>(visibleUnits[0]?.id || 1);
  const [formBeneficiaryId, setFormBeneficiaryId] = useState<number>(visibleUnits[0]?.id || 1);

  // Quick unit lookup map
  const unitMap = useMemo(() => {
    return new Map(visibleUnits.map(u => [u.id, u]));
  }, [visibleUnits]);

  // Quick committee/project lookup map
  const committeeMap = useMemo(() => {
    return new Map(committees.map(c => [c.id, c]));
  }, [committees]);

  // Normalized search query
  const normalizedQuery = useMemo(() => normalizeArabic(searchQuery), [searchQuery]);

  // Filtered members list with fuzzy search scoring
  const searchResults = useMemo(() => {
    return visibleMembers
      .filter(m => {
        if (selectedEntityId !== 'all' && m.committee_id !== selectedEntityId) {
          return false;
        }
        if (typeFilter !== 'all') {
          const entity = committeeMap.get(m.committee_id);
          if (entity && (entity.type || 'committee') !== typeFilter) {
            return false;
          }
        }
        return true;
      })
      .map(m => {
        const matchResult = matchesArabicSearch(m.full_name, searchQuery);
        return {
          member: m,
          ...matchResult,
        };
      })
      .filter(item => item.matches)
      .sort((a, b) => b.score - a.score);
  }, [visibleMembers, selectedEntityId, typeFilter, committeeMap, searchQuery]);

  const handleOpenAdd = () => {
    const nextEmpId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormEmployeeId(nextEmpId);
    setFormTitle('');
    setFormFullName('');
    setFormPhone('+966-50-000-0000');
    setEditingMember(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: CommitteeMember) => {
    setEditingMember(m);
    setFormCommitteeId(m.committee_id);
    setFormEmployeeId(m.employee_id || m.ref_number || '');
    setFormTitle(m.title);
    setFormFullName(m.full_name);
    setFormPhone(m.phone);
    setFormLocationId(m.location_id || visibleUnits[0]?.id || 1);
    setFormBeneficiaryId(m.beneficiary_id || visibleUnits[0]?.id || 1);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim()) return;

    if (editingMember) {
      updateMember({
        ...editingMember,
        committee_id: formCommitteeId,
        employee_id: formEmployeeId.trim(),
        ref_number: formEmployeeId.trim(),
        title: formTitle.trim(),
        full_name: formFullName.trim(),
        phone: formPhone.trim(),
        location_id: formLocationId,
        beneficiary_id: formBeneficiaryId,
      });
    } else {
      addMember({
        committee_id: formCommitteeId,
        employee_id: formEmployeeId.trim(),
        ref_number: formEmployeeId.trim(),
        title: formTitle.trim(),
        full_name: formFullName.trim(),
        phone: formPhone.trim(),
        location_id: formLocationId,
        beneficiary_id: formBeneficiaryId,
      });
    }

    setShowAddModal(false);
  };

  const standingCommittees = useMemo(() => {
    return committees.filter(c => (c.type || 'committee') === 'committee');
  }, [committees]);

  const strategicProjects = useMemo(() => {
    return committees.filter(c => c.type === 'project');
  }, [committees]);

  return (
    <div className="space-y-6">
      {/* Top Header & Search Console */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>
                {language === 'ar' ? 'سجل أعضاء اللجان والمشاريع' : 'Committees & Projects Members Directory'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar'
                ? 'إدارة أعضاء اللجان والمشاريع الاستراتيجية، الأرقام الوظيفية، والبحث المعياري بتطبيع الحروف العربية.'
                : 'Manage committee and project members, employee IDs, and Arabic fuzzy search.'}
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'إضافة عضو جديد' : 'Add Member'}</span>
          </button>
        </div>

        {/* Search Bar & Normalization Inspector */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3" />
            <input
              type="text"
              placeholder={
                language === 'ar'
                  ? 'ابحث باسم العضو (جرب: احمد، فاطمه، عبد الله، يحيى، حسام)...'
                  : 'Search by member name (e.g. Ahmed, Fatima, Abdullah, Hussam)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-9 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {searchQuery.trim() && (
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600 font-mono">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-sans text-slate-500">
                  {language === 'ar' ? 'النص بعد التطبيع العربي:' : 'Normalized Arabic Query:'}
                </span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                  "{normalizedQuery}"
                </span>
              </div>
              <div className="text-slate-400 font-sans text-[11px]">
                {language === 'ar'
                  ? `تم العثور على ${searchResults.length} نتائج مطابقة بنجاح`
                  : `Found ${searchResults.length} fuzzy matches`}
              </div>
            </div>
          )}
        </div>

        {/* Category & Entity Segmented Filter */}
        <div className="space-y-3 pt-1">
          {/* Main Type Selector: All vs Committees vs Projects */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              {language === 'ar' ? 'تصنيف الكيان:' : 'Entity Type:'}
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs font-medium">
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setSelectedEntityId('all');
                }}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ar' ? 'الكل' : 'All'} ({visibleMembers.length})
              </button>
              <button
                onClick={() => {
                  setTypeFilter('committee');
                  setSelectedEntityId('all');
                }}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'committee' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3 h-3 text-indigo-600" />
                <span>{language === 'ar' ? 'اللجان' : 'Committees'}</span>
              </button>
              <button
                onClick={() => {
                  setTypeFilter('project');
                  setSelectedEntityId('all');
                }}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'project' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderGit2 className="w-3 h-3 text-emerald-600" />
                <span>{language === 'ar' ? 'المشاريع' : 'Projects'}</span>
              </button>
            </div>
          </div>

          {/* Individual Committee/Project Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedEntityId('all')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                selectedEntityId === 'all'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'ar' ? 'عرض جميع الكيانات' : 'All Entities'}
            </button>

            {committees
              .filter(c => typeFilter === 'all' || (c.type || 'committee') === typeFilter)
              .map(c => {
                const count = visibleMembers.filter(m => m.committee_id === c.id).length;
                const isSelected = selectedEntityId === c.id;
                const isProject = c.type === 'project';

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedEntityId(c.id)}
                    className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isProject ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                    />
                    <span>{c.name}</span>
                    <span className="text-[11px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                {/* 1. Replaced Ref Number with Committee or Project Name */}
                <th className="px-5 py-3">{language === 'ar' ? 'اسم اللجنة أو المشروع' : 'Committee / Project'}</th>
                {/* 2. Name & Details */}
                <th className="px-5 py-3">{language === 'ar' ? 'الاسم والبيانات' : 'Member Name & Title'}</th>
                {/* 3. Employee ID right after Name & Details */}
                <th className="px-4 py-3">{language === 'ar' ? 'الرقم الوظيفي' : 'Employee ID'}</th>
                {/* 4. Location */}
                <th className="px-4 py-3">{language === 'ar' ? 'المكان (المقر)' : 'Location'}</th>
                {/* 5. Beneficiary */}
                <th className="px-4 py-3">{language === 'ar' ? 'المكان المستفيد' : 'Beneficiary'}</th>
                {/* 6. Phone */}
                <th className="px-4 py-3">{language === 'ar' ? 'رقم التواصل' : 'Phone'}</th>
                {searchQuery.trim() && (
                  <th className="px-3 py-3 text-center">{language === 'ar' ? 'درجة التطابق' : 'Match Score'}</th>
                )}
                <th className="px-4 py-3 text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {searchResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    {language === 'ar'
                      ? 'لا توجد نتائج مطابقة لبحثك في النطاق المصرّح به.'
                      : 'No committee or project members found matching your search.'}
                  </td>
                </tr>
              ) : (
                searchResults.map(({ member, score }) => {
                  const comm = committeeMap.get(member.committee_id);
                  const loc = unitMap.get(member.location_id || -1);
                  const ben = unitMap.get(member.beneficiary_id || -1);
                  const isProject = comm?.type === 'project';

                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      {/* 1. Committee or Project Name */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {comm?.name || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isProject ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                          />
                          <span>
                            {isProject
                              ? language === 'ar' ? 'مشروع استراتيجي' : 'Strategic Project'
                              : language === 'ar' ? 'لجنة رسمية' : 'Standing Committee'}
                          </span>
                        </div>
                      </td>

                      {/* 2. Member Name & Title */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {member.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {member.title} · <span className="font-mono text-slate-400">{member.name_normalized}</span>
                        </div>
                      </td>

                      {/* 3. Employee ID (الرقم الوظيفي) right after Name */}
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-800">
                        <span className="bg-slate-100 text-slate-900 px-2 py-0.5 rounded text-xs">
                          {member.employee_id || member.ref_number || '—'}
                        </span>
                      </td>

                      {/* 4. Location */}
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {loc ? (language === 'ar' ? loc.name_ar : loc.name_en) : '—'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Beneficiary */}
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>
                            {ben ? (language === 'ar' ? ben.name_ar : ben.name_en) : '—'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Phone */}
                      <td className="px-4 py-3.5 font-mono text-slate-700">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      </td>

                      {/* 7. Match Score (if searching) */}
                      {searchQuery.trim() && (
                        <td className="px-3 py-3.5 text-center font-mono font-bold text-indigo-600">
                          {(score * 100).toFixed(0)}%
                        </td>
                      )}

                      {/* 8. Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors cursor-pointer"
                          title={language === 'ar' ? 'تعديل البيانات' : 'Edit Member'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              {editingMember
                ? language === 'ar' ? 'تعديل بيانات عضو اللجنة / المشروع' : 'Edit Member Details'
                : language === 'ar' ? 'إضافة عضو جديد للجنة أو المشروع' : 'Add Committee / Project Member'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ar'
                ? 'يتم حفظ الرقم الوظيفي وربط العضو باللجنة أو المشروع مع تطبيع الاسم العربي للبحث التلقائي.'
                : 'Stores employee ID and associates member with committee or project with normalized name.'}
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Employee ID */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'الرقم الوظيفي' : 'Employee ID'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-1048"
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono text-slate-900"
                  />
                </div>

                {/* Committee or Project Dropdown */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'اسم اللجنة أو المشروع' : 'Committee or Project'}
                  </label>
                  <select
                    value={formCommitteeId}
                    onChange={(e) => setFormCommitteeId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 font-medium"
                  >
                    <optgroup label={language === 'ar' ? 'اللجان الرسمية' : 'Standing Committees'}>
                      {standingCommittees.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label={language === 'ar' ? 'المشاريع الاستراتيجية' : 'Strategic Projects'}>
                      {strategicProjects.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد بن عبد الله السديري"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                />
                {formFullName && (
                  <div className="mt-1 text-[11px] font-mono text-indigo-700">
                    Normalized: {normalizeArabic(formFullName)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'المسمى الوظيفي / الدور' : 'Title / Role in Project'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مدير مشروع / مهندس نظم / مقرر"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'رقم التواصل (Phone)' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'المكان (مقر العضو)' : 'Location Unit'}
                  </label>
                  <select
                    value={formLocationId}
                    onChange={(e) => setFormLocationId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                  >
                    {visibleUnits.map(u => (
                      <option key={u.id} value={u.id}>
                        {language === 'ar' ? u.name_ar : u.name_en} ({u.level})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'المكان المستفيد' : 'Beneficiary Unit'}
                  </label>
                  <select
                    value={formBeneficiaryId}
                    onChange={(e) => setFormBeneficiaryId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                  >
                    {visibleUnits.map(u => (
                      <option key={u.id} value={u.id}>
                        {language === 'ar' ? u.name_ar : u.name_en} ({u.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
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
                  <span>{editingMember ? (language === 'ar' ? 'حفظ التعديلات' : 'Update') : (language === 'ar' ? 'إضافة العضو' : 'Save Member')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
