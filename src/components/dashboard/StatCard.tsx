import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  subtitle?: string;
  trendPercentage?: number;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: 'brand' | 'green' | 'blue' | 'purple' | 'red';
}

export function StatCard({
  title,
  amount,
  icon: Icon,
  subtitle,
  trendPercentage,
  trendType = 'neutral',
  color = 'brand',
}: StatCardProps) {
  const colorStyles = {
    brand: 'bg-brand-50 text-brand-600 border-brand-200/80',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    blue: 'bg-blue-50 text-blue-600 border-blue-200/80',
    purple: 'bg-purple-50 text-purple-600 border-purple-200/80',
    red: 'bg-red-50 text-red-600 border-red-200/80',
  };

  return (
    <Card className="relative overflow-hidden group hover:shadow-card-soft transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-black text-surface-900 tracking-tight">
            {formatRupiah(amount)}
          </h3>

          <div className="mt-2 flex items-center gap-2">
            {trendPercentage !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md',
                  trendType === 'positive' && 'bg-emerald-50 text-emerald-700',
                  trendType === 'negative' && 'bg-red-50 text-red-700',
                  trendType === 'neutral' && 'bg-surface-100 text-surface-600'
                )}
              >
                {trendType === 'positive' && <TrendingUp className="w-3 h-3 mr-0.5" />}
                {trendType === 'negative' && <TrendingDown className="w-3 h-3 mr-0.5" />}
                {trendPercentage > 0 ? `+${trendPercentage}%` : `${trendPercentage}%`}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-surface-500">{subtitle}</span>
            )}
          </div>
        </div>

        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105',
            colorStyles[color]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
