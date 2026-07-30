import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import type { ForecastEvaluationResponse } from '../../../../models/forecasting';

@Component({
  selector: 'app-evaluation-table',
  standalone: true,
  imports: [DashboardCardComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evaluation-table.component.html',
  styleUrl: './evaluation-table.component.scss',
})
export class EvaluationTableComponent {
  readonly evaluation = input.required<ForecastEvaluationResponse | null>();
}
