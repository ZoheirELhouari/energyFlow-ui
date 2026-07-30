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

  protected readonly metersOption = computed<EChartsCoreOption>(() =>
    buildDonut(
      'Smart Meter %',
      this.clusters().map((c) => ({ name: c.name, value: c.percentage, color: c.color })),
      '%',
    ),
  );

  protected readonly consumptionOption = computed<EChartsCoreOption>(() =>
    buildDonut(
      'Total Consumption',
      this.clusters().map((c) => ({
        name: c.name,
        value: round(c.totalConsumption / 1_000_000, 1),
        color: c.color,
      })),
      'M kWh',
    ),
  );

  protected readonly legend = computed(() => this.clusters());
}

function buildDonut(
  centerLabel: string,
  data: Array<{ name: string; value: number; color: string }>,
  unit: string,
): EChartsCoreOption {
  const total = data.reduce((a, b) => a + b.value, 0);
  return {
    ...DARK_CHART_DEFAULTS,
    tooltip: {
      ...DARK_CHART_DEFAULTS.tooltip,
      trigger: 'item',
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}<br/><b>${p.value} ${unit}</b> (${p.percent}%)`,
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '82%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: [
            `{name|${centerLabel}}`,
            `{value|${round(total)}}`,
            `{unit|${unit}}`,
          ].join('\n'),
          rich: {
            name: { color: '#94a3b8', fontSize: 11, fontWeight: 500, padding: [0, 0, 4, 0] },
            value: { color: '#e2e8f0', fontSize: 18, fontWeight: 700, lineHeight: 22 },
            unit: { color: '#64748b', fontSize: 10, padding: [2, 0, 0, 0] },
          },
        },
        labelLine: { show: false },
        itemStyle: { borderColor: '#12121a', borderWidth: 2 },
        emphasis: { scale: false },
        data: data.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color },
        })),
      },
    ],
  };
}

function round(n: number, digits = 1): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}
