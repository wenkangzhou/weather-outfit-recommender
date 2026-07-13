'use client';

import { Clock3, Droplets, House, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RunningHeatSafetyLevel } from '@/lib/heatSafety';

interface HeatSafetyAlertProps {
  level: RunningHeatSafetyLevel;
  feelsLike: number;
}

export function HeatSafetyAlert({ level, feelsLike }: HeatSafetyAlertProps) {
  const { t } = useTranslation();

  if (level === 'normal') return null;

  const isDanger = level === 'danger';
  const actions = isDanger
    ? [
        { icon: House, label: t('outfit.heat.indoor') },
        { icon: Clock3, label: t('outfit.heat.coolerTime') },
        { icon: Droplets, label: t('outfit.heat.hydrate') },
      ]
    : [
        { icon: Clock3, label: t('outfit.heat.coolerTime') },
        { icon: Droplets, label: t('outfit.heat.hydrate') },
      ];

  return (
    <section
      role="alert"
      className={`mb-3 overflow-hidden rounded-2xl border p-4 ${
        isDanger
          ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/35 dark:text-red-100'
          : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isDanger ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
        }`}>
          <TriangleAlert size={21} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-base font-bold">
              {t(isDanger ? 'outfit.heat.dangerTitle' : 'outfit.heat.cautionTitle')}
            </h2>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              isDanger
                ? 'bg-red-600 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {t('outfit.heat.feelsLikeBadge', { temp: Math.round(feelsLike) })}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-5 opacity-85">
            {t(isDanger ? 'outfit.heat.dangerBody' : 'outfit.heat.cautionBody')}
          </p>
        </div>
      </div>

      <div className={`mt-3 grid gap-2 ${actions.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {actions.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-white/65 px-2 text-center text-[11px] font-semibold dark:bg-black/15"
          >
            <Icon size={14} className="shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {isDanger && (
        <p className="mt-3 border-t border-red-200 pt-3 text-xs font-medium leading-5 dark:border-red-800/70">
          {t('outfit.heat.gearDisclaimer')}
        </p>
      )}
    </section>
  );
}
