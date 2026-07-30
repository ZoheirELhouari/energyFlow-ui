import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import type { AnomalyScanResponse } from '../../../../models/anomaly';

@Component({
  selector: 'app-severity-kpi',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './severity-kpi.component.html',
  styleUrl: './severity-kpi.component.scss',
})
export class SeverityKpiComponent {
  readonly scan = input.required<AnomalyScanResponse | null>();
}
