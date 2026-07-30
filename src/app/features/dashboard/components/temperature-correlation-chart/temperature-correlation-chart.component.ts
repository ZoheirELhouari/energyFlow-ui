import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_AXIS, DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { Cluster } from '../../../../models/segmentation';

@Component({
  selector: 'app-temperature-correlation-chart',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './temperature-correlation-chart.component.html',
  styleUrl: './temperature-correlation-chart.component.scss',
})
export class TemperatureCorrelationChartComponent {
  readonly clusters = input.required<readonly Cluster[]>();

  protected readonly options = computed<EChartsCoreOption>(() => {
    const clusters = this.clusters();

    const series = clusters.map((c) => ({
      name: c.name,
      type: 'scatter' as const,
      data: [[c.avgTemperature, c.avgConsumption, c.percentage]],
      symbolSize: (val: number[]) => 14 + Math.sqrt(val[2]) * 7,
      itemStyle: {
        color: c.color,
        opacity: 0.85,
        borderColor: c.color,
        borderWidth: 1,
        shadowBlur: 12,
        shadowColor: c.color,
      },
      emphasis: {
        itemStyle: { opacity: 1, shadowBlur: 18 },
      },
    }));

    return {
      ...DARK_CHART_DEFAULTS,
      tooltip: {
        ...DARK_CHART_DEFAULTS.tooltip,
        trigger: 'item',
        formatter: (p: { seriesName: string; data: number[] }) =>
          `<b>${p.seriesName}</b><br/>` +
          `Temperature: ${p.data[0]}°C<br/>` +
          `Consumption: ${p.data[1]} kWh<br/>` +
          `Meters: ${p.data[2]}%`,
      },
      legend: {
        ...DARK_CHART_DEFAULTS.legend,
        bottom: 0,
        data: clusters.map((c) => c.name),
      },
      grid: { left: 50, right: 24, top: 16, bottom: 52 },
      xAxis: {
        type: 'value',
        name: 'Temperature (°C)',
        nameLocation: 'middle',
        nameGap: 26,
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        min: 0,
        max: 14,
        ...DARK_AXIS,
      },
      yAxis: {
        type: 'value',
        name: 'kWh',
        nameTextStyle: { color: '#64748b', fontSize: 11, padding: [0, 0, 0, -20] },
        min: 0,
        max: 45,
        interval: 10,
        ...DARK_AXIS,
        axisLabel: {
          ...DARK_AXIS.axisLabel,
          formatter: (v: number) => `${v} kWh`,
        },
      },
      series,
    };
  });
}
