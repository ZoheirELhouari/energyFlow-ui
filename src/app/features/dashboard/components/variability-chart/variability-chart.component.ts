import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_AXIS, DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { Cluster } from '../../../../models/segmentation';

@Component({
  selector: 'app-variability-chart',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './variability-chart.component.html',
  styleUrl: './variability-chart.component.scss',
})
export class VariabilityChartComponent {
  readonly clusters = input.required<readonly Cluster[]>();

  protected readonly options = computed<EChartsCoreOption>(() => {
    const clusters = this.clusters();
    const categories = clusters.map((c) => c.shortName);
    const yMax = Math.max(
      36,
      Math.ceil(
        Math.max(
          ...clusters.map((c) =>
            Math.max(c.consumptionVariability, c.temperatureVariability),
          ),
          0,
        ) * 1.08,
      ),
    );

    return {
      ...DARK_CHART_DEFAULTS,
      tooltip: {
        ...DARK_CHART_DEFAULTS.tooltip,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        ...DARK_CHART_DEFAULTS.legend,
        bottom: 0,
        data: ['Consumption Variability', 'Temperature Variability'],
      },
      grid: { left: 40, right: 20, top: 16, bottom: 52 },
      xAxis: {
        type: 'category',
        data: categories,
        ...DARK_AXIS,
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        max: yMax,
        ...DARK_AXIS,
      },
      series: [
        {
          name: 'Consumption Variability',
          type: 'bar',
          barGap: '20%',
          barCategoryGap: '40%',
          data: clusters.map((c) => ({
            value: c.consumptionVariability,
            itemStyle: { color: c.color, borderRadius: [3, 3, 0, 0] },
          })),
        },
        {
          name: 'Temperature Variability',
          type: 'bar',
          data: clusters.map((c) => ({
            value: c.temperatureVariability,
            itemStyle: {
              color: hexWithAlpha(c.color, 0.45),
              borderRadius: [3, 3, 0, 0],
            },
          })),
        },
      ],
    };
  });
}

function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
