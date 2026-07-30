import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_AXIS, DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { ClusterAnomalyStats, ModelMetricsEntry } from '../../../../models/anomaly';

@Component({
  selector: 'app-cluster-overview',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cluster-overview.component.html',
  styleUrl: './cluster-overview.component.scss',
})
export class ClusterOverviewComponent {
  readonly clusterStats = input.required<Record<string, ClusterAnomalyStats>>();
  readonly modelMetrics = input.required<Record<string, ModelMetricsEntry>>();
  readonly clusterSelected = output<number>();

  protected readonly options = computed<EChartsCoreOption | null>(() => {
    const stats = this.clusterStats();
    const metrics = this.modelMetrics();
    const ids = Object.keys(stats).map(Number).sort((a, b) => a - b);
    if (!ids.length) return null;

    const categories = ids.map(id => `Cluster ${id}`);
    const anomalyCounts = ids.map(id => stats[id].anomaly_count);
    const fraudCounts = ids.map(id => stats[id].fraud_suspects);
    const mapes = ids.map(id => metrics[id]?.mape ?? 0);

    return {
      ...DARK_CHART_DEFAULTS,
      tooltip: {
        ...DARK_CHART_DEFAULTS.tooltip,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: Array<{ seriesName: string; value: number; color: string; axisValueLabel: string }>) => {
          const label = params[0]?.axisValueLabel ?? '';
          const idx = categories.indexOf(label);
          const cid = ids[idx];
          const st = stats[cid];
          let html = `<div style="margin-bottom:6px;font-weight:600">${label}</div>`;
          html += `<div>Total Meters: <b>${st?.total_meters ?? 0}</b></div>`;
          for (const p of params) {
            html += `<div><span style="color:${p.color}">\u25CF</span> ${p.seriesName}: <b>${p.value}</b>${p.seriesName === 'Mean MAPE' ? '%' : ''}</div>`;
          }
          return html;
        },
      },
      legend: {
        ...DARK_CHART_DEFAULTS.legend,
        bottom: 0,
        data: ['Anomalous Meters', 'Fraud Suspects', 'Mean MAPE'],
      },
      grid: { left: 56, right: 56, top: 20, bottom: 48 },
      xAxis: {
        type: 'category',
        data: categories,
        ...DARK_AXIS,
      },
      yAxis: [
        {
          type: 'value',
          name: 'Count',
          nameTextStyle: { color: '#64748b', fontSize: 11 },
          ...DARK_AXIS,
        },
        {
          type: 'value',
          name: 'MAPE %',
          nameTextStyle: { color: '#64748b', fontSize: 11 },
          ...DARK_AXIS,
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Anomalous Meters',
          type: 'bar',
          data: anomalyCounts,
          itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 40,
        },
        {
          name: 'Fraud Suspects',
          type: 'bar',
          data: fraudCounts,
          itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 40,
        },
        {
          name: 'Mean MAPE',
          type: 'line',
          yAxisIndex: 1,
          data: mapes,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 2, color: '#22d3ee' },
          itemStyle: { color: '#22d3ee' },
        },
      ],
    };
  });

  protected onChartClick(event: Record<string, unknown>): void {
    const dataIndex = event['dataIndex'] as number | undefined;
    if (dataIndex != null) {
      const ids = Object.keys(this.clusterStats()).map(Number).sort((a, b) => a - b);
      if (ids[dataIndex] != null) {
        this.clusterSelected.emit(ids[dataIndex]);
      }
    }
  }
}
