import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { ANOMALY_ITEMS, type AnomalyItem } from '../../mock-data';

@Component({
  selector: 'app-anomaly-detection',
  standalone: true,
  imports: [DashboardCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './anomaly-detection.component.html',
  styleUrl: './anomaly-detection.component.scss',
})
export class AnomalyDetectionComponent {
  protected readonly items = signal<readonly AnomalyItem[]>(ANOMALY_ITEMS);

  protected readonly criticalCount = computed(
    () => this.items().filter((i) => i.severity === 'critical').length,
  );

  protected readonly highCount = computed(
    () => this.items().filter((i) => i.severity === 'high').length,
  );
}
