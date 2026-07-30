import { ChangeDetectionStrategy, Component, input, output, EventEmitter } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import type { MeterAnomalyItem } from '../../../../models/anomaly';

@Component({
  selector: 'app-anomaly-table',
  standalone: true,
  imports: [DashboardCardComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './anomaly-table.component.html',
  styleUrl: './anomaly-table.component.scss',
})
export class AnomalyTableComponent {
  readonly anomalies = input.required<readonly MeterAnomalyItem[]>();
  readonly meterSelected = output<number>();

  protected selectMeter(id: number): void {
    this.meterSelected.emit(id);
  }
}
