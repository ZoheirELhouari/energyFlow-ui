import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_AXIS, DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { ClusterForecastResponse } from '../../../../models/forecasting';

/** Start date of the 2023 dataset. */
const YEAR_START = new Date(2023, 0, 1);

@Component({
  selector: 'app-forecast-chart',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forecast-chart.component.html',
  styleUrl: './forecast-chart.component.scss',
})
export class ForecastChartComponent {
  readonly forecast = input.required<ClusterForecastResponse | null>();
  readonly historicalCentroid = input<readonly number[]>([]);
  readonly clusterColor = input<string>('#06b6d4');
  readonly clusterName = input<string>('Cluster');

  protected readonly options = computed<EChartsCoreOption | null>(() => {
    const centroid = this.historicalCentroid();
    const f = this.forecast();

    // Need at least historical data to render
    if (!centroid.length) return null;

    const color = this.clusterColor();
    const name = this.clusterName();
    const nHist = centroid.length;

    // Build full date axis: 365 historical days + forecast horizon
    const forecastDates = f?.predictions.map((p) => p.date) ?? [];
    const allDates: string[] = [];
    for (let i = 0; i < nHist; i++) {
      allDates.push(formatDate(addDays(YEAR_START, i)));
    }
    for (const d of forecastDates) {
      allDates.push(d);
    }

    const totalLen = allDates.length;

    // Historical series: values for [0..nHist-1], null for forecast zone
    const histData: (number | null)[] = [
      ...centroid.map((v) => round(v)),
      ...new Array(totalLen - nHist).fill(null),
    ];

    // Forecast series: null for historical, then prediction values.
    // Overlap the last historical point so the lines connect.
    const forecastValues = f?.predictions.map((p) => p.predicted_consumption_kwh) ?? [];
    const forecastData: (number | null)[] = new Array(totalLen).fill(null);
    if (forecastValues.length > 0) {
      // Bridge: set the last historical point on the forecast series too
      forecastData[nHist - 1] = round(centroid[nHist - 1]);
      for (let i = 0; i < forecastValues.length; i++) {
        forecastData[nHist + i] = round(forecastValues[i]);
      }
    }

    // Confidence band (only in the forecast zone)
    const lowerData: (number | null)[] = new Array(totalLen).fill(null);
    const bandHeightData: (number | null)[] = new Array(totalLen).fill(null);
    if (f?.predictions.length) {
      // Bridge point for band start
      lowerData[nHist - 1] = round(centroid[nHist - 1]);
      bandHeightData[nHist - 1] = 0;
      for (let i = 0; i < f.predictions.length; i++) {
        const p = f.predictions[i];
        lowerData[nHist + i] = round(p.lower_bound_95);
        bandHeightData[nHist + i] = round(p.upper_bound_95 - p.lower_bound_95);
      }
    }

    // Mark area to shade the forecast zone
    const forecastZoneStart = allDates[nHist - 1];
    const forecastZoneEnd = allDates[totalLen - 1];

    return {
      ...DARK_CHART_DEFAULTS,
      tooltip: {
        ...DARK_CHART_DEFAULTS.tooltip,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#334155' } },
        formatter: (params: Array<{ seriesName: string; value: number | null; color: string; axisValue: string }>) => {
          const visible = params.filter((p) => !p.seriesName.startsWith('__') && p.value != null);
          if (!visible.length) return '';
          const header = `<div style="margin-bottom:4px;color:#94a3b8">${visible[0].axisValue}</div>`;
          const rows = visible
            .map(
              (p) =>
                `<div style="display:flex;justify-content:space-between;gap:12px">` +
                `<span style="color:${p.color}">\u25CF ${p.seriesName}</span>` +
                `<span><b>${(p.value as number).toFixed(2)}</b> kWh</span></div>`,
            )
            .join('');
          return header + rows;
        },
      },
      legend: {
        ...DARK_CHART_DEFAULTS.legend,
        bottom: 0,
        data: [`${name} (Historical)`, `${name} (Forecast)`],
      },
      grid: { left: 52, right: 24, top: 20, bottom: 48 },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          bottom: 28,
          height: 16,
          borderColor: 'transparent',
          backgroundColor: 'rgba(255,255,255,0.03)',
          fillerColor: 'rgba(6,182,212,0.12)',
          handleStyle: { color: '#06b6d4' },
          textStyle: { color: '#64748b', fontSize: 10 },
        },
      ],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: allDates,
        ...DARK_AXIS,
        axisLabel: {
          ...DARK_AXIS.axisLabel,
          formatter: (v: string) => {
            // Show as "Jan", "Feb" etc for readability
            const d = new Date(v);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          },
          interval: 29, // roughly monthly ticks
        },
      },
      yAxis: {
        type: 'value',
        name: 'kWh',
        nameTextStyle: { color: '#64748b', fontSize: 11, padding: [0, 0, 0, -28] },
        ...DARK_AXIS,
      },
      series: [
        // Confidence band lower (invisible floor)
        {
          name: '__band_lower',
          type: 'line',
          stack: 'band',
          data: lowerData,
          lineStyle: { width: 0, opacity: 0 },
          symbol: 'none',
          areaStyle: { opacity: 0 },
          silent: true,
          z: 0,
        },
        // Confidence band height
        {
          name: '__band_upper',
          type: 'line',
          stack: 'band',
          data: bandHeightData,
          lineStyle: { width: 0, opacity: 0 },
          symbol: 'none',
          areaStyle: { color: hexAlpha(color, 0.2) },
          silent: true,
          z: 0,
        },
        // Historical (solid)
        {
          name: `${name} (Historical)`,
          type: 'line',
          data: histData,
          smooth: false,
          symbol: 'none',
          connectNulls: false,
          lineStyle: { width: 1.8, color },
          itemStyle: { color },
          z: 3,
          markArea: forecastValues.length
            ? {
                silent: true,
                itemStyle: { color: 'rgba(6, 182, 212, 0.04)' },
                data: [[
                  { xAxis: forecastZoneStart },
                  { xAxis: forecastZoneEnd },
                ]],
                label: {
                  show: true,
                  position: 'insideTop',
                  formatter: 'Forecast',
                  color: '#64748b',
                  fontSize: 11,
                },
              }
            : undefined,
        },
        // Forecast (dashed)
        {
          name: `${name} (Forecast)`,
          type: 'line',
          data: forecastData,
          smooth: false,
          symbol: 'circle',
          symbolSize: 5,
          connectNulls: false,
          lineStyle: { width: 2.5, color, type: 'dashed' },
          itemStyle: { color },
          z: 4,
        },
      ],
    };
  });
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
