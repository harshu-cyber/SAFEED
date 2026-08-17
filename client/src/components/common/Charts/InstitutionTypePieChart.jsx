import React, { useState } from 'react';

export const InstitutionTypePieChart = ({ institutions = [], title = "Institution Type Breakdown", overrideSections }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // If overrideSections provided, use them directly
  let data;
  if (overrideSections) {
    data = overrideSections;
  } else {
    // Categorize institutions by type
    let schoolCount = 0;
    let collegeCount = 0;
    let coachingCount = 0;

    institutions.forEach(inst => {
      const typeUpper = (inst.type || '').toUpperCase();
      if (typeUpper.includes('COLLEGE') || typeUpper.includes('UNIVERSITY')) {
        collegeCount++;
      } else if (typeUpper.includes('COACHING') || typeUpper.includes('TUTORIAL') || typeUpper.includes('INSTITUTE')) {
        coachingCount++;
      } else {
        schoolCount++; // Default to school (includes SCHOOL type and unspecified)
      }
    });

    data = [
      { name: 'Schools (स्कूल)', count: schoolCount, color: '#0F2038', strokeColor: '#D4AF37' },
      { name: 'Colleges (कॉलेज)', count: collegeCount, color: '#2563EB', strokeColor: '#60A5FA' },
      { name: 'Coaching Centres (कोचिंग)', count: coachingCount, color: '#D97706', strokeColor: '#FBBF24' },
    ];
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Compute SVG Donut Slices
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = data.map((item, idx) => {
    const percent = total > 0 ? item.count / total : (idx === 0 ? 1 : 0);
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    const endPercent = cumulativePercent;

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = total === 0 || percent === 1
      ? 'M 1 0 A 1 1 0 1 1 -0.9999 0 Z'
      : `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0 Z`;

    const percentageVal = total > 0 ? Math.round(percent * 100) : 0;

    return {
      ...item,
      percentage: percentageVal,
      pathData,
      startPercent,
      endPercent
    };
  });

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-black text-[#D4AF37] bg-[#0F2038] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Real-Time Category Analytics
          </span>
          <h3 className="text-xs font-black text-[#0F2038] uppercase tracking-wider font-serif mt-1">
            {title} ({total} Total)
          </h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
          Live Sync
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        {/* SVG Donut Chart */}
        <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
          <svg viewBox="-1.15 -1.15 2.3 2.3" className="w-full h-full transform -rotate-90">
            {total === 0 ? (
              <circle cx="0" cy="0" r="1" fill="#E2E8F0" />
            ) : (
              slices.map((slice, i) => (
                <path
                  key={slice.name}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="#FFFFFF"
                  strokeWidth="0.04"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredIdx === i ? 'scale-105 opacity-90' : 'opacity-100'
                  }`}
                  style={{ transformOrigin: '0 0' }}
                />
              ))
            )}
            {/* Donut Center Hole */}
            <circle cx="0" cy="0" r="0.6" fill="#FFFFFF" />
          </svg>

          {/* Center Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-black text-[#0F2038] leading-none">{total}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Institutions</span>
          </div>
        </div>

        {/* Interactive Legends */}
        <div className="flex-1 space-y-2.5 w-full">
          {slices.map((item, idx) => (
            <div
              key={item.name}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                hoveredIdx === idx
                  ? 'bg-slate-100 border-[#D4AF37] shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: item.color, borderColor: item.strokeColor }}
                />
                <div>
                  <p className="font-black text-[#0F2038]">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{item.percentage}% of total registered</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-[#0F2038]">{item.count}</span>
                <span className="text-[10px] text-slate-400 block">units</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
