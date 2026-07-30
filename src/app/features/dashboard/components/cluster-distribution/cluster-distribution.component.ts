import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { Cluster } from '../../../../models/segmentation';

@Component({
  selector: 'app-cluster-distribution',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cluster-distribution.component.html',
  styleUrl: './cluster-distribution.component.scss',
})
export class ClusterDistributionComponent {
  readonly clusters = input.required<readonly Cluster[]>();
}
