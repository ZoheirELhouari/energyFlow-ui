import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Overview', route: '/overview', icon: 'grid' },
    { label: 'Segmentation', route: '/segmentation', icon: 'layers' },
    { label: 'Forecasting', route: '/forecasting', icon: 'trending-up' },
    { label: 'Anomalies', route: '/anomalies', icon: 'alert-triangle' },
    { label: 'Zone Map', route: '/zone-map', icon: 'map' },
  ];

  protected readonly bottomItems: readonly NavItem[] = [
    { label: 'Settings', route: '/settings', icon: 'settings' },
    { label: 'Help', route: '/help', icon: 'help-circle' },
  ];
}
