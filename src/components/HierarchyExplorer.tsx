import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Unit, UnitLevel } from '../types';
import {
  FolderTree,
  Lock,
  Plus,
  ArrowRightLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  Check,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const HierarchyExplorer: React.FC = () => {
  const {
    units,
    visibleUnits,
    currentUser,
    currentUserUnit,
    language,
    reparentUnit,
    addUnit,
  } = useApp();

  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(() => new Set([1, 2, 3, 10, 20]));
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  // New unit form state
  const [newParentId, setNewParentId] = useState<number>(1);
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newLevel, setNewLevel] = useState<UnitLevel>('city');
  const [newLat, setNewLat] = useState<number>(24.0);
  const [newLng, setNewLng] = useState<number>(45.0);

  // Reparent form state
  const [moveTargetParentId, setMoveTargetParentId] = useState<number>(1);

  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedUnit = useMemo(() => {
    return units.find(u => u.id === selectedUnitId) || units[0];
  }, [units, selectedUnitId]);

  const isSelectedVisibleUnderRls = useMemo(() => {
    return visibleUnits.some(u => u.id === selectedUnit.id);
  }, [visibleUnits, selectedUnit]);

  // Build tree hierarchy map
  const treeMap = useMemo(() => {
    const map = new Map<number | null, Unit[]>();
    units.forEach(u => {
      const list = map.get(u.parent_id) || [];
      list.push(u);
      map.set(u.parent_id, list);
    });
    return map;
  }, [units]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameAr.trim()) return;
    addUnit({
      parent_id: newParentId,
      name_ar: newNameAr.trim(),
      name_en: newNameEn.trim() || newNameAr.trim(),
      level: newLevel,
      latitude: Number(newLat) || null,
      longitude: Number(newLng) || null,
    });
    setShowAddModal(false);
    setNewNameAr('');
    setNewNameEn('');
  };

  const handleMoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reparentUnit(selectedUnit.id, moveTargetParentId);
    setShowMoveModal(false);
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (unit: Unit, depth = 0) => {
    const children = treeMap.get(unit.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(unit.id);
    const isSelected = selectedUnit.id === unit.id;
    const isAuthorized = visibleUnits.some(u => u.id === unit.id);

    return (
      <div key={unit.id} className="select-none">
        <div
          onClick={() => setSelectedUnitId(unit.id)}
          className={`flex items-center justify-between py-1.5 px-2 rounded cursor-pointer transition-colors text-xs ${
            isSelected
              ? 'bg-indigo-50 text-indigo-950 font-semibold'
              : 'hover:bg-slate-100 text-slate-700'
          } ${!isAuthorized ? 'opacity-40 italic' : ''}`}
          style={{ paddingLeft: `${depth * 18 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 truncate">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(unit.id);
                }}
                className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}

            {!isAuthorized && <Lock className="w-3 h-3 text-amber-600 shrink-0" />}

            <span className="truncate">
              {language === 'ar' ? unit.name_ar : unit.name_en}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] shrink-0 font-mono text-slate-400">
            <span>{unit.level}</span>
            <span>{unit.path}</span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining Materialized Path */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-indigo-600" />
            <span>
              {language === 'ar'
                ? 'إدارة الهيكل التنظيمي والمسارات المادية (Materialized Path)'
                : 'Hierarchy Architecture & Materialized Path Engine'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'يُخزن المسار بالشكل «/1/2/10/» لإتاحة استعلامات شجرية فائقة السرعة بدون تكرار استعلامات CTE المتداخلة، وتطبيق سياسة RLS بقيد واحد.'
              : 'Stored as "/1/2/10/" to power sub-millisecond tree rollups without recursive CTE overhead, indexed by text_pattern_ops.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'إضافة وحدة جديدة' : 'Add Unit'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Tree, Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Tree Explorer */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <span className="text-xs font-semibold text-slate-700">
              {language === 'ar' ? 'شجرة الكيانات' : 'Organization Tree'}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{units.length} {language === 'ar' ? 'وحدة' : 'units'}</span>
              <span>·</span>
              <span>
                {visibleUnits.length} {language === 'ar' ? 'متاحة للمستخدم' : 'authorized'}
              </span>
            </div>
          </div>

          <div className="space-y-0.5 max-h-[600px] overflow-y-auto pr-1">
            {(treeMap.get(null) || []).map(rootUnit => renderTreeNode(rootUnit, 0))}
          </div>
        </div>

        {/* Right Inspector & Node Operations */}
        <div className="lg:col-span-6 space-y-6">
          {/* Node Inspector Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase">
                  ID: {selectedUnit.id} · Level: {selectedUnit.level}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {language === 'ar' ? selectedUnit.name_ar : selectedUnit.name_en}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar' ? selectedUnit.name_en : selectedUnit.name_ar}
                </div>
              </div>

              {/* RLS Status Badge */}
              <div className="text-right">
                {isSelectedVisibleUnderRls ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'مصرّح بالوصول' : 'Authorized'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'محجوب أمنياً (RLS)' : 'Blocked by RLS'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Properties Table */}
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'المسار المادي (Path)' : 'Path'}</span>
                <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedUnit.path}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'الوحدة الأم (Parent ID)' : 'Parent ID'}</span>
                <span className="font-mono text-slate-700">
                  {selectedUnit.parent_id !== null ? selectedUnit.parent_id : '(Root / الجذر)'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'الإحداثيات الجغرافية' : 'Coordinates'}</span>
                <span className="font-mono text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {selectedUnit.latitude ?? 'N/A'}, {selectedUnit.longitude ?? 'N/A'}
                </span>
              </div>
            </div>

            {/* Reparent Action Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMoveTargetParentId(selectedUnit.parent_id || 1);
                  setShowMoveModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {language === 'ar'
                    ? 'إعادة تعيين التبعية الهيكلية (نقل الوحدة وأبنائها)'
                    : 'Reparent Unit & Cascade Descendant Paths'}
                </span>
              </button>
            </div>
          </div>

          {/* RLS Query Demonstration Card */}
          <div className="bg-slate-900 text-slate-300 rounded-lg p-5 text-xs font-mono border border-slate-800 space-y-3">
            <div className="text-slate-400 font-sans font-semibold text-[11px] uppercase tracking-wider">
              {language === 'ar'
                ? 'استعلام التحقق الأمني من الصلاحية (RLS Policy Proof):'
                : 'RLS Hierarchy Access Verification Proof:'}
            </div>

            <div className="bg-slate-950 p-3 rounded text-[11px] leading-relaxed text-indigo-300">
              {`-- Simulated Current User: ${currentUser.username} (path: ${currentUserUnit.path})\n` +
               `SELECT EXISTS (\n` +
               `  SELECT 1 FROM units u\n` +
               `  WHERE u.id = ${selectedUnit.id}\n` +
               `    AND u.path LIKE '${currentUserUnit.path}%'\n` +
               `) AS is_accessible;`}
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] font-sans">
              <span className="text-slate-400">
                {language === 'ar' ? 'النتيجة في محرك قاعدة البيانات:' : 'Database Engine Evaluation:'}
              </span>
              <span
                className={`font-mono font-bold ${
                  isSelectedVisibleUnderRls ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isSelectedVisibleUnderRls ? 'TRUE (ALLOWED)' : 'FALSE (ACCESS DENIED)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Unit */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              {language === 'ar' ? 'إضافة وحدة تنظيمية جديدة' : 'Add New Organizational Unit'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ar'
                ? 'سيتم توليد المسار المادي تلقائياً عبر مشغل قاعدة البيانات fn_units_maintain_path()'
                : 'Materialized path will be computed automatically via fn_units_maintain_path() trigger.'}
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'الوحدة الأم (Parent Unit)' : 'Parent Unit'}
                </label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                >
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.level.toUpperCase()} · {language === 'ar' ? u.name_ar : u.name_en} ({u.path})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'المستوى الهيكلي' : 'Hierarchy Level'}
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as UnitLevel)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                >
                  <option value="continent">continent (قارة)</option>
                  <option value="region">region (إقليم)</option>
                  <option value="country">country (دولة)</option>
                  <option value="city">city (مدينة / مركز تشغيلي)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مركز عمليات مكة المكرمة"
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Makkah Operations Center"
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'خط العرض (Latitude)' : 'Latitude'}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLat}
                    onChange={(e) => setNewLat(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'خط الطول (Longitude)' : 'Longitude'}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLng}
                    onChange={(e) => setNewLng(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono text-slate-900"
                  />
                </div>
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
                  <span>{language === 'ar' ? 'إضافة الوحدة' : 'Create Unit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reparent Unit */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              {language === 'ar' ? 'نقل الوحدة وإعادة حساب المسارات' : 'Reparent Unit & Cascade Path'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ar'
                ? `سيتم نقل وحدة «${selectedUnit.name_ar}» وتحديث جميع مسارات الوحدات التابعة لها تلقائياً.`
                : `Moving "${selectedUnit.name_en}" will cascade path prefix updates to all descendant units.`}
            </p>

            <form onSubmit={handleMoveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'ar' ? 'اختر الوحدة الأم الجديدة:' : 'Select New Parent Unit:'}
                </label>
                <select
                  value={moveTargetParentId}
                  onChange={(e) => setMoveTargetParentId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900"
                >
                  {units
                    .filter(u => u.id !== selectedUnit.id && !u.path.startsWith(selectedUnit.path))
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.level.toUpperCase()} · {language === 'ar' ? u.name_ar : u.name_en} ({u.path})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تأكيد النقل' : 'Confirm Reparent'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
