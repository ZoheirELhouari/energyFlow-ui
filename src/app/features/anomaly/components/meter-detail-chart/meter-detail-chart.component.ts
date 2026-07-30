import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { DecimalPipe } from '@angular/common';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_AXIS, DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { MeterDetailResponse } from '../../../../models/anomaly';

const YEAR_START = new Date(2023, 0, 1);

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  normal: '#64748b',
};

@Component({
  selector: 'app-meter-detail-chart',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meter-detail-chart.component.html',
  styleUrl: './meter-detail-chart.component.scss',
})
export class MeterDetailChartComponent {
  readonly detail = input.required<MeterDetailResponse | null>();

  protected readonly options = computed<EChartsCoreOption | null>(() => {
    const d = this.detail();
    if (!d) return null;

    const dates = Array.from({ length: d.meter_consumption.length }, (_, i) => formatDate(addDays(YEAR_START, i)));
    const color = SEVERITY_COLORS[d.severity] ?? '#64748b';

    // Build anomaly scatter data: mark anomalous days on the meter line
    const anomalyPoints: [string, number][] = [];
    for (let i = 0; i < d.anomaly_flags.length; i++) {
      if (d.anomaly_flags[i]) {
        anomalyPoints.push([dates[i], d.meter_consumption[i]]);
      }
    }

    return {
      ...DARK_CHART_DEFAULTS,
      tooltip: {
        ...DARK_CHART_DEFAULTS.tooltip,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#334155' } },
      },
      legend: {
        ...DARK_CHART_DEFAULTS.legend,
        bottom: 0,
        data: ['Meter Consumption', 'LSTM Prediction', 'Cluster Centroid', 'Anomaly'],
      },
      grid: { left: 52, right: 24, top: 20, bottom: 48 },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
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
        data: dates,
        ...DARK_AXIS,
        axisLabel: {
          ...DARK_AXIS.axisLabel,
          formatter: (v: string) => {
            const dt = new Date(v);
            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          },
          interval: 29,
        },
      },
      yAxis: {
        type: 'value',
        name: 'kWh',
        nameTextStyle: { color: '#64748b', fontSize: 11, padding: [0, 0, 0, -28] },
        ...DARK_AXIS,
      },
      series: [
        {
          name: 'Meter Consumption',
          type: 'line',
          data: d.meter_consumption,
          smooth: false,
          symbol: 'none',
          lineStyle: { width: 1.5, color },
          itemStyle: { color },
          z: 3,
        },
        {
          name: 'LSTM Prediction',
          type: 'line',
          data: d.predicted_consumption,
          smooth: false,
          symbol: 'none',
          lineStyle: { width: 2, color: '#22d3ee', type: 'dashed' },
          itemStyle: { color: '#22d3ee' },
          z: 2,
          connectNulls: false,
        },
        {
          name: 'Cluster Centroid',
          type: 'line',
          data: d.centroid_consumption,
          smooth: false,
          symbol: 'none',
          lineStyle: { width: 1, color: '#06b6d4', type: 'dotted', opacity: 0.5 },
          itemStyle: { color: '#06b6d4' },
          z: 1,
        },
        {
          name: 'Anomaly',
          type: 'scatter',
          data: anomalyPoints,
          symbolSize: 8,
          itemStyle: { color: '#ef4444', borderColor: '#fff', borderWidth: 1 },
          z: 4,
        },
      ],
    };
  });
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
