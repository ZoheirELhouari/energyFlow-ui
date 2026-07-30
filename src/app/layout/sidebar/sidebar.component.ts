import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { HelpModalComponent } from '../../shared/components/help-modal/help-modal.component';

interface NavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly abbr: string;
  /** 'about' opens the thesis modal; 'external' links out via `href`. */
  readonly action?: 'about' | 'external';
  readonly href?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet, HelpModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Overview', route: '/overview', icon: 'grid', abbr: 'OV' },
    { label: 'Segmentation', route: '/segmentation', icon: 'layers', abbr: 'SG' },
    { label: 'Forecasting', route: '/forecasting', icon: 'trending-up', abbr: 'FC' },
    // TODO: Add these when model finish training
    // { label: 'Anomalies', route: '/anomalies', icon: 'alert-triangle', abbr: 'AN' },
    // { label: 'Zone Map', route: '/zone-map', icon: 'map', abbr: 'ZM' },
  ];

  protected readonly bottomItems: readonly NavItem[] = [
    {
      label: 'API Docs',
      route: '',
      icon: 'book',
      abbr: 'API',
      action: 'external',
      href: 'https://api.zoheir-elhouari.com/docs',
    },
    { label: 'About', route: '/about', icon: 'info', abbr: 'AB', action: 'about' },
  ];

  protected readonly aboutOpen = signal(false);

  protected openAbout(): void {
    this.aboutOpen.set(true);
  }

  protected closeAbout(): void {
    this.aboutOpen.set(false);
  }
}
