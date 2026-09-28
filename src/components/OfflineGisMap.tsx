import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Unit } from '../types';
import { calculateSubtreeRollup } from '../utils/math';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Info,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const OfflineGisMap: React.FC = () => {
  const {
    units,
    visibleUnits,
    kpis,
    selectedKpiCode,
    selectedDate,
    members,
    language,
    showToast,
  } = useApp();

  const [zoom, setZoom] = useState(1.4);
  const [pan, setPan] = useState({ x: -180, y: -40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showHierarchyLines, setShowHierarchyLines] = useState(true);
  const [showBeneficiaryFlows, setShowBeneficiaryFlows] = useState(false);

  // Filter units with valid coordinates
  const geoUnits = useMemo(() => {
    return units.filter(u => u.latitude !== null && u.longitude !== null);
  }, [units]);

  // Project lat/lng to SVG Mercator-like coordinates
  // Lat: -85 to 85, Lng: -180 to 180 -> Width 1000, Height 500
  const project = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 1000;
    // Simple projection
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = 250 - (mercN * 250) / Math.PI;
    return { x, y: Math.max(20, Math.min(480, y)) };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // GeoJSON Generator directly from database schema
  const handleExportGeoJson = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      features: geoUnits.map(u => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [u.longitude, u.latitude],
        },
        properties: {
          unit_id: u.id,
          name_ar: u.name_ar,
          name_en: u.name_en,
          level: u.level,
          path: u.path,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline_units_geojson_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(language === 'ar' ? 'تم تصدير ملف GeoJSON للخريطة دون الحاجة لاتصال بالإنترنت' : 'GeoJSON exported for offline GIS mapping');
  };

  // Unit details calculation
  const unitStats = useMemo(() => {
    if (!selectedUnit) return null;
    const rollup = calculateSubtreeRollup(
      selectedUnit.path,
      visibleUnits,
      kpis,
      selectedKpiCode,
      selectedDate
    );
    const unitMembers = members.filter(
      m => m.location_id === selectedUnit.id || m.beneficiary_id === selectedUnit.id
    );
    return { ...rollup, members: unitMembers };
  }, [selectedUnit, visibleUnits, kpis, selectedKpiCode, selectedDate, members]);

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>
              {language === 'ar'
                ? 'الخريطة الجغرافية المستقلة (Zero-Geocoding Offline GIS)'
                : 'Offline GIS Spatial Vector Map'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ar'
              ? 'تعتمد بالكامل على إحداثيات الجدول u.latitude و u.longitude دون استهلاك أي حصة لواجهات برمجية خارجية أو اتصال إنترنت.'
              : 'Uses fixed database coordinates directly—100% offline, zero external tile latency, zero geocoding costs.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggles */}
          <button
            onClick={() => setShowHierarchyLines(!showHierarchyLines)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showHierarchyLines
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{language === 'ar' ? 'روابط الهيكل' : 'Org Links'}</span>
          </button>

          <button
            onClick={() => setShowBeneficiaryFlows(!showBeneficiaryFlows)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showBeneficiaryFlows
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ArrowUpRight className="w-3 h-3" />
            <span>{language === 'ar' ? 'تدفق المستفيدين' : 'Beneficiary Flows'}</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setZoom(z => Math.min(3.5, z + 0.3))}
              className="p-1 hover:bg-white rounded text-slate-700 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.8, z - 0.3))}
              className="p-1 hover:bg-white rounded text-slate-700 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1.4);
                setPan({ x: -180, y: -40 });
              }}
              className="p-1 hover:bg-white rounded text-slate-700 cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export GeoJSON */}
          <button
            onClick={handleExportGeoJson}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GeoJSON</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner h-[540px]">
        <svg
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          viewBox="0 0 1000 500"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Background Grid & World Outline Guides */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="1000" height="500" fill="url(#grid)" />

            {/* Stylized continent landmass polygons for context without external tiles */}
            {/* Middle East & North Africa Landmass */}
            <path
              d="M 520 220 Q 560 210 590 230 T 630 250 Q 640 290 610 320 T 570 330 T 530 290 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="0.8"
              opacity="0.8"
            />
            {/* Europe Landmass */}
            <path
              d="M 460 140 Q 510 110 550 140 T 570 190 T 500 210 T 470 180 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="0.8"
              opacity="0.8"
            />
            {/* Americas Landmass */}
            <path
              d="M 220 150 Q 280 130 300 180 T 260 260 T 230 200 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="0.8"
              opacity="0.6"
            />

            {/* Hierarchy Connector Lines */}
            {showHierarchyLines &&
              geoUnits.map(unit => {
                if (!unit.parent_id) return null;
                const parent = geoUnits.find(p => p.id === unit.parent_id);
                if (!parent || parent.latitude === null || parent.longitude === null) return null;

                const p1 = project(parent.latitude, parent.longitude);
                const p2 = project(unit.latitude!, unit.longitude!);

                return (
                  <line
                    key={`hier-${unit.id}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="rgba(99, 102, 241, 0.4)"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                  />
                );
              })}

            {/* Beneficiary Flow Curved Lines */}
            {showBeneficiaryFlows &&
              members.map((m, idx) => {
                if (!m.location_id || !m.beneficiary_id || m.location_id === m.beneficiary_id) return null;
                const loc = geoUnits.find(u => u.id === m.location_id);
                const ben = geoUnits.find(u => u.id === m.beneficiary_id);
                if (!loc?.latitude || !loc?.longitude || !ben?.latitude || !ben?.longitude) return null;

                const p1 = project(loc.latitude, loc.longitude);
                const p2 = project(ben.latitude, ben.longitude);
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2 - 20;

                return (
                  <path
                    key={`flow-${idx}`}
                    d={`M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1"
                    opacity="0.7"
                  />
                );
              })}

            {/* Unit Node Markers */}
            {geoUnits.map(unit => {
              const pos = project(unit.latitude!, unit.longitude!);
              const isSelected = selectedUnit?.id === unit.id;
              const isVisibleUnderRls = visibleUnits.some(u => u.id === unit.id);

              const rollup = calculateSubtreeRollup(
                unit.path,
                visibleUnits,
                kpis,
                selectedKpiCode,
                selectedDate
              );

              const color =
                rollup.weightedPct >= 90
                  ? '#10b981' // emerald
                  : rollup.weightedPct >= 80
                  ? '#6366f1' // indigo
                  : '#f59e0b'; // amber

              const radius = unit.level === 'company' ? 9 : unit.level === 'continent' ? 7 : unit.level === 'country' ? 5.5 : 4;

              return (
                <g
                  key={unit.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUnit(unit);
                  }}
                >
                  {/* Outer pulse if selected */}
                  {isSelected && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  )}

                  {/* Marker Circle */}
                  <circle
                    r={radius}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? '2' : '1.2'}
                    opacity={isVisibleUnderRls ? 1 : 0.3}
                  />

                  {/* Label on canvas */}
                  <text
                    x={radius + 4}
                    y={3}
                    fill="#e2e8f0"
                    fontSize="8.5"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight={isSelected ? '700' : '500'}
                    opacity={isVisibleUnderRls ? 0.9 : 0.4}
                  >
                    {language === 'ar' ? unit.name_ar : unit.name_en}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Inspector Card for Selected Unit */}
        {selectedUnit && unitStats && (
          <div className="absolute top-4 end-4 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {selectedUnit.level} · ID: {selectedUnit.id}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {language === 'ar' ? selectedUnit.name_ar : selectedUnit.name_en}
                </h4>
                <div className="text-[11px] text-slate-500 font-mono">
                  {selectedUnit.path}
                </div>
              </div>

              <button
                onClick={() => setSelectedUnit(null)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500">
                  {language === 'ar' ? 'نسبة الإنجاز (الموزونة)' : 'Weighted KPI'}
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {unitStats.weightedPct}%
                </div>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-600">
                <div>{unitStats.totalNumerator} / {unitStats.totalDenominator}</div>
                <div className="text-[10px] text-slate-400">
                  {unitStats.participatingUnitsCount} {language === 'ar' ? 'وحدة فرعية' : 'sub-units'}
                </div>
              </div>
            </div>

            <div className="text-xs">
              <span className="font-semibold text-slate-700 block mb-1">
                {language === 'ar' ? 'الأعضاء المرتبطون بهذا الموقع:' : 'Linked Committee Members:'}
              </span>
              {unitStats.members.length === 0 ? (
                <span className="text-slate-400 italic">
                  {language === 'ar' ? 'لا يوجد أعضاء مرتبطين حالياً' : 'No members linked to this unit'}
                </span>
              ) : (
                <ul className="space-y-1">
                  {unitStats.members.slice(0, 3).map(m => (
                    <li key={m.id} className="text-slate-600 flex items-center justify-between">
                      <span className="truncate">{m.full_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {m.location_id === selectedUnit.id ? '(Location)' : '(Beneficiary)'}
                      </span>
                    </li>
                  ))}
                  {unitStats.members.length > 3 && (
                    <li className="text-[10px] text-indigo-600">
                      +{unitStats.members.length - 3} {language === 'ar' ? 'أعضاء إضافيين' : 'more'}
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Lat: {selectedUnit.latitude}</span>
              <span>Lng: {selectedUnit.longitude}</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 start-3 bg-slate-900/80 backdrop-blur-xs border border-slate-800 rounded px-3 py-1.5 text-[11px] text-slate-300 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>&ge; 90% (Nominal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
            <span>80-89% (On Track)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>&lt; 80% (Attention)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
