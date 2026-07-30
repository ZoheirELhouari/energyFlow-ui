import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'segmentation' },
  {
    path: 'segmentation',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'forecasting',
    loadComponent: () =>
      import('./features/forecasting/forecasting.component').then((m) => m.ForecastingComponent),
  },
  {
    path: 'anomalies',
    loadComponent: () =>
      import('./features/anomaly/anomaly.component').then((m) => m.AnomalyComponent),
  },
  { path: '**', redirectTo: 'segmentation' },
];
