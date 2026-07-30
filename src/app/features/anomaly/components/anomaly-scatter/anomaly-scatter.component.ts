import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_AXIS, DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { MeterAnomalyItem } from '../../../../models/anomaly';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  normal: '#64748b',
};

@Component({
  selector: 'app-anomaly-scatter',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './anomaly-scatter.component.html',
  styleUrl: './anomaly-scatter.component.scss',
})
export class AnomalyScatterComponent {
  readonly anomalies = input.required<readonly MeterAnomalyItem[]>();
  readonly meterSelected = output<number>();

  protected readonly options = computed<EChartsCoreOption | null>(() => {
    const items = this.anomalies();
    if (!items.length) return null;

    // Group by severity for legend
    const groups: Record<string, { x: number; y: number; id: number }[]> = {
      critical: [],
      high: [],
      medium: [],
    };

    for (const a of items) {
      const key = a.severity as string;
      if (groups[key]) {
        groups[key].push({
          x: a.anomaly_days,
          y: a.mape,
          id: a.meter_id,
        });
      }
    }

    const series = Object.entries(groups)
      .filter(([, pts]) => pts.length > 0)
      .map(([severity, pts]) => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        type: 'scatter' as const,
        data: pts.map((p) => [p.x, p.y, p.id]),
        symbolSize: severity === 'critical' ? 10 : severity === 'high' ? 8 : 6,
        itemStyle: { color: SEVERITY_COLORS[severity] },
      }));

    return {
      ...DARK_CHART_DEFAULTS,
      tooltip: {
        ...DARK_CHART_DEFAULTS.tooltip,
        trigger: 'item',
        formatter: (p: { data: [number, number, number]; seriesName: string; color: string }) => {
          const [days, mape, id] = p.data;
          return `<div style="margin-bottom:4px;color:#94a3b8">Meter #${id}</div>` +
            `<div>Severity: <b style="color:${p.color}">${p.seriesName}</b></div>` +
            `<div>Anomaly Days: <b>${days}</b></div>` +
            `<div>MAPE: <b>${mape.toFixed(1)}</b>%</div>`;
        },
      },
      legend: {
        ...DARK_CHART_DEFAULTS.legend,
        bottom: 0,
        data: series.map((s) => s.name),
      },
      grid: { left: 56, right: 24, top: 20, bottom: 48 },
      xAxis: {
        type: 'value',
        name: 'Anomaly Days',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        ...DARK_AXIS,
      },
      yAxis: {
        type: 'value',
        name: 'MAPE %',
        nameTextStyle: { color: '#64748b', fontSize: 11, padding: [0, 0, 0, -28] },
        ...DARK_AXIS,
      },
      series,
    };
  });

  protected onChartClick(event: Record<string, unknown>): void {
    const data = event['data'] as [number, number, number] | undefined;
    if (data?.[2] != null) {
      this.meterSelected.emit(data[2]);
    }
  }
}
