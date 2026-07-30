import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_AXIS, DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { Cluster } from '../../../../models/segmentation';
import {
  FORECAST_CLUSTER_IDS,
  HOURLY_SLOTS,
  generateForecastSeries,
} from '../../mock-data';

@Component({
  selector: 'app-load-forecast-chart',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './load-forecast-chart.component.html',
  styleUrl: './load-forecast-chart.component.scss',
})
export class LoadForecastChartComponent {
  readonly clusters = input.required<readonly Cluster[]>();

  protected readonly options = computed<EChartsCoreOption>(() => {
    const clusters = this.clusters().filter((c) =>
      FORECAST_CLUSTER_IDS.includes(c.id),
    );
    // Full-day x-axis: 00:00 → 00:00 (wrap), ticks every 3h.
    const xLabels = [...HOURLY_SLOTS, '00:00'];

    const series = clusters.flatMap((c) => buildClusterSeries(c));

    return {
      ...DARK_CHART_DEFAULTS,
      tooltip: {
        ...DARK_CHART_DEFAULTS.tooltip,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#334155' } },
        // Hide the stacked band series from the tooltip for clarity.
        formatter: (params: Array<{ seriesName: string; value: number; color: string; axisValue: string }>) => {
          const visible = params.filter((p) => !p.seriesName.startsWith('__band'));
          if (!visible.length) return '';
          const header = `<div style="margin-bottom:4px;color:#94a3b8">${visible[0].axisValue}</div>`;
          const rows = visible
            .map(
              (p) =>
                `<div style="display:flex;justify-content:space-between;gap:12px">` +
                `<span style="color:${p.color}">● ${p.seriesName}</span>` +
                `<span><b>${p.value ?? '—'}</b> kWh</span></div>`,
            )
            .join('');
          return header + rows;
        },
      },
      legend: {
        ...DARK_CHART_DEFAULTS.legend,
        bottom: 0,
        data: clusters.map((c) => c.name),
      },
      grid: { left: 44, right: 24, top: 16, bottom: 52 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xLabels,
        ...DARK_AXIS,
        axisLabel: {
          ...DARK_AXIS.axisLabel,
          interval: (i: number, v: string) =>
            v.endsWith(':00') && Number(v.split(':')[0]) % 3 === 0,
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

/**
 * Build per-cluster series: a stacked-area pair for the confidence band
 * (lower as transparent floor + band height as translucent color), a solid
 * actual line, and a dashed forecast line.
 */
function buildClusterSeries(c: Cluster) {
  const fs = generateForecastSeries(c);
  // Extend all arrays to length 49 to close the axis at 00:00.
  const wrap = <T>(arr: readonly T[], tail: T): T[] => [...arr, tail];

  const bandHeight = fs.bandUpper.map((u, i) =>
    u === null || fs.bandLower[i] === null ? null : round(u - (fs.bandLower[i] as number)),
  );

  const stackKey = `band-${c.id}`;
  const bandBase = {
    name: `__band-lower-${c.id}`,
    type: 'line' as const,
    stack: stackKey,
    data: wrap(fs.bandLower, null),
    lineStyle: { width: 0, opacity: 0 },
    symbol: 'none',
    areaStyle: { opacity: 0 },
    showInLegend: false,
    tooltip: { show: false },
    silent: true,
    z: 0,
  };

  const bandTop = {
    name: `__band-upper-${c.id}`,
    type: 'line' as const,
    stack: stackKey,
    data: wrap(bandHeight, null),
    lineStyle: { width: 0, opacity: 0 },
    symbol: 'none',
    areaStyle: { color: hexWithAlpha(c.color, 0.18) },
    showInLegend: false,
    tooltip: { show: false },
    silent: true,
    z: 0,
  };

  const actual = {
    name: c.name,
    type: 'line' as const,
    data: wrap(fs.actual, null),
    smooth: true,
    symbol: 'none',
    connectNulls: false,
    lineStyle: { width: 2.2, color: c.color },
    itemStyle: { color: c.color },
    z: 3,
  };

  const forecast = {
    name: `${c.name} (forecast)`,
    type: 'line' as const,
    data: wrap(fs.forecast, null),
    smooth: true,
    symbol: 'none',
    connectNulls: false,
    lineStyle: { width: 2.2, color: c.color, type: 'dashed' as const },
    itemStyle: { color: c.color },
    // Keep forecast name out of the legend — legend shows the cluster name only.
    legendHoverLink: false,
    z: 2,
  };

  return [bandBase, bandTop, actual, forecast];
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
