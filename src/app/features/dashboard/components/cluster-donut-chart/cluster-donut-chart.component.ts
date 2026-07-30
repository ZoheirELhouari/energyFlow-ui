import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { Cluster } from '../../../../models/segmentation';

@Component({
  selector: 'app-cluster-donut-chart',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cluster-donut-chart.component.html',
  styleUrl: './cluster-donut-chart.component.scss',
})
export class ClusterDonutChartComponent {
  readonly clusters = input.required<readonly Cluster[]>();

  protected readonly barOption = computed<EChartsCoreOption>(() => {
    // Largest share on top for an easy-to-read distribution.
    const rows = [...this.clusters()].sort((a, b) => a.percentage - b.percentage);

    return {
      ...DARK_CHART_DEFAULTS,
      tooltip: {
        ...DARK_CHART_DEFAULTS.tooltip,
        trigger: 'item',
        formatter: (p: { name: string; value: number }) =>
          `${p.name}<br/><b>${p.value}%</b> of meters`,
      },
      grid: { left: 6, right: 46, top: 6, bottom: 6, containLabel: true },
      xAxis: {
        type: 'value',
        max: (v: { max: number }) => Math.ceil(v.max / 5) * 5,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: rows.map((c) => c.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#475569', fontSize: 12, fontWeight: 500 },
      },
      series: [
        {
          type: 'bar',
          barWidth: 16,
          showBackground: true,
          backgroundStyle: { color: 'rgba(15, 23, 42, 0.05)', borderRadius: 8 },
          itemStyle: { borderRadius: 8 },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#0f172a',
            fontSize: 12,
            fontWeight: 700,
          },
          data: rows.map((c) => ({
            value: c.percentage,
            itemStyle: { color: c.color },
          })),
        },
      ],
    };
  });
}
