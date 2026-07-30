import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { Cluster } from '../../../../models/segmentation';
import { KPI_PRESENTATION } from '../../mock-data';

const HERO_INDEX = 3;

interface KpiView {
  readonly label: string;
  readonly value: string;
  readonly sublabel: string;
  readonly accentVar: string;
}

@Component({
  selector: 'app-kpi-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi-row.component.html',
  styleUrl: './kpi-row.component.scss',
})
export class KpiRowComponent {
  readonly clusters = input.required<readonly Cluster[]>();

  protected readonly kpis = computed<readonly KpiView[]>(() => {
    const clusters = this.clusters();

    const totalConsumption = clusters.reduce((a, c) => a + c.totalConsumption, 0);
    const totalPct = clusters.reduce((a, c) => a + c.percentage, 0);
    const weightedTemp = totalPct
      ? clusters.reduce((a, c) => a + c.avgTemperature * c.percentage, 0) / totalPct
      : 0;

    const values: readonly string[] = [
      '195K',
      `${(totalConsumption / 1_000_000).toFixed(1)}M`,
      `${weightedTemp.toFixed(1)}°C`,
      `${clusters.length}`,
    ];

    return KPI_PRESENTATION.map((p, i) => ({
      label: p.label,
      sublabel: p.sublabel,
      accentVar: p.accentVar,
      value: values[i],
    }));
  });

  /** First stats render inside the shared glass band. */
  protected readonly bandKpis = computed(() =>
    this.kpis().filter((_, i) => i !== HERO_INDEX),
  );

  /** The final stat renders as the gradient hero card. */
  protected readonly heroKpi = computed(() => this.kpis()[HERO_INDEX]);
}
