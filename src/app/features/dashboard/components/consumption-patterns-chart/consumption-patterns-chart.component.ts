import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_AXIS, DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { Cluster } from '../../../../models/segmentation';

/**
 * Day-of-year index (0..364) where each month *starts* in a non-leap year.
 * The backend's cluster centroids are 365 values (one per day in 2023).
 */
const MONTH_START_DAYS: readonly number[] = [
  0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334,
];
const MONTH_LABELS: readonly string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

@Component({
  selector: 'app-consumption-patterns-chart',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consumption-patterns-chart.component.html',
  styleUrl: './consumption-patterns-chart.component.scss',
})
export class ConsumptionPatternsChartComponent {
  readonly clusters = input.required<readonly Cluster[]>();

  /** Cluster names the user has toggled off; empty means "show all". */
  private readonly hidden = signal<ReadonlySet<string>>(new Set());

  /** Clusters with their current visibility, for the filter chips. */
  protected readonly filters = computed(() =>
    this.clusters().map((c) => ({
      name: c.name,
      color: c.color,
      active: !this.hidden().has(c.name),
    })),
  );

  protected toggle(name: string): void {
    const next = new Set(this.hidden());
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.hidden.set(next);
  }

  protected readonly options = computed<EChartsCoreOption>(() => {
    const hidden = this.hidden();
    const clusters = this.clusters().filter((c) => !hidden.has(c.name));
    // Axis = day index 0..N-1. Use the shortest centroid length to stay safe.
    const dayCount = clusters.reduce(
      (min, c) => Math.min(min, c.centroid?.length ?? 365),
      365,
    );
    const xAxisLabels = Array.from({ length: dayCount }, (_, i) => i.toString());

    const series = clusters.map((c) => ({
      name: c.name,
      type: 'line' as const,
      data: [...c.centroid].slice(0, dayCount),
      smooth: true,
      sampling: 'lttb',
      symbol: 'none',
      lineStyle: { width: 2.4, color: c.color },
      itemStyle: { color: c.color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: hexWithAlpha(c.color, 0.32) },
            { offset: 1, color: hexWithAlpha(c.color, 0) },
          ],
        },
      },
      emphasis: { focus: 'series' },
    }));

    return {
      ...DARK_CHART_DEFAULTS,
      tooltip: {
        ...DARK_CHART_DEFAULTS.tooltip,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#334155' } },
        formatter: (params: Array<{ seriesName: string; value: number; color: string; axisValue: string }>) => {
          if (!params.length) return '';
          const dayIdx = Number(params[0].axisValue);
          const header = `<div style="margin-bottom:4px;color:#94a3b8">${formatDayLabel(dayIdx)}</div>`;
          const rows = params
            .map(
              (p) =>
                `<div style="display:flex;justify-content:space-between;gap:12px">` +
                `<span style="color:${p.color}">● ${p.seriesName}</span>` +
                `<span><b>${typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</b> kWh</span></div>`,
            )
            .join('');
          return header + rows;
        },
      },
      legend: { show: false },
      grid: { left: 44, right: 20, top: 24, bottom: 28, containLabel: false },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisLabels,
        ...DARK_AXIS,
        axisLabel: {
          ...DARK_AXIS.axisLabel,
          interval: (i: number) => MONTH_START_DAYS.includes(i),
          formatter: (value: string) => {
            const idx = MONTH_START_DAYS.indexOf(Number(value));
            return idx >= 0 ? MONTH_LABELS[idx] : '';
          },
        },
      },
      yAxis: {
        type: 'value',
        name: 'kWh',
        nameTextStyle: { color: '#64748b', fontSize: 11, padding: [0, 0, 0, -24] },
        ...DARK_AXIS,
      },
      series,
    };
  });
}

function formatDayLabel(dayIdx: number): string {
  let month = 0;
  for (let i = MONTH_START_DAYS.length - 1; i >= 0; i--) {
    if (dayIdx >= MONTH_START_DAYS[i]) { month = i; break; }
  }
  const day = dayIdx - MONTH_START_DAYS[month] + 1;
  return `${MONTH_LABELS[month]} ${day}`;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
