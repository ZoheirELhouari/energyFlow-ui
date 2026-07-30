import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DARK_CHART_DEFAULTS } from '../../../../core/echarts.config';
import type { Cluster } from '../../../../models/segmentation';
import { GEO_ZONES, type GeoZone } from '../../mock-data';

@Component({
  selector: 'app-geographic-distribution',
  standalone: true,
  imports: [DashboardCardComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './geographic-distribution.component.html',
  styleUrl: './geographic-distribution.component.scss',
})
export class GeographicDistributionComponent {
  readonly clusters = input.required<readonly Cluster[]>();
  private readonly zones = signal<readonly GeoZone[]>(GEO_ZONES);

  protected readonly donuts = computed(() => {
    const clusters = this.clusters();
    return this.zones().map((z) => ({
      zone: z,
      option: buildDonutOption(z, clusters),
    }));
  });
}

function buildDonutOption(
  zone: GeoZone,
  clusters: readonly Cluster[],
): EChartsCoreOption {
  const data = zone.segments.map((s) => {
    const cluster = clusters.find((c) => c.id === s.clusterId);
    return {
      value: s.value,
      name: cluster?.name ?? `Cluster ${s.clusterId}`,
      itemStyle: { color: cluster?.color ?? '#64748b' },
    };
  });

  return {
    ...DARK_CHART_DEFAULTS,
    tooltip: {
      ...DARK_CHART_DEFAULTS.tooltip,
      trigger: 'item',
      formatter: '{b}<br/>{c}%',
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
            `{name|${zone.name}}`,
            `{value|${zone.dominantPercentage}%}`,
          ].join('\n'),
          rich: {
            name: { color: '#94a3b8', fontSize: 11, fontWeight: 500, padding: [0, 0, 4, 0] },
            value: { color: '#e2e8f0', fontSize: 18, fontWeight: 700, lineHeight: 22 },
          },
        },
        labelLine: { show: false },
        itemStyle: { borderColor: 'var(--bg-card)', borderWidth: 2 },
        emphasis: { scale: false },
        data,
      },
    ],
  };
}
