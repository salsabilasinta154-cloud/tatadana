'use client';

import React, { useState } from 'react';
import { formatRupiah } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

// 1. CATEGORY PIE / DONUT CHART
export interface CategorySlice {
  name: string;
  amount: number;
  color: string;
}

export function CategoryPieChart({ data }: { data: CategorySlice[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  if (total === 0 || data.length === 0) {
    return (
      <Card className="h-full flex flex-col justify-center items-center p-8 text-center text-surface-400">
        <p className="text-sm">Belum ada data pengeluaran kategori bulan ini.</p>
      </Card>
    );
  }

  // Calculate SVG donut segments
  let cumulativeAngle = 0;
  const radius = 60;
  const strokeWidth = 24;
  const center = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Distribusi Pengeluaran Kategori</CardTitle>
        <span className="text-xs font-semibold text-surface-500">Bulan Ini</span>
      </CardHeader>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-1">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {data.map((item, idx) => {
              const fraction = item.amount / total;
              const strokeDasharray = `${fraction * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle * circumference;
              cumulativeAngle += fraction;

              return (
                <circle
                  key={item.name}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={hoveredIdx === idx ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-surface-400">Total</span>
            <span className="text-xs font-black text-surface-900 px-2 leading-tight">
              {hoveredIdx !== null ? formatRupiah(data[hoveredIdx].amount) : formatRupiah(total)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2">
          {data.slice(0, 5).map((item, idx) => {
            const percentage = Math.round((item.amount / total) * 100);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isHovered ? 'bg-surface-100 font-semibold' : 'hover:bg-surface-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-surface-700 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-surface-900">{formatRupiah(item.amount)}</span>
                  <span className="text-surface-400 text-[10px] w-7 text-right">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// 2. MONTHLY BAR CHART (6 BULAN TERAKHIR)
export interface MonthCashflow {
  month: string;
  income: number;
  expense: number;
}

export function MonthlyBarChart({ data }: { data: MonthCashflow[] }) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1000000);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Arus Kas 6 Bulan Terakhir</CardTitle>
          <p className="text-xs text-surface-500 mt-0.5">Komparasi Pemasukan vs Pengeluaran</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-surface-600">Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
            <span className="text-surface-600">Pengeluaran</span>
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2">
        {data.map((item) => {
          const incHeight = Math.max(4, Math.round((item.income / maxVal) * 120));
          const expHeight = Math.max(4, Math.round((item.expense / maxVal) * 120));
          const isHovered = hoveredMonth === item.month;

          return (
            <div
              key={item.month}
              className="flex-1 flex flex-col items-center group cursor-pointer"
              onMouseEnter={() => setHoveredMonth(item.month)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              {/* Tooltip on hover */}
              <div
                className={`text-[10px] font-bold text-center mb-1 text-surface-700 transition-opacity ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {formatRupiah(item.income - item.expense)}
              </div>

              {/* Bars */}
              <div className="flex items-end gap-1 sm:gap-1.5 h-36">
                {/* Income bar */}
                <div
                  style={{ height: `${incHeight}px` }}
                  className="w-3.5 sm:w-5 rounded-t-md bg-emerald-500 group-hover:bg-emerald-600 transition-all shadow-xs"
                  title={`Pemasukan: ${formatRupiah(item.income)}`}
                />
                {/* Expense bar */}
                <div
                  style={{ height: `${expHeight}px` }}
                  className="w-3.5 sm:w-5 rounded-t-md bg-brand-500 group-hover:bg-brand-600 transition-all shadow-xs"
                  title={`Pengeluaran: ${formatRupiah(item.expense)}`}
                />
              </div>

              {/* Month label */}
              <span className="text-[11px] font-semibold text-surface-500 mt-2">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// 3. DAILY TREND LINE CHART
export interface DailyTrendPoint {
  day: number;
  amount: number;
}

export function DailyTrendLineChart({ data }: { data: DailyTrendPoint[] }) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.amount), 50000);
  const width = 600;
  const height = 140;
  const paddingX = 20;
  const paddingY = 20;

  // Points mapped to SVG coordinates
  const points = data.map((pt, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (pt.amount / maxVal) * (height - 2 * paddingY);
    return { x, y, ...pt };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    return `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Fill area under the line
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Tren Pengeluaran Harian</CardTitle>
          <p className="text-xs text-surface-500">Aktivitas transaksi harian bulan berjalan</p>
        </div>
      </CardHeader>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
          <defs>
            <linearGradient id="brandLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaD} fill="url(#brandLineGrad)" />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#FF6B00"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt) => (
            <circle
              key={pt.day}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              className="fill-white stroke-[#FF6B00] stroke-2 hover:r-5 transition-all cursor-pointer"
            >
              <title>{`Tgl ${pt.day}: ${formatRupiah(pt.amount)}`}</title>
            </circle>
          ))}
        </svg>

        <div className="flex justify-between px-4 text-[10px] font-bold text-surface-400 mt-1">
          <span>Tgl 1</span>
          <span>Tgl 15</span>
          <span>Tgl 30</span>
        </div>
      </div>
    </Card>
  );
}
