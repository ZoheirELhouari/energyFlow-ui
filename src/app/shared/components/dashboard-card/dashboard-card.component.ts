import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Dark-themed card wrapper used for every dashboard zone. Consumers can
 * inject trailing actions (legend badges, dropdowns) via the named slot:
 *
 * ```html
 * <app-dashboard-card title="Consumption Patterns" subtitle="24h Profile">
 *   <span slot="actions">Confidence bands at 95%</span>
 *   <svg>...chart...</svg>
 * </app-dashboard-card>
 * ```
 */
@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.scss',
})
export class DashboardCardComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  /** Optional extra class applied to `.card` (e.g. for sizing variants). */
  readonly variant = input<string>('');
}
