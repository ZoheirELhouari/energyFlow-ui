import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_AXIS, DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { FeatureImportanceResponse } from '../../../../models/forecasting';

@Component({
  selector: 'app-feature-importance-chart',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feature-importance-chart.component.html',
  styleUrl: './feature-importance-chart.component.scss',
})
export class FeatureImportanceChartComponent {
  readonly importance = input.required<FeatureImportanceResponse | null>();
  readonly clusterColor = input<string>('#06b6d4');

  protected readonly options = computed<EChartsCoreOption | null>(() => {
    const data = this.importance();
    if (!data || !data.features.length) return null;

    const color = this.clusterColor();
    // Show in descending order (top feature at top of chart)
    const sorted = [...data.features].reverse();
    const names = sorted.map((f) => f.name);
    const values = sorted.map((f) => f.importance);

    return {
      ...DARK_CHART_DEFAULTS,
      tooltip: {
        ...DARK_CHART_DEFAULTS.tooltip,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: { left: 140, right: 24, top: 8, bottom: 24 },
      xAxis: {
        type: 'value',
        ...DARK_AXIS,
        name: 'Importance',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: names,
        ...DARK_AXIS,
        axisLabel: { ...DARK_AXIS.axisLabel, fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: values,
          barWidth: 14,
          itemStyle: {
            color,
            borderRadius: [0, 3, 3, 0],
          },
        },
      ],
    };
  });
}
