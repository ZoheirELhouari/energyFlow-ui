import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import type { ModelMetrics } from '../../../../models/forecasting';

@Component({
  selector: 'app-metrics-kpi',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metrics-kpi.component.html',
  styleUrl: './metrics-kpi.component.scss',
})
export class MetricsKpiComponent {
  readonly metrics = input.required<ModelMetrics | null>();
  readonly clusterName = input<string>('');
}
